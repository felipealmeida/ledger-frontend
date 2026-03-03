import { useState, useCallback } from 'react';
import { LedgerApiService } from '../services/apiService';
import { BudgetResponse } from '../types/api';

export function useBudgetData() {
    const [budgetData, setBudgetData] = useState<BudgetResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (period?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await LedgerApiService.getBudgetReport(period);
            setBudgetData(response);
            return response;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Falha ao carregar orçamento';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { budgetData, isLoading, error, load, setBudgetData };
}
