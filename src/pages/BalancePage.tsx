import React, { useState, useEffect, useCallback } from 'react';
import { PeriodSelector } from '../components/ui/PeriodSelector';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { BalanceSummary } from '../components/BalanceSummary';
import { AccountTree } from '../components/AccountTree';
import { useBalanceData } from '../hooks/useBalanceData';
import { usePricesData } from '../hooks/usePricesData';
import { Landmark, ChevronsUpDown } from 'lucide-react';

export const BalancePage: React.FC = () => {
    const { data, isLoading, error, load } = useBalanceData();
    const { rates } = usePricesData();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

    const refresh = useCallback((from?: string, to?: string) => {
        load((from ?? dateFrom) || null, (to ?? dateTo) || null);
    }, [dateFrom, dateTo, load]);

    useEffect(() => {
        load(null, null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <PeriodSelector
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onApply={refresh}
            />

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Loading */}
            {isLoading && !data && <LoadingSpinner />}

            {/* Content */}
            {data?.account && (
                <>
                    {/* Summary cards */}
                    <BalanceSummary accounts={data.account.children || []} rates={rates} />

                    {/* Account Tree */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Todas as Contas
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setExpandAll(v => v === undefined ? true : !v)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                    title={expandAll ? 'Colapsar tudo' : 'Expandir tudo'}
                                >
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="hidden sm:inline">{expandAll ? 'Colapsar' : 'Expandir'}</span>
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {data.account.children && data.account.children.length > 0 ? (
                                <AccountTree
                                    accounts={data.account.children}
                                    expandAll={expandAll}
                                />
                            ) : (
                                <EmptyState title="Nenhuma conta encontrada" />
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {!data && !isLoading && !error && (
                <EmptyState
                    title="Bem-vindo"
                    description="Os dados serão carregados automaticamente"
                    action={
                        <button onClick={() => load(null, null)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                            Carregar Dados
                        </button>
                    }
                />
            )}
        </div>
    );
};
