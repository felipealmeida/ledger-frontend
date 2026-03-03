import React from 'react';
import Decimal from 'decimal.js';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { formatDecimalByCommodity } from './FormatDecimal';
import { Card, CardHeader, CardContent } from './ui/Card';

interface ExpenseData {
    account: string;
    amount: Decimal;
    isOthers?: boolean;
}

interface ExpensePieChartProps {
    expenses: ExpenseData[];
    currency: string;
    maxItems?: number;
}

const COLORS = [
    '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d',
    '#059669', '#0891b2', '#2563eb', '#7c3aed', '#c026d3',
];
const othersColor = '#6b7280';

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
    expenses,
    currency,
    maxItems = 10,
}) => {
    const formatCurrency = (d: Decimal) => formatDecimalByCommodity(currency || 'BRL', d);

    const processedExpenses = React.useMemo<ExpenseData[]>(() => {
        if (expenses.length <= maxItems) return expenses;
        const top = expenses.slice(0, maxItems - 1);
        const rest = expenses.slice(maxItems - 1);
        const othersSum = rest.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
        return [...top, { account: `Outros (${rest.length})`, amount: othersSum, isOthers: true }];
    }, [expenses, maxItems]);

    const colorMap = React.useMemo(() => {
        const map = new Map<string, string>();
        processedExpenses.forEach((e, idx) => {
            map.set(e.account, e.isOthers ? othersColor : COLORS[idx % COLORS.length]);
        });
        return map;
    }, [processedExpenses]);

    const [hidden, setHidden] = React.useState<Set<string>>(new Set());
    const toggleAccount = (account: string) => {
        setHidden(prev => {
            const next = new Set(prev);
            next.has(account) ? next.delete(account) : next.add(account);
            return next;
        });
    };

    const visibleExpenses = React.useMemo(
        () => processedExpenses.filter(e => !hidden.has(e.account)),
        [processedExpenses, hidden]
    );

    const totalVisible = React.useMemo(
        () => visibleExpenses.reduce((s, e) => s.plus(e.amount), new Decimal(0)),
        [visibleExpenses]
    );

    const dataWithPercentage = React.useMemo(
        () => visibleExpenses.map(e => ({
            ...e,
            amountNumber: Number(e.amount.toString()),
            percentage: totalVisible.gt(0) ? e.amount.div(totalVisible).mul(100).toFixed(1) : '0.0',
        })),
        [visibleExpenses, totalVisible]
    );

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const d = payload[0].payload as { account: string; amount: Decimal; percentage: string };
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{d.account}</p>
                    <p className="font-mono text-red-600">{formatCurrency(d.amount)}</p>
                    <p className="text-gray-500">{d.percentage}%</p>
                </div>
            );
        }
        return null;
    };

    const renderLabel = (data: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = data;
        if (parseFloat(percentage) < 5) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-semibold text-xs">
                {`${percentage}%`}
            </text>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Distribuição de Despesas</h2>
                    </div>
                    {hidden.size > 0 && (
                        <button onClick={() => setHidden(new Set())} className="text-sm text-blue-600 hover:text-blue-800">
                            Resetar filtros
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {processedExpenses.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={dataWithPercentage}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderLabel}
                                        outerRadius={140}
                                        dataKey="amountNumber"
                                        onClick={(_, index) => { const d = dataWithPercentage[index]; if (d) toggleAccount(d.account); }}
                                    >
                                        {dataWithPercentage.map((entry) => (
                                            <Cell key={entry.account} fill={colorMap.get(entry.account) || '#999'} style={{ cursor: 'pointer' }} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex flex-col">
                            <div className="space-y-1.5 max-h-80 overflow-y-auto">
                                {processedExpenses.map((expense) => {
                                    const isHidden = hidden.has(expense.account);
                                    const color = colorMap.get(expense.account) || '#999';
                                    const current = dataWithPercentage.find(d => d.account === expense.account);

                                    return (
                                        <button
                                            type="button"
                                            key={expense.account}
                                            onClick={() => toggleAccount(expense.account)}
                                            className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-md text-sm transition-colors ${isHidden ? 'opacity-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: color, opacity: isHidden ? 0.4 : 1 }} />
                                                <span className="truncate text-gray-700">{expense.account}</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                <span className="text-gray-400 text-xs">{isHidden ? '—' : (current ? `${current.percentage}%` : '')}</span>
                                                <span className="font-mono text-red-600 text-xs">{formatCurrency(expense.amount)}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                <span className="font-semibold text-gray-700 text-sm">Total</span>
                                <span className="font-mono text-red-600 font-bold">{formatCurrency(totalVisible)}</span>
                            </div>
                        </div>
                    </div>
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

export default ExpensePieChart;
