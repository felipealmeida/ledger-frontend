import { useState, useCallback } from 'react';
import { LedgerApiService } from '../services/apiService';
import { LedgerBalanceResponse, LedgerAccount, AccWithBig } from '../types/api';
import Decimal from 'decimal.js';

type PieExpense = { account: string; amount: Decimal };

const normalize = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const findExpensesRoot = (nodes: LedgerAccount[]) => {
    const wanted = normalize('Despesas');
    return nodes.find((a) => {
        const first = normalize((a.fullPath || a.account).split(':')[0] || '');
        return first === wanted;
    });
};

function assertHasBig(acc: AccWithBig): asserts acc is LedgerAccount & { amountsBigInt: Record<string, Decimal> } {
    if (!acc.amountsBigInt) {
        throw new Error('amountsBigInt is missing');
    }
}

const extractExpensesRecursive = (node: LedgerAccount, currency: string): PieExpense[] => {
    assertHasBig(node as AccWithBig);
    const acc = node as AccWithBig & { amountsBigInt: Record<string, Decimal> };

    const children = node.children ?? [];
    if (children.length > 0) {
        return children.flatMap((c) => extractExpensesRecursive(c, currency));
    }

    const d = acc.amountsBigInt[currency];
    if (!d || d.isZero()) return [];
    return [{ account: node.account, amount: d.abs() }];
};

export function extractExpensesFromBalance(response: LedgerBalanceResponse | null): PieExpense[] {
    if (!response?.account) return [];
    const currency = response.currency || 'BRL';
    const roots = response.account.children || [];
    const despesas = findExpensesRoot(roots);
    if (!despesas) return [];
    const items = extractExpensesRecursive(despesas, currency);
    return items.sort((a, b) => b.amount.comparedTo(a.amount));
}

export function useBalanceData() {
    const [data, setData] = useState<LedgerBalanceResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (after: string | null, before: string | null) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await LedgerApiService.getBalance('bal', after, before);
            setData(response);
            return response;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Falha ao carregar dados';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const expenses = extractExpensesFromBalance(data);

    return { data, isLoading, error, load, expenses, setData, setError };
}
