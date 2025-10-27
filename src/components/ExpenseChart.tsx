import React from 'react';
import Decimal from 'decimal.js';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ExpenseData {
    account: string;
    amount: Decimal;      // Precision-safe
    isOthers?: boolean;
    isInTop80?: boolean;
}

interface ExpenseChartProps {
    expenses: ExpenseData[];
    currency: string;
    maxItems?: number;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({
    expenses,
    currency,
    maxItems = 10,
}) => {
    const colors = [
        '#7f1d1d', '#8b1f1f', '#971f1f', '#a32222', '#af2323',
        '#bb2525', '#c72929', '#d32d2d', '#df3232', '#eb3838',
        '#f64242', '#f85151', '#fa6060', '#fc6f6f', '#fe7e7e',
        '#ff8d8d', '#ff9c9c', '#ffabab', '#ffbaba', '#ffc9c9',
    ];
    const othersColor = '#6b7280';

    const formatCurrency = (d: Decimal): string =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'BRL',
        }).format(Number(d.toString())); // only for display

    // Merge small items into "Others"
    const processedExpenses = React.useMemo((): ExpenseData[] => {
        if (expenses.length <= maxItems) return expenses;

        const top = expenses.slice(0, maxItems - 1);
        const rest = expenses.slice(maxItems - 1);
        const othersSum = rest.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

        return [
            ...top,
            { account: `Others (${rest.length} accounts)`, amount: othersSum, isOthers: true },
        ];
    }, [expenses, maxItems]);

    // Calculate 80% cutoff (Pareto)
    const totalAmount = React.useMemo(
        () => expenses.reduce((sum, e) => sum.plus(e.amount), new Decimal(0)),
        [expenses]
    );
    const eightyThreshold = totalAmount.mul(0.8);

    const expensesWithCumulative = React.useMemo(() => {
        let cumulative = new Decimal(0);
        return processedExpenses.map((e) => {
            cumulative = cumulative.plus(e.amount);
            return {
                ...e,
                isInTop80: cumulative.lte(eightyThreshold),
            };
        });
    }, [processedExpenses, eightyThreshold]);

    const top80Total = React.useMemo(
        () =>
            processedExpenses.reduce((acc, e) => {
                const next = acc.plus(e.amount);
                return next.lte(eightyThreshold) ? next : acc;
            }, new Decimal(0)),
        [processedExpenses, eightyThreshold]
    );

    const top80Percentage = React.useMemo(() => {
        if (totalAmount.isZero()) return 0;
        return top80Total.div(totalAmount).mul(100).toNumber();
    }, [totalAmount, top80Total]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const d = payload[0].payload as ExpenseData;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{d.account}</p>
                    <p className={`font-mono font-medium ${d.isOthers ? 'text-gray-600' : 'text-red-600'}`}>
                    {formatCurrency(d.amount)}
                </p>
                    {d.isOthers && (
                        <p className="text-xs text-gray-500 mt-1">
                            Combined total of remaining expenses
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-800">
            Top {Math.min(maxItems, expenses.length)} Expenses
        </h2>
            </div>
            {expenses.length > maxItems && (
                <span className="text-sm text-gray-500">
                    Showing {maxItems} of {expenses.length} accounts
                </span>
            )}
        </div>
            <p className="text-sm text-gray-600 mt-1">
            {expenses.length > maxItems
                ? `Showing the largest ${maxItems - 1} expense accounts plus "Others"`
                : 'Showing all expense accounts'}
        </p>
            </div>

            <div className="p-6">
            {processedExpenses.length > 0 ? (
                <>
                    <div className="relative">
                    <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                data={expensesWithCumulative.map((e) => ({
                    ...e,
                    amountNum: e.amount.toNumber(), // for Recharts only
                }))}
                margin={{ top: 40, right: 30, left: 20, bottom: 100 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                dataKey="account"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
                    />
                    <YAxis tickFormatter={(v) => formatCurrency(new Decimal(v))} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amountNum" radius={[4, 4, 0, 0]}>
                    {expensesWithCumulative.map((entry, i) => (
                        <Cell
                        key={entry.account}
                        fill={
                            entry.isOthers
                                ? othersColor
                                : entry.isInTop80
                                ? colors[i % colors.length]
                                : '#d1d5db'
                        }
                            />
                    ))}
                </Bar>
                    </BarChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
                    <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-700">
                    Top {Math.floor(top80Percentage)}%
                    </span>
                    </div>
                    <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span className="text-xs text-gray-700">Remaining 20%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span className="text-xs text-gray-700">Others</span>
                    </div>
                    </div>
                    </div>
                    </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Details</h3>
                    <div className="space-y-2">
                    {expensesWithCumulative.map((e, i) => (
                        <div
                        key={e.account}
                        className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded"
                            >
                            <div className="flex items-center space-x-2">
                            <div
                        className={`w-3 h-3 rounded ${
e.isOthers
? 'bg-gray-500'
: e.isInTop80
? 'bg-red-500'
: 'bg-gray-300'
}`}
                            ></div>
                            <span
                        className={`text-sm font-medium ${
e.isOthers ? 'text-gray-600' : 'text-gray-700'
}`}
                            >
                            {i + 1}. {e.account}
                        </span>
                            {e.isOthers && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    Combined
                                </span>
                            )}
                        {!e.isOthers && e.isInTop80 && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                Top 80%
                                </span>
                        )}
                        </div>
                            <span
                        className={`font-mono font-medium ${
e.isOthers ? 'text-gray-600' : 'text-red-600'
}`}
                            >
                            {formatCurrency(e.amount)}
                        </span>
                            </div>
                    ))}
                </div>

                    {expenses.length > maxItems && (
                        <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>Note:</strong> The "Others" category combines{' '}
                        {expenses.length - maxItems + 1} expense accounts not shown individually.
                            </div>
                    )}
                </div>
                    </>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No expense data available</p>
                    </div>
            )}
        </div>
            </div>
    );
};

export default ExpenseChart;
