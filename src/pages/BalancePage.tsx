import React, { useState, useEffect, useCallback } from 'react';
import { PeriodSelector } from '../components/ui/PeriodSelector';
import { AccountSearch } from '../components/ui/AccountSearch';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { BalanceSummary } from '../components/BalanceSummary';
import { AccountTree } from '../components/AccountTree';
import { useBalanceData } from '../hooks/useBalanceData';
import { usePricesData } from '../hooks/usePricesData';
import { TransactionData } from '../types/api';
import { LedgerApiService } from '../services/apiService';
import { Landmark, ArrowLeft } from 'lucide-react';

export const BalancePage: React.FC = () => {
    const { data, isLoading, error, load, loadAccount, setError } = useBalanceData();
    const { rates } = usePricesData();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [transactionData, setTransactionData] = useState<TransactionData | null>(null);

    const refresh = useCallback((from?: string, to?: string) => {
        setSelectedAccount('');
        setTransactionData(null);
        load((from ?? dateFrom) || null, (to ?? dateTo) || null);
    }, [dateFrom, dateTo, load]);

    useEffect(() => {
        load(null, null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAccountSelect = async (account: string, showTransactions?: boolean) => {
        setSelectedAccount(account);
        if (showTransactions) {
            try {
                const txData = await LedgerApiService.getAccountTransactions(account);
                setTransactionData(txData);
            } catch (err: any) {
                setError(err.message);
            }
        } else {
            setTransactionData(null);
            loadAccount(account);
        }
    };

    const handleSearch = (account: string) => {
        handleAccountSelect(account, false);
    };

    const handleBack = () => {
        setSelectedAccount('');
        setTransactionData(null);
        load(dateFrom || null, dateTo || null);
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <PeriodSelector
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onDateFromChange={setDateFrom}
                        onDateToChange={setDateTo}
                        onApply={refresh}
                    />
                </div>
                <div className="w-full sm:w-64">
                    <AccountSearch onSearch={handleSearch} />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Loading */}
            {isLoading && !data && <LoadingSpinner />}

            {/* Content */}
            {data?.account && (
                <>
                    {/* Back button */}
                    {selectedAccount && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para todas as contas
                        </button>
                    )}

                    {/* Summary cards */}
                    {!selectedAccount && !transactionData && (
                        <BalanceSummary accounts={data.account.children || []} rates={rates} />
                    )}

                    {/* Selected account info */}
                    {selectedAccount && !transactionData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                            <span className="font-medium text-blue-800">Conta: </span>
                            <span className="text-blue-700">{selectedAccount}</span>
                        </div>
                    )}

                    {/* Account Tree */}
                    {!transactionData && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {selectedAccount || 'Todas as Contas'}
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {data.account.children && data.account.children.length > 0 ? (
                                    <AccountTree
                                        accounts={data.account.children}
                                        onAccountSelect={handleAccountSelect}
                                        selectedAccount={selectedAccount}
                                    />
                                ) : (
                                    <EmptyState title="Nenhuma conta encontrada" />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Transactions */}
                    {transactionData && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Transações: {selectedAccount}
                                </h2>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactionData.transactions.map((tx: any, index: number) => (
                                            <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{tx.description}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{tx.date}</td>
                                                <td className={`px-4 py-2 text-sm font-mono text-right ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                                </td>
                                                <td className={`px-4 py-2 text-sm font-mono text-right ${tx.runningBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.runningBalance)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {!data && !isLoading && !error && (
                <EmptyState
                    title="Bem-vindo"
                    description="Os dados serão carregados automaticamente"
                    action={
                        <button onClick={() => load(null, null)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                            Carregar Dados
                        </button>
                    }
                />
            )}
        </div>
    );
};
