import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ExpenseData {
    account: string;
    amount: number;
    formattedAmount: string;
}

interface ExpenseChartProps {
    expenses: ExpenseData[];
    currency: string;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses, currency }) => {
    // Colors for the bars - red gradient
    const colors = [
        '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca',
        '#fee2e2', '#fef2f2', '#fffbfb', '#ffffff', '#ffffff'
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'BRL'
        }).format(Math.abs(value));
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{payload[0].payload.account}</p>
                    <p className="text-red-600 font-mono">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Top 10 Expenses</h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    Showing the largest expense accounts
                </p>
            </div>
            
            <div className="p-6">
                {expenses.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={expenses}
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
                                    {expenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        
                        {/* Expense List */}
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Details</h3>
                            <div className="space-y-2">
                                {expenses.map((expense, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-700">
                                                {index + 1}. {expense.account}
                                            </span>
                                        </div>
                                        <span className="font-mono text-red-600 font-medium">
                                            {expense.formattedAmount}
                                        </span>
                                    </div>
                                ))}
                            </div>
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
