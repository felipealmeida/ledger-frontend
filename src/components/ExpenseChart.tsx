import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ExpenseData {
    account: string;
    amount: number;
    isOthers?: boolean; // Optional property for the "Others" category
}

interface ExpenseChartProps {
    expenses: ExpenseData[];
    currency: string;
    maxItems?: number; // New prop to control how many items to show
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ 
    expenses, 
    currency, 
    maxItems = 10 
}) => {
    // Colors for the bars - red gradient with a special color for "Others"
    const colors = [
        '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca',
        '#fee2e2', '#fef2f2', '#fffbfb', '#ffffff', '#ffffff'
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

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{data.account}</p>
                    <p className={`font-mono font-medium ${data.isOthers ? 'text-gray-600' : 'text-red-600'}`}>
                    {formatCurrency(payload[0].value)}
                </p>
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
            <div className="text-sm text-gray-500">
            {expenses.length > maxItems && (
                <span>Showing {maxItems} of {expenses.length} accounts</span>
            )}
        </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
            {expenses.length > maxItems 
                ? `Showing the largest ${maxItems - 1} expense accounts plus others combined`
                : 'Showing all expense accounts'
            }
        </p>
            </div>
            
            <div className="p-6">
            {processedExpenses.length > 0 ? (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                data={processedExpenses}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
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
                    <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {processedExpenses.map((entry: ExpenseData, index: number) => (
                        <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isOthers ? othersColor : colors[index % colors.length]} 
                            />
                    ))}
                </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Expense List */}
                    <div className="mt-6 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Details</h3>
                    <div className="space-y-2">
                    {processedExpenses.map((expense: ExpenseData, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${expense.isOthers ? 'text-gray-600' : 'text-gray-700'}`}>
                            {index + 1}. {expense.account}
                        </span>
                            {expense.isOthers && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    Combined
                                </span>
                            )}
                        </div>
                            <span className={`font-mono font-medium ${expense.isOthers ? 'text-gray-600' : 'text-red-600'}`}>
                            {formatCurrency(expense.amount)}
                        </span>
                            </div>
                    ))}
                </div>
                    
                    {expenses.length > maxItems && (
                        <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>Note:</strong> The "Others" category combines {expenses.length - maxItems + 1} expense accounts 
                        that weren\'t shown individually.
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
