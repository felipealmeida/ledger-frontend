import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Target } from 'lucide-react';
import { KpiCard } from './ui/KpiCard';
import { Card, CardHeader, CardContent } from './ui/Card';

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

interface BudgetData {
    budgetItems: BudgetItem[];
    totalActual: number;
    totalBudget: number;
    totalVariance: number;
    period: string;
    timestamp: string;
}

interface BudgetVisualizationProps {
    budgetData: BudgetData;
}

const BudgetVisualization = ({ budgetData }: BudgetVisualizationProps) => {
    const [sortBy, setSortBy] = useState('variance');

    const processedData = useMemo(() => {
        const items = budgetData.budgetItems;
        const sortedItems = [...items].sort((a, b) => {
            switch (sortBy) {
                case 'variance': return Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage);
                case 'amount': return Math.abs(b.actualAmount) - Math.abs(a.actualAmount);
                case 'name': return a.account.localeCompare(b.account);
                default: return 0;
            }
        });

        const chartData = items.map(item => ({
            name: item.account.length > 15 ? item.account.substring(0, 15) + '...' : item.account,
            fullName: item.account,
            actual: Math.abs(item.actualAmount),
            budget: Math.abs(item.budgetAmount),
            variance: item.variance,
            variancePercentage: item.variancePercentage
        }));

        const overBudgetItems = items.filter(item => item.isOverBudget);
        return {
            sortedItems,
            chartData,
            stats: {
                totalItems: items.length,
                overBudgetCount: overBudgetItems.length,
                overBudgetPercentage: items.length > 0 ? (overBudgetItems.length / items.length) * 100 : 0,
            }
        };
    }, [budgetData.budgetItems, sortBy]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(value));

    const getVarianceColor = (variance: number) =>
        variance === 0 ? 'text-gray-600' : variance > 0 ? 'text-red-600' : 'text-green-600';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{payload[0]?.payload?.fullName || label}</p>
                    <p className="text-blue-600">Orçado: {formatCurrency(payload.find((p: any) => p.dataKey === 'budget')?.value || 0)}</p>
                    <p className="text-emerald-600">Real: {formatCurrency(payload.find((p: any) => p.dataKey === 'actual')?.value || 0)}</p>
                    <p className={getVarianceColor(payload[0]?.payload?.variancePercentage)}>
                        Variação: {payload[0]?.payload?.variancePercentage?.toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                    title="Total Gasto"
                    value={formatCurrency(budgetData.totalActual)}
                    icon={<DollarSign className="h-5 w-5" />}
                    color="blue"
                />
                <KpiCard
                    title="Total Orçado"
                    value={formatCurrency(budgetData.totalBudget)}
                    icon={<Target className="h-5 w-5" />}
                    color="green"
                />
                <KpiCard
                    title="Variação"
                    value={formatCurrency(budgetData.totalVariance)}
                    icon={budgetData.totalVariance > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    color={budgetData.totalVariance > 0 ? 'red' : 'green'}
                />
                <KpiCard
                    title="Acima do Orçamento"
                    value={`${processedData.stats.overBudgetCount}/${processedData.stats.totalItems}`}
                    subtitle={`${processedData.stats.overBudgetPercentage.toFixed(0)}% das categorias`}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color="red"
                />
            </div>

            {/* Chart + Variance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Orçado vs Real</h2>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="variance">Por Variação</option>
                                <option value="amount">Por Valor</option>
                                <option value="name">Por Nome</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={processedData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                                <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={11} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="budget" fill="#3b82f6" name="Orçado" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="actual" fill="#10b981" name="Real" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-900">Maiores Variações</h2>
                    </CardHeader>
                    <CardContent className="max-h-[420px] overflow-y-auto space-y-3">
                        {processedData.sortedItems.slice(0, 10).map((item, index) => (
                            <div key={index} className="border-b border-gray-100 pb-2.5 last:border-b-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {item.isOverBudget ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                                        <span className="text-sm font-medium text-gray-900 truncate">{item.account}</span>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-sm font-semibold ${getVarianceColor(item.variancePercentage)}`}>
                                            {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-1 text-xs text-gray-500 ml-5">
                                    Orçado: {formatCurrency(item.budgetAmount)} | Real: {formatCurrency(item.actualAmount)}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-900">Detalhamento do Orçamento</h2>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Categoria</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">Orçado</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">Real</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">Variação</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">%</th>
                                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase w-16">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {processedData.sortedItems.map((item, index) => (
                                <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                                    <td className="px-4 py-2.5">
                                        <div className="text-sm font-medium text-gray-900">{item.account}</div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-sm text-gray-700 font-mono">
                                        {item.budgetAmount === 0 ? '—' : formatCurrency(item.budgetAmount)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-sm text-gray-700 font-mono">
                                        {formatCurrency(item.actualAmount)}
                                    </td>
                                    <td className={`px-4 py-2.5 text-right text-sm font-mono font-medium ${getVarianceColor(item.variance)}`}>
                                        {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                                    </td>
                                    <td className={`px-4 py-2.5 text-right text-sm font-medium ${getVarianceColor(item.variancePercentage)}`}>
                                        {item.budgetAmount === 0 ? '—' : `${item.variancePercentage > 0 ? '+' : ''}${item.variancePercentage.toFixed(1)}%`}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        {item.isOverBudget ? <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" /> : <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default BudgetVisualization;
