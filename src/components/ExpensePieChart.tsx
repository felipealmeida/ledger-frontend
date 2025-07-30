import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ExpenseData {
    account: string;
    amount: number;
}

interface ExpensePieChartProps {
    expenses: ExpenseData[];
    currency: string;
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ expenses, currency }) => {
    // Colors for the pie slices - red/orange gradient
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'BRL'
        }).format(Math.abs(value));
    };

    // Calculate total for percentage
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Prepare data with percentages
    const dataWithPercentage = expenses.map(expense => ({
        ...expense,
        percentage: ((expense.amount / total) * 100).toFixed(1)
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{data.account}</p>
                    <p className="text-red-600 font-mono">{formatCurrency(data.amount)}</p>
                    <p className="text-sm text-gray-600">{data.percentage}% of total</p>
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
            <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-800">Top 10 Expenses Distribution</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
            Showing expense distribution by percentage
        </p>
            </div>
            
            <div className="p-6">
            {expenses.length > 0 ? (
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-gray-700 truncate">
                            {expense.account}
                        </span>
                            </div>
                            <div className="flex items-center space-x-3 ml-3">
                            <span className="text-sm text-gray-500">
                            {expense.percentage}%
                            </span>
                            <span className="font-mono text-red-600 font-medium text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL'}).format(expense.amount)}
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
