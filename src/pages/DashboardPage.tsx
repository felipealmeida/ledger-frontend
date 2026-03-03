import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import Decimal from 'decimal.js';
import { KpiCard } from '../components/ui/KpiCard';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import ExpensePieChart from '../components/ExpensePieChart';
import { useBalanceData, extractExpensesFromBalance } from '../hooks/useBalanceData';
import { usePricesData, DerivedRates } from '../hooks/usePricesData';
import { LedgerAccount, LedgerBalanceResponse } from '../types/api';
import { LedgerApiService } from '../services/apiService';
import { formatDecimalByCommodity } from '../components/FormatDecimal';

type AccWithBig = LedgerAccount & { amountsBigInt?: Record<string, Decimal> };

const findTop = (list: AccWithBig[], names: string[]) => {
    const n = names.map(x => x.toLowerCase());
    return list.find(a => n.includes((a.fullPath || a.account).split(':')[0].toLowerCase()));
};

function assertHasBig(acc: AccWithBig): asserts acc is LedgerAccount & { amountsBigInt: Record<string, Decimal> } {
    if (!acc.amountsBigInt) throw new Error('amountsBigInt is missing');
}

const convertToBRL = (commodity: string, amount: Decimal, rates: DerivedRates): Decimal | null => {
    if (commodity === 'BRL' || commodity === 'R$') return amount;
    if ((commodity === 'USD' || commodity === '$' || commodity === 'USDT' || commodity === 'MUSD') && !rates.USDBRL.isZero())
        return amount.mul(rates.USDBRL);
    if (commodity === 'BTC' && !rates.BTCUSD.isZero() && !rates.USDBRL.isZero())
        return amount.mul(rates.BTCUSD).mul(rates.USDBRL);
    return null;
};

const getTotalBRL = (acc: AccWithBig | undefined, negate: boolean, rates: DerivedRates): Decimal => {
    if (!acc) return new Decimal(0);
    assertHasBig(acc);
    let total = new Decimal(0);
    for (const [commodity, val] of Object.entries(acc.amountsBigInt)) {
        if (val.isZero()) continue;
        const adjusted = negate ? val.neg() : val;
        const brl = convertToBRL(commodity, adjusted, rates);
        if (brl) total = total.plus(brl);
    }
    return total;
};

export const DashboardPage: React.FC = () => {
    const { data: monthData, isLoading, error, load } = useBalanceData();
    const [totalData, setTotalData] = useState<LedgerBalanceResponse | null>(null);
    const { rates } = usePricesData();

    useEffect(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        // Month data for expenses/income
        load(`${y}-${m}-01`, null);
        // Total data (no date filter) for patrimônio/passivos
        LedgerApiService.getBalance('bal', null, null).then(setTotalData).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoading && !monthData) return <LoadingSpinner message="Carregando dashboard..." />;
    if (error) return <EmptyState title="Erro" description={error} />;
    if (!monthData?.account) return <EmptyState title="Sem dados" description="Clique atualizar para carregar" />;

    // Patrimônio/Passivos from total (no date filter)
    const totalAccounts = (totalData?.account?.children || []) as AccWithBig[];
    const assets = getTotalBRL(findTop(totalAccounts, ['Ativos']), false, rates);
    const liabilities = getTotalBRL(findTop(totalAccounts, ['Passivos', 'Passivo']), true, rates);
    const netWorth = assets.minus(liabilities);

    // Despesas/Receitas from current month
    const monthAccounts = (monthData.account.children || []) as AccWithBig[];
    const expenses = getTotalBRL(findTop(monthAccounts, ['Despesas']), false, rates);
    const income = getTotalBRL(findTop(monthAccounts, ['Receitas']), true, rates);

    const expensesList = extractExpensesFromBalance(monthData);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                    title="Patrimônio"
                    value={formatDecimalByCommodity('BRL', netWorth)}
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="green"
                />
                <KpiCard
                    title="Despesas"
                    value={formatDecimalByCommodity('BRL', expenses)}
                    icon={<Wallet className="h-5 w-5" />}
                    color="orange"
                />
                <KpiCard
                    title="Receitas"
                    value={formatDecimalByCommodity('BRL', income)}
                    icon={<TrendingDown className="h-5 w-5" />}
                    color="blue"
                />
                <KpiCard
                    title="Passivos"
                    value={formatDecimalByCommodity('BRL', liabilities)}
                    icon={<CreditCard className="h-5 w-5" />}
                    color="red"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                    {expensesList.length > 0 ? (
                        <ExpensePieChart expenses={expensesList} currency={monthData.currency || 'BRL'} maxItems={8} />
                    ) : (
                        <Card>
                            <CardContent>
                                <EmptyState title="Sem despesas" description="Nenhuma despesa neste período" />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Quick stats */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-900">Resumo</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Contas encontradas</span>
                                <span className="font-semibold text-gray-900">{countAccounts(totalData?.account?.children || monthData.account.children || [])}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Moeda base</span>
                                <span className="font-semibold text-gray-900">{monthData.currency || 'BRL'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Última atualização</span>
                                <span className="font-semibold text-gray-900 text-sm">
                                    {new Date(monthData.timestamp).toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-600">Período</span>
                                <span className="font-semibold text-gray-900">
                                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

function countAccounts(accounts: any[]): number {
    let count = accounts.length;
    for (const acc of accounts) {
        if (acc.children?.length) count += countAccounts(acc.children);
    }
    return count;
}
