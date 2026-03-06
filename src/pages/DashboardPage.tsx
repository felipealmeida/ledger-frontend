import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Wallet, CreditCard } from 'lucide-react';
import Decimal from 'decimal.js';
import { KpiCard } from '../components/ui/KpiCard';
import { Card, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import ExpensePieChart from '../components/ExpensePieChart';
import { useBalanceData, extractExpensesFromBalance } from '../hooks/useBalanceData';
import { usePricesData, DerivedRates } from '../hooks/usePricesData';
import { LedgerAccount, LedgerBalanceResponse, AccWithBig } from '../types/api';
import { LedgerApiService } from '../services/apiService';
import { formatDecimalByCommodity } from '../components/FormatDecimal';
import { getNonZeroAmounts } from '../utils/amounts';

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
        // Month data for expenses
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

    // Despesas from current month
    const monthAccounts = (monthData.account.children || []) as AccWithBig[];
    const expenses = getTotalBRL(findTop(monthAccounts, ['Despesas']), false, rates);

    const expensesList = extractExpensesFromBalance(monthData);

    // Extract children of the Ativos top-level account
    const ativosAccount = findTop(totalAccounts, ['Ativos']);
    const assetChildren = ((ativosAccount?.children || []) as AccWithBig[]).filter(child => {
        try {
            return getNonZeroAmounts(child).length > 0;
        } catch {
            return false;
        }
    });

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                    title="Patrimônio Líquido"
                    value={formatDecimalByCommodity('BRL', netWorth)}
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="green"
                />
                <KpiCard
                    title="Ativos"
                    value={formatDecimalByCommodity('BRL', assets)}
                    icon={<DollarSign className="h-5 w-5" />}
                    color="blue"
                />
                <KpiCard
                    title="Passivos"
                    value={formatDecimalByCommodity('BRL', liabilities)}
                    icon={<CreditCard className="h-5 w-5" />}
                    color="red"
                />
                <KpiCard
                    title="Despesas do Mês"
                    value={formatDecimalByCommodity('BRL', expenses)}
                    icon={<Wallet className="h-5 w-5" />}
                    color="orange"
                />
            </div>

            {/* Content Grid: Asset Breakdown + Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Composição do Patrimônio */}
                <Card>
                    <CardContent>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Composição do Patrimônio
                        </h3>
                        <div className="divide-y divide-gray-100">
                            {assetChildren.map((child) => {
                                const amounts = getNonZeroAmounts(child);
                                return (
                                    <div key={child.fullPath || child.account}>
                                        {amounts.map(({ currency, value }) => {
                                            const brl = convertToBRL(currency, value, rates);
                                            const isBRL = currency === 'BRL' || currency === 'R$';
                                            return (
                                                <div key={`${child.account}-${currency}`} className="flex items-center py-1.5">
                                                    <span className="text-sm text-gray-700 truncate flex-1 min-w-0">{child.account}</span>
                                                    <div className="text-right flex-shrink-0 ml-3">
                                                        {isBRL ? (
                                                            <span className="text-sm text-gray-800 font-mono font-medium whitespace-nowrap">
                                                                {formatDecimalByCommodity('BRL', value)}
                                                            </span>
                                                        ) : (
                                                            <div className="whitespace-nowrap">
                                                                <span className="text-sm text-gray-800 font-mono font-medium">
                                                                    {currency} {formatDecimalByCommodity(currency, value)}
                                                                </span>
                                                                {brl && (
                                                                    <span className="text-xs text-gray-400 font-mono ml-1">
                                                                        (~{formatDecimalByCommodity('BRL', brl)})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart */}
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
        </div>
    );
};
