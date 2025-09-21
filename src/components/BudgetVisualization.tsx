import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Target } from 'lucide-react';

// Define the budget item interface
interface BudgetItem {
    account: string;
    fullPath: string;
    actualAmount: number;
    budgetAmount: number;
    variance: number;
    variancePercentage: number;
    formattedActual: string;
    formattedBudget: string;
    formattedVariance: string;
    isOverBudget: boolean;
}

// Define the budget data interface
interface BudgetData {
    budgetItems: BudgetItem[];
    totalActual: number;
    totalBudget: number;
    totalVariance: number;
    period: string;
    timestamp: string;
}

// Define the component props interface
interface BudgetVisualizationProps {
    budgetData: BudgetData;
}

const BudgetVisualization = ({ budgetData }: BudgetVisualizationProps) => {
    const [sortBy, setSortBy] = useState('variance');

    // Process data for different visualizations
    const processedData = useMemo(() => {
        const items = budgetData.budgetItems;
        
        // Sort items based on selected criteria
        const sortedItems = [...items].sort((a, b) => {
            switch (sortBy) {
                case 'variance':
                    return Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage);
                case 'amount':
                    return Math.abs(b.actualAmount) - Math.abs(a.actualAmount);
                case 'name':
                    return a.account.localeCompare(b.account);
                default:
                    return 0;
            }
        });

        // Chart data for comparison
        const chartData = items.map(item => ({
            name: item.account.length > 15 ? item.account.substring(0, 15) + '...' : item.account,
            fullName: item.account,
            actual: Math.abs(item.actualAmount),
            budget: Math.abs(item.budgetAmount),
            variance: item.variance,
            variancePercentage: item.variancePercentage
        }));

        // Summary statistics
        const overBudgetItems = items.filter(item => item.isOverBudget);
        const underBudgetItems = items.filter(item => !item.isOverBudget && item.budgetAmount !== 0);
        const noBudgetItems = items.filter(item => item.budgetAmount === 0);

        return {
            sortedItems,
            chartData,
            stats: {
                totalItems: items.length,
                overBudgetCount: overBudgetItems.length,
                underBudgetCount: underBudgetItems.length,
                noBudgetCount: noBudgetItems.length,
                overBudgetPercentage: items.length > 0 ? (overBudgetItems.length / items.length) * 100 : 0
            }
        };
    }, [budgetData.budgetItems, sortBy]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(Math.abs(value));
    };

    const getVarianceColor = (variance: number, isPercentage = false) => {
        if (variance === 0) return 'text-gray-600';
        if (isPercentage) {
            if (Math.abs(variance) > 20) return variance > 0 ? 'text-red-600' : 'text-green-600';
            if (Math.abs(variance) > 10) return variance > 0 ? 'text-yellow-600' : 'text-blue-600';
        }
        return variance > 0 ? 'text-red-600' : 'text-green-600';
    };

    const getVarianceIcon = (isOverBudget: boolean) => {
        return isOverBudget ? 
            <AlertTriangle className="w-4 h-4 text-red-500" /> : 
            <CheckCircle className="w-4 h-4 text-green-500" />;
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800">{payload[0]?.payload?.fullName || label}</p>
                    <p className="text-blue-600">
                    Budget: {formatCurrency(payload.find((p: any) => p.dataKey === 'budget')?.value || 0)}
                </p>
                    <p className="text-green-600">
                    Actual: {formatCurrency(payload.find((p: any) => p.dataKey === 'actual')?.value || 0)}
                </p>
                    <p className={`font-medium ${getVarianceColor(payload[0]?.payload?.variancePercentage)}`}>
                    Variance: {payload[0]?.payload?.variancePercentage?.toFixed(1)}%
                    </p>
                    </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            Monthly Budget Dashboard
        </h1>
            <p className="text-gray-600 mt-2">
            Track your spending against budgeted amounts for {budgetData.period}
        </p>
            </div>
            </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
            <div>
            <p className="text-sm font-medium text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(budgetData.totalActual)}
        </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
            <div>
            <p className="text-sm font-medium text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(budgetData.totalBudget)}
        </p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
            </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
            <div>
            <p className="text-sm font-medium text-gray-600">Variance</p>
            <p className={`text-2xl font-bold ${getVarianceColor(budgetData.totalVariance)}`}>
            {formatCurrency(budgetData.totalVariance)}
        </p>
            </div>
            {budgetData.totalVariance > 0 ? 
                <TrendingUp className="w-8 h-8 text-red-600" /> : 
                <TrendingDown className="w-8 h-8 text-green-600" />
                }
        </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
            <div>
            <p className="text-sm font-medium text-gray-600">Over Budget</p>
            <p className="text-2xl font-bold text-red-600">
            {processedData.stats.overBudgetCount}/{processedData.stats.totalItems}
        </p>
            <p className="text-xs text-gray-500">
            {processedData.stats.overBudgetPercentage.toFixed(0)}% of categories
        </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Budget vs Actual Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Budget vs Actual Spending</h2>
            <select 
        value={sortBy} 
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
            <option value="variance">Sort by Variance</option>
            <option value="amount">Sort by Amount</option>
            <option value="name">Sort by Name</option>
            </select>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processedData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
        dataKey="name" 
        angle={-45} 
        textAnchor="end" 
        height={80}
        fontSize={12}
            />
            <YAxis 
        tickFormatter={(value) => formatCurrency(value)}
        fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
            <Bar dataKey="actual" fill="#10b981" name="Actual" />
            </BarChart>
            </ResponsiveContainer>
            </div>

            {/* Variance Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Variance Analysis</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
            {processedData.sortedItems.slice(0, 10).map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                    {getVarianceIcon(item.isOverBudget)}
                    <p className="font-medium text-gray-900 truncate">
                    {item.account}
                </p>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                    <p>Budget: {formatCurrency(item.budgetAmount)}</p>
                    <p>Actual: {formatCurrency(item.actualAmount)}</p>
                    </div>
                    </div>
                    <div className="text-right ml-4">
                    <p className={`font-semibold ${getVarianceColor(item.variancePercentage, true)}`}>
                    {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                    </p>
                    <p className={`text-sm ${getVarianceColor(item.variance)}`}>
                    {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                </p>
                    </div>
                    </div>
                    </div>
            ))}
        </div>
            </div>
            </div>

            {/* Detailed Budget Table */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Budget Breakdown</h2>
            </div>
            
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Category
        </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Budget
        </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actual
        </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Variance
        </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            % Variance
        </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
        </th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {processedData.sortedItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.account}</div>
                    <div className="text-sm text-gray-500">{item.fullPath}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {item.budgetAmount === 0 ? 'No Budget' : formatCurrency(item.budgetAmount)}
                </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(item.actualAmount)}
                </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getVarianceColor(item.variance)}`}>
                    {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getVarianceColor(item.variancePercentage, true)}`}>
                    {item.budgetAmount === 0 ? 'N/A' : `${item.variancePercentage > 0 ? '+' : ''}${item.variancePercentage.toFixed(1)}%`}
                </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getVarianceIcon(item.isOverBudget)}
                </td>
                    </tr>
            ))}
        </tbody>
            </table>
            </div>
            </div>
            </div>
    );
};

export default BudgetVisualization;
