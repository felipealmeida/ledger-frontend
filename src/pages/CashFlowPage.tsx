import React, { useState, useEffect, useCallback } from 'react';
import { PeriodSelector } from '../components/ui/PeriodSelector';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import CashFlowView from '../components/CashFlowView';
import { useCashFlowData } from '../hooks/useCashFlowData';

export const CashFlowPage: React.FC = () => {
    const { cashFlowData, isLoading, error, load } = useCashFlowData();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const refresh = useCallback((from?: string) => {
        const period = (from ?? dateFrom) || undefined;
        load(period);
    }, [dateFrom, load]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-4">
            <PeriodSelector
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onApply={refresh}
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}

            {isLoading && !cashFlowData && <LoadingSpinner message="Carregando fluxo de caixa..." />}

            {cashFlowData && (
                <CashFlowView subtotals={cashFlowData.subtotals} currency="BRL" />
            )}

            {!cashFlowData && !isLoading && !error && (
                <EmptyState title="Sem dados de fluxo" description="Selecione um período e clique Aplicar" />
            )}
        </div>
    );
};
