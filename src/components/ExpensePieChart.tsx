import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ExpenseData {
    account: string;
    amount: number;
    isOthers?: boolean; // Optional property for the "Others" category
}

interface ExpensePieChartProps {
    expenses: ExpenseData[];
    currency: string;
    maxItems?: number; // How many items to show (last slot becomes "Others" if needed)
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
    expenses,
    currency,
    maxItems = 10,
}) => {
    // Colors for the pie slices - red/orange gradient with a special color for "Others"
    const COLORS = [
        '#dc2626', // red-600
        '#ea580c', // orange-600
        '#f97316', // orange-500
        '#fb923c', // orange-400
        '#fdba74', // orange-300
        '#fed7aa', // orange-200
        '#ffedd5', // orange-100
        '#fef3c7', // amber-100
        '#fde68a', // amber-200
        '#fcd34d', // amber-300
    ];
    const othersColor = '#6b7280'; // Gray color for "Others" category

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'BRL',
        }).format(Math.abs(value));

    // Process expenses to create "top N-1 + Others"
    const processedExpenses = React.useMemo<ExpenseData[]>(() => {
        if (expenses.length <= maxItems) {
            return expenses;
        }

        const topExpenses = expenses.slice(0, maxItems - 1);
        const remainingExpenses = expenses.slice(maxItems - 1);
        const othersSum = remainingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        const othersCategory: ExpenseData = {
            account: `Others (${remainingExpenses.length} accounts)`,
            amount: othersSum,
            isOthers: true,
        };

        return [...topExpenses, othersCategory];
    }, [expenses, maxItems]);

    // Stable color map so colors don't jump when filtering
    const colorMap = React.useMemo(() => {
        const map = new Map<string, string>();
        processedExpenses.forEach((e, idx) => {
            map.set(e.account, e.isOthers ? othersColor : COLORS[idx % COLORS.length]);
        });
        return map;
    }, [processedExpenses]);

    // Hidden accounts toggle
    const [hidden, setHidden] = React.useState<Set<string>>(new Set());
    const toggleAccount = (account: string) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(account)) next.delete(account);
            else next.add(account);
            return next;
        });
    };
    const resetFilters = () => setHidden(new Set());

    // Only visible items are included in the pie and percentage accounting
    const visibleExpenses = React.useMemo(
        () => processedExpenses.filter((e) => !hidden.has(e.account)),
        [processedExpenses, hidden]
    );

    const totalVisible = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);

    const dataWithPercentage = visibleExpenses.map((e) => ({
        ...e,
        percentage: totalVisible > 0 ? ((e.amount / totalVisible) * 100).toFixed(1) : '0.0',
    }));

    // Tooltip & label for the pie
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const d = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{d.account}</p>
                    <p className={`font-mono ${d.isOthers ? 'text-gray-600' : 'text-red-600'}`}>
                    {formatCurrency(d.amount)}
                </p>
                    <p className="text-sm text-gray-600">{d.percentage}% of visible total</p>
                    {d.isOthers && (
                        <p className="text-xs text-gray-500 mt-1">Combined total of remaining expenses</p>
                    )}
                </div>
            );
        }
        return null;
    };

    const renderCustomizedLabel = (data: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = data;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (parseFloat(percentage) < 5) return null; // Hide labels for tiny slices

        return (
            <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            className="font-semibold text-sm select-none"
                >
                {`${percentage}%`}
            </text>
        );
    };

    const nothingVisible = dataWithPercentage.length === 0;

    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-800">
            Top {Math.min(maxItems, expenses.length)} Expenses Distribution
        </h2>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
            {expenses.length > maxItems && (
                <span>
                    Showing {maxItems} of {expenses.length} accounts
                </span>
            )}
        {hidden.size > 0 && (
            <button
            onClick={resetFilters}
            className="ml-2 rounded px-2 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
            title="Show all again"
                >
                Reset filters
            </button>
        )}
        </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
            {expenses.length > maxItems
                ? `Showing expense distribution for top ${maxItems - 1} accounts plus others combined`
                : 'Showing expense distribution by percentage'}
        </p>
            </div>

            <div className="p-6">
            {processedExpenses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                    <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={150}
                dataKey="amount"
                onClick={(_, index) => {
                    const d = dataWithPercentage[index];
                    if (d) toggleAccount(d.account);
                }}
                    >
                    {dataWithPercentage.map((entry) => (
                        <Cell
                        key={`cell-${entry.account}`}
                        fill={colorMap.get(entry.account) || '#999'}
                        style={{ cursor: 'pointer' }}
                            />
                    ))}
                </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
                    </ResponsiveContainer>
                    </div>

                    {/* Legend / List (shows all items; hidden items display real amount and no %) */}
                    <div className="flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Breakdown</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                    {processedExpenses.map((expense) => {
                        const isHidden = hidden.has(expense.account);
                        const color = colorMap.get(expense.account) || '#999';

                        // Find visible recomputed entry (if not hidden)
                        const current = dataWithPercentage.find((d) => d.account === expense.account);

                        // Amount: show real original when hidden; recomputed when visible
                        const displayAmount = isHidden ? expense.amount : (current?.amount ?? expense.amount);

                        // Percentage: exclude hidden from accounting
                        const displayPct = isHidden ? '—' : (current ? `${current.percentage}%` : '—');

                        return (
                            <button
                            key={expense.account}
                            onClick={() => toggleAccount(expense.account)}
                            className={`w-full flex items-center justify-between py-2 px-3 rounded transition ${
isHidden ? 'opacity-60' : 'hover:bg-gray-50'
}`}
                            title={isHidden ? 'Click to show' : 'Click to hide'}
                            role="switch"
                            aria-checked={!isHidden}
                                >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <span
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: color, opacity: isHidden ? 0.5 : 1 }}
                                />
                                <span
                            className={`text-sm font-medium truncate ${
expense.isOthers ? 'text-gray-600' : 'text-gray-700'
}`}
                                >
                                {expense.account}
                            </span>
                                {expense.isOthers && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        Combined
                                    </span>
                                )}
                            </div>
                                <div className="flex items-center space-x-3 ml-3">
                                <span className="text-sm text-gray-500">{displayPct}</span>
                                <span
                            className={`font-mono font-medium text-sm ${
expense.isOthers ? 'text-gray-600' : 'text-red-600'
}`}
                                >
                                {formatCurrency(displayAmount)}
                            </span>
                                </div>
                                </button>
                        );
                    })}
                </div>

                    {/* Total (visible only) */}
                    <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total (visible) Expenses</span>
                    <span className="font-mono text-red-600 font-bold text-lg">
                    {formatCurrency(totalVisible)}
                </span>
                    </div>
                    {hidden.size > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {hidden.size} account{hidden.size > 1 ? 's' : ''} hidden
                        </p>
                    )}
                </div>

                    {/* Note about Others category */}
                {expenses.length > maxItems && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                        <strong>Note:</strong> The "Others" category combines {expenses.length - maxItems + 1}{' '}
                    expense accounts that weren&apos;t shown individually.
                        </div>
                )}
                </div>
                    </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No expense data available</p>
                    </div>
            )}

        {/* If everything is hidden, a gentle hint */}
        {nothingVisible && (
            <div className="mt-6 text-center text-sm text-gray-500">
                All categories are hidden.{' '}
                <button onClick={resetFilters} className="underline hover:no-underline" title="Show all again">
                Reset filters
            </button>
                </div>
        )}
        </div>
            </div>
    );
};

export default ExpensePieChart;

