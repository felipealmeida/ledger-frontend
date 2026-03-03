import { useState, useCallback } from 'react';
import { LedgerApiService } from '../services/apiService';
import { LedgerSubTotalsResponse } from '../types/api';

export function useCashFlowData() {
    const [cashFlowData, setCashFlowData] = useState<LedgerSubTotalsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (period?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await LedgerApiService.getCashFlow(period);
            setCashFlowData(response);
            return response;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Falha ao carregar fluxo de caixa';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadAccount = useCallback(async (account: string, period?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await LedgerApiService.getAccountCashFlow(account, period);
            setCashFlowData(response);
            return response;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Falha ao carregar fluxo de caixa';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { cashFlowData, isLoading, error, load, loadAccount, setCashFlowData };
}
