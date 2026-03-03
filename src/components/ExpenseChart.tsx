import React from 'react';
import Decimal from 'decimal.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { formatDecimalByCommodity } from './FormatDecimal';
import { Card, CardHeader, CardContent } from './ui/Card';

interface ExpenseData {
    account: string;
    amount: Decimal;
    isOthers?: boolean;
    isInTop80?: boolean;
}

interface ExpenseChartProps {
    expenses: ExpenseData[];
    currency: string;
    maxItems?: number;
}

const COLORS = [
    '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444',
    '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2',
];
const othersColor = '#6b7280';

const ExpenseChart: React.FC<ExpenseChartProps> = ({
    expenses,
    currency,
    maxItems = 10,
}) => {
    const fmtCurrency = (d: Decimal): string => formatDecimalByCommodity(currency || 'BRL', d);

    const processedExpenses = React.useMemo((): ExpenseData[] => {
        if (expenses.length <= maxItems) return expenses;
        const top = expenses.slice(0, maxItems - 1);
        const rest = expenses.slice(maxItems - 1);
        const othersSum = rest.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
        return [...top, { account: `Outros (${rest.length})`, amount: othersSum, isOthers: true }];
    }, [expenses, maxItems]);

    const totalAmount = React.useMemo(
        () => expenses.reduce((sum, e) => sum.plus(e.amount), new Decimal(0)),
        [expenses]
    );
    const eightyThreshold = totalAmount.mul(0.8);

    const expensesWithCumulative = React.useMemo(() => {
        let cumulative = new Decimal(0);
        return processedExpenses.map((e) => {
            cumulative = cumulative.plus(e.amount);
            return { ...e, isInTop80: cumulative.lte(eightyThreshold) };
        });
    }, [processedExpenses, eightyThreshold]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const d = payload[0].payload as ExpenseData;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{d.account}</p>
                    <p className="font-mono text-red-600">{fmtCurrency(d.amount)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Top Despesas</h2>
                    </div>
                    {expenses.length > maxItems && (
                        <span className="text-xs text-gray-500">{maxItems} de {expenses.length}</span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {processedExpenses.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart
                                data={expensesWithCumulative.map(e => ({ ...e, amountNum: e.amount.toNumber() }))}
                                margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="account" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => fmtCurrency(new Decimal(v))} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="amountNum" radius={[4, 4, 0, 0]}>
                                    {expensesWithCumulative.map((entry, i) => (
                                        <Cell
                                            key={entry.account}
                                            fill={entry.isOthers ? othersColor : entry.isInTop80 ? COLORS[i % COLORS.length] : '#d1d5db'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-600 rounded" /><span>Top 80%</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-300 rounded" /><span>Restante</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-500 rounded" /><span>Outros</span></div>
                        </div>

                        {/* Details */}
                        <div className="mt-4 pt-4 border-t space-y-1.5">
                            {expensesWithCumulative.map((e, i) => (
                                <div key={e.account} className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-2.5 h-2.5 rounded flex-shrink-0 ${e.isOthers ? 'bg-gray-500' : e.isInTop80 ? 'bg-red-500' : 'bg-gray-300'}`} />
                                        <span className="truncate text-gray-700">{i + 1}. {e.account}</span>
                                    </div>
                                    <span className="font-mono text-red-600 text-xs ml-2 flex-shrink-0">{fmtCurrency(e.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <TrendingDown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma despesa encontrada</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ExpenseChart;
