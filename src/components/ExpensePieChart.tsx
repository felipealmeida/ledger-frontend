import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ExpenseData {
    account: string;
    amount: number;
    isOthers?: boolean; // Optional property for the "Others" category
}

interface ExpensePieChartProps {
    expenses: ExpenseData[];
    currency: string;
    maxItems?: number; // New prop to control how many items to show
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ 
    expenses, 
    currency, 
    maxItems = 10 
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'BRL'
        }).format(Math.abs(value));
    };

    // Process expenses to create the chart data
    const processedExpenses = React.useMemo((): ExpenseData[] => {
        if (expenses.length <= maxItems) {
            return expenses;
        }

        // Take the top (maxItems - 1) expenses
        const topExpenses = expenses.slice(0, maxItems - 1);
        
        // Sum the remaining expenses
        const remainingExpenses = expenses.slice(maxItems - 1);
        const othersSum = remainingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Add "Others" category
        const othersCategory: ExpenseData = {
            account: `Others (${remainingExpenses.length} accounts)`,
            amount: othersSum,
            isOthers: true
        };

        return [...topExpenses, othersCategory];
    }, [expenses, maxItems]);

    // Calculate total for percentage
    const total = processedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Prepare data with percentages
    const dataWithPercentage = processedExpenses.map((expense: ExpenseData) => ({
        ...expense,
        percentage: ((expense.amount / total) * 100).toFixed(1)
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{data.account}</p>
                    <p className={`font-mono ${data.isOthers ? 'text-gray-600' : 'text-red-600'}`}>
                    {formatCurrency(data.amount)}
                </p>
                    <p className="text-sm text-gray-600">{data.percentage}% of total</p>
                    {data.isOthers && (
                        <p className="text-xs text-gray-500 mt-1">
                            Combined total of remaining expenses
                        </p>
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

        if (parseFloat(percentage) < 5) return null; // Don't show label for small slices

        return (
            <text 
            x={x} 
            y={y} 
            fill="white" 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
            className="font-semibold text-sm"
                >
                {`${percentage}%`}
            </text>
        );
    };

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
            <div className="text-sm text-gray-500">
            {expenses.length > maxItems && (
                <span>Showing {maxItems} of {expenses.length} accounts</span>
            )}
        </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
            {expenses.length > maxItems 
                ? `Showing expense distribution for top ${maxItems - 1} accounts plus others combined`
                : 'Showing expense distribution by percentage'
            }
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
                fill="#8884d8"
                dataKey="amount"
                    >
                    {dataWithPercentage.map((entry, index) => (
                        <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isOthers ? othersColor : COLORS[index % COLORS.length]} 
                            />
                    ))}
                </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                    </ResponsiveContainer>
                    </div>

                    {/* Legend / List */}
                    <div className="flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Breakdown</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dataWithPercentage.map((expense, index) => (
                        <div 
                        key={index} 
                        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded"
                            >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div 
                        className="w-4 h-4 rounded flex-shrink-0" 
                        style={{ 
                            backgroundColor: expense.isOthers 
                                ? othersColor 
                                : COLORS[index % COLORS.length] 
                        }}
                            />
                            <span className={`text-sm font-medium truncate ${
expense.isOthers ? 'text-gray-600' : 'text-gray-700'
}`}>
                            {expense.account}
                        </span>
                            {expense.isOthers && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    Combined
                                </span>
                            )}
                        </div>
                            <div className="flex items-center space-x-3 ml-3">
                            <span className="text-sm text-gray-500">
                            {expense.percentage}%
                            </span>
                            <span className={`font-mono font-medium text-sm ${
expense.isOthers ? 'text-gray-600' : 'text-red-600'
}`}>
                            {formatCurrency(expense.amount)}
                        </span>
                            </div>
                            </div>
                    ))}
                </div>
                    
                    {/* Total */}
                    <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total Expenses</span>
                    <span className="font-mono text-red-600 font-bold text-lg">
                    {formatCurrency(total)}
                </span>
                    </div>
                    </div>

                    {/* Note about Others category */}
                {expenses.length > maxItems && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                        <strong>Note:</strong> The "Others" category combines {expenses.length - maxItems + 1} expense accounts 
                    that weren\'t shown individually.
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
        </div>
            </div>
    );
};

export default ExpensePieChart;

