import React, { useState, useEffect, useCallback } from 'react';
import { PeriodSelector } from '../components/ui/PeriodSelector';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import ExpensePieChart from '../components/ExpensePieChart';
import ExpenseChart from '../components/ExpenseChart';
import { useBalanceData, extractExpensesFromBalance } from '../hooks/useBalanceData';
import { LedgerApiService } from '../services/apiService';

export const ExpensesPage: React.FC = () => {
    const { data, isLoading, error, load } = useBalanceData();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeTab, setActiveTab] = useState<'top' | 'compare'>('top');

    // Compare months state
    const [periodA, setPeriodA] = useState('');
    const [periodB, setPeriodB] = useState('');
    const [compareData, setCompareData] = useState<{ a: any; b: any } | null>(null);
    const [compareLoading, setCompareLoading] = useState(false);

    const refresh = useCallback((from?: string, to?: string) => {
        load((from ?? dateFrom) || null, (to ?? dateTo) || null);
    }, [dateFrom, dateTo, load]);

    useEffect(() => {
        load(null, null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const expenses = extractExpensesFromBalance(data);

    const handleCompare = async () => {
        if (!periodA || !periodB) return;
        setCompareLoading(true);
        try {
            // Parse periods like "2025-07" into after/before
            const parseMonth = (p: string) => {
                const [y, m] = p.split('-').map(Number);
                const after = `${y}-${String(m).padStart(2, '0')}-01`;
                const lastDay = new Date(y, m, 0).getDate();
                const before = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                return { after, before };
            };

            const rangeA = parseMonth(periodA);
            const rangeB = parseMonth(periodB);

            const [respA, respB] = await Promise.all([
                LedgerApiService.getBalance('bal', rangeA.after, rangeA.before),
                LedgerApiService.getBalance('bal', rangeB.after, rangeB.before),
            ]);

            const expA = extractExpensesFromBalance(respA);
            const expB = extractExpensesFromBalance(respB);

            setCompareData({
                a: { label: periodA, expenses: expA.map(e => ({ account: e.account, amount: e.amount.toNumber() })) },
                b: { label: periodB, expenses: expB.map(e => ({ account: e.account, amount: e.amount.toNumber() })) },
            });
        } catch (err) {
            console.error('Compare failed:', err);
        } finally {
            setCompareLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
                <PeriodSelector
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onApply={refresh}
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('top')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'top' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Top Despesas
                </button>
                <button
                    onClick={() => setActiveTab('compare')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'compare' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Comparar Meses
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}

            {isLoading && !data && <LoadingSpinner />}

            {/* Top Expenses Tab */}
            {activeTab === 'top' && expenses.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ExpensePieChart expenses={expenses} currency={data?.currency || 'BRL'} maxItems={10} />
                    <ExpenseChart expenses={expenses} currency={data?.currency || 'BRL'} maxItems={15} />
                </div>
            )}
            {activeTab === 'top' && !isLoading && expenses.length === 0 && data && (
                <EmptyState title="Sem despesas" description="Nenhuma despesa encontrada para o período selecionado" />
            )}

            {/* Compare Tab */}
            {activeTab === 'compare' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-lg border border-gray-200">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Período A</label>
                            <input
                                type="month"
                                value={periodA}
                                onChange={(e) => setPeriodA(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Período B</label>
                            <input
                                type="month"
                                value={periodB}
                                onChange={(e) => setPeriodB(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleCompare}
                            disabled={!periodA || !periodB || compareLoading}
                            className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {compareLoading ? 'Carregando...' : 'Comparar'}
                        </button>
                    </div>

                    {compareData && (
                        <React.Suspense fallback={<LoadingSpinner />}>
                            {React.createElement(
                                React.lazy(() => import('../components/ExpenseDiffChart')),
                                {
                                    monthA: compareData.a,
                                    monthB: compareData.b,
                                    currency: data?.currency || 'BRL',
                                    maxItems: 12,
                                }
                            )}
                        </React.Suspense>
                    )}
                </div>
            )}
        </div>
    );
};
