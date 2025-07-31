// CashFlowView.tsx
import React from 'react';
import { LedgerSubTotalNode } from '../types/api';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CashFlowViewProps {
    subtotals: LedgerSubTotalNode[];
    currency: string;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ subtotals, currency }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: currency || 'BRL' 
        }).format(amount);
    };

    const totalInflow = subtotals.reduce((sum, item) => sum + item.inflow_amount, 0);
    const totalOutflow = subtotals.reduce((sum, item) => sum + Math.abs(item.outflow_amount), 0);
    const netFlow = totalInflow - totalOutflow;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Total Inflow</p>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(totalInflow)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Total Outflow</p>
                            <p className="text-2xl font-bold text-red-700">
                                {formatCurrency(totalOutflow)}
                            </p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 border ${netFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                Net Cash Flow
                            </p>
                            <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                {formatCurrency(netFlow)}
                            </p>
                        </div>
                        {netFlow >= 0 ? (
                            <TrendingUp className="h-8 w-8 text-blue-500" />
                        ) : (
                            <TrendingDown className="h-8 w-8 text-orange-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* Cash Flow Items */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">Cash Flow Details</h2>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-4">Description</th>
                                    <th className="text-right py-2 px-4 text-green-600">Inflow</th>
                                    <th className="text-right py-2 px-4 text-red-600">Outflow</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subtotals.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-4">{item.description}</td>
                                        <td className="text-right py-2 px-4 text-green-600">
                                            {item.inflow_amount > 0 ? formatCurrency(item.inflow_amount) : '-'}
                                        </td>
                                        <td className="text-right py-2 px-4 text-red-600">
                                            {item.outflow_amount < 0 ? formatCurrency(Math.abs(item.outflow_amount)) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
