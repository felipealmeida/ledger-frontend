import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Decimal from 'decimal.js';
import { LedgerAccount } from '../types/api';

type AccWithBig = LedgerAccount & { amountsBigInt?: Record<string, Decimal> };

interface BalanceSummaryProps {
    accounts: AccWithBig[];
}

const findTop = (list: AccWithBig[], names: string[]) => {
    const n = names.map((x) => x.toLowerCase());
    return list.find((a) =>
        n.includes((a.fullPath || a.account).split(':')[0].toLowerCase())
                    );
};

/** Format Decimal with pt-BR separators, preserving all fraction digits present */
const formatDecimalPtBR = (d: Decimal | undefined): string => {
    if (!d) return '—';
    // Keep the natural scale of the Decimal
    const s = d.toFixed(); // no rounding beyond existing scale
    const [intPart, fracPart] = s.split('.');
    const intBR = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return fracPart ? `${intBR},${fracPart}` : intBR;
};

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts }) => {
    const { map, currencies } = useMemo(() => {
        const map = {
            assets: findTop(accounts, ['Ativos']),
            liabilities: findTop(accounts, ['Passivos', 'Passivo']),
            expenses: findTop(accounts, ['Despesas']),
            income: findTop(accounts, ['Receitas']),
        };

        // Build currency list from whatever is available
        const set = new Set<string>();
        Object.values(map).forEach((a) => {
            if (!a) return;
            const keys =
                (a as AccWithBig).amountsBigInt
                ? Object.keys((a as AccWithBig).amountsBigInt!)
                : Object.keys(a.amounts || {});
            keys.forEach((k) => set.add(k));
        });

        return { map, currencies: Array.from(set) };
    }, [accounts]);

    const icon = {
        assets: <TrendingUp className="w-3 h-3 text-green-600" />,
        liabilities: <TrendingDown className="w-3 h-3 text-red-600" />,
        expenses: <TrendingDown className="w-3 h-3 text-orange-600" />,
        income: <DollarSign className="w-3 h-3 text-blue-600" />,
    } as const;

    const color = {
        assets: 'border-l-green-500',
        liabilities: 'border-l-red-500',
        expenses: 'border-l-orange-500',
        income: 'border-l-blue-500',
    } as const;

    const order = ['assets', 'liabilities', 'expenses', 'income'] as const;

    return (
        <div className="text-xs space-y-1">
            {currencies.map((cur) => (
                <div key={cur} className="grid grid-cols-2 md:grid-cols-4 gap-1">
                    {order.map((k) => {
                        const acc = map[k];
                        const valDec =
                            (acc as AccWithBig)?.amountsBigInt?.[cur] ?? undefined;

                        return (
                            <div
                            key={k}
                            className={`px-2 py-1 bg-white border-l-2 ${color[k]} flex items-center justify-between rounded-sm shadow-sm`}
                                >
                                <span className="truncate text-gray-700">
                                {formatDecimalPtBR(valDec)}
                            </span>
                                <span className="flex items-center gap-1 text-gray-500">
                                {icon[k]} {cur}
                            </span>
                                </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default BalanceSummary;
