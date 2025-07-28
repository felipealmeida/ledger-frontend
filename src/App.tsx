import React, { useState, useEffect } from 'react';
import { LedgerApiService } from './services/apiService';
import { LedgerBalanceResponse, HealthResponse, TransactionData } from './types/api';
import { AccountTree } from './components/AccountTree';
import { BalanceSummary } from './components/BalanceSummary';
import { Controls } from './components/Controls';
import { ExpenseChart } from './components/ExpenseChart';
import { AlertCircle, CheckCircle, Clock, BarChart3, TrendingDown } from 'lucide-react';

function App() {
    const [data, setData] = useState<LedgerBalanceResponse | null>(null);
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [currentPeriod, setCurrentPeriod] = useState('');
    const [showExpenseChart, setShowExpenseChart] = useState(false);
    
    // Controls state
    const [currentCommand, setCurrentCommand] = useState('bal');

    const [transactionData, setTransactionData] = useState<TransactionData | any>(null);

    useEffect(() => {
        loadData();
        checkHealth();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await LedgerApiService.getBalance(currentCommand, currentPeriod || undefined);
            setData(response);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const checkHealth = async () => {
        try {
            const healthResponse = await LedgerApiService.getHealth();
            setHealth(healthResponse);
        } catch (err) {
            console.warn('Health check failed:', err);
        }
    };

    // CHANGE handleAccountSearch function signature and logic:
    const handleAccountSearch = async (account: string, showTransactions: boolean = false) => {
        setIsLoading(true);
        setError(null);
        setSelectedAccount(account);
        setShowExpenseChart(false); // Reset expense chart view
        
        try {
            let response;
            if (showTransactions) {
                // CALL transactions API
                response = await LedgerApiService.getAccountTransactions(
                    account, 
                    currentPeriod || undefined
                );
                setTransactionData(response); // ADD this state
                setData(null);
            } else {
                // CALL balance API as before
                response = await LedgerApiService.getAccountBalance(
                    account, 
                    currentPeriod || undefined
                );
                setData(response);
                setTransactionData(null); // ADD this state
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to search account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        if (selectedAccount) {
            handleAccountSearch(selectedAccount);
        } else {
            loadData();
        }
    };

    const handlePeriodChange = (period: string) => {
        setCurrentPeriod(period);
        setSelectedAccount('');
        setShowExpenseChart(false);
    };

    const handleCommandChange = (command: string) => {
        setCurrentCommand(command);
        setSelectedAccount('');
        setShowExpenseChart(false);
    };

    const toggleExpenseChart = () => {
        setShowExpenseChart(!showExpenseChart);
        setSelectedAccount('');
        setTransactionData(null);
    };

    const getTop10Expenses = () => {
        if (!data || !data.accounts) return [];
        
        // Type assertion to any to work with the actual data structure
        const accountsWithBalance = data.accounts as any[];
        
        // Parse the formatted balance to get numeric value
        const parseBalance = (account: any): number => {
            // Check different possible property names
            let balanceStr = '';
            
            if (account.formattedBalance) {
                balanceStr = account.formattedBalance;
            } else if (account.balance && typeof account.balance === 'string') {
                balanceStr = account.balance;
            } else if (account.balance && typeof account.balance === 'number') {
                return account.balance;
            } else if (account.amount) {
                if (typeof account.amount === 'string') {
                    balanceStr = account.amount;
                } else if (typeof account.amount === 'number') {
                    return account.amount;
                }
            }
            
            // If we have a string, parse it
            if (balanceStr) {
                // Remove currency symbol and thousands separators, replace comma with dot
                const cleanedValue = balanceStr
                    .replace(/[R$\s]/g, '')
                    .replace(/\./g, '')
                    .replace(',', '.');
                return parseFloat(cleanedValue) || 0;
            }
            
            return 0;
        };
        
        // Get formatted balance string
        const getFormattedBalance = (account: any): string => {
            return account.formattedBalance || 
                account.balance || 
                account.amount || 
                'R$ 0,00';
        };
        
        // Filter only negative balances (expenses) and sort by amount
        const expenses = accountsWithBalance
            .map(account => ({
                account: account.account || account.name || 'Unknown',
                numericBalance: parseBalance(account),
                formattedBalance: getFormattedBalance(account)
            }))
            .filter(item => item.numericBalance < 0)
            .sort((a, b) => a.numericBalance - b.numericBalance) // Sort ascending (most negative first)
            .slice(0, 10)
            .map(item => ({
                account: item.account,
                amount: Math.abs(item.numericBalance),
                formattedAmount: item.formattedBalance
            }));
        
        return expenses;
    };

    const StatusIndicator = () => (
        <div className="flex items-center space-x-4 text-sm">
            {health && (
                <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">API Connected</span>
                    </div>
            )}
        
        {data && (
            <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">
                Updated: {new Date(data.timestamp).toLocaleString('pt-BR')}
            </span>
                </div>
        )}
        
        {data && (
            <div className="flex items-center space-x-1">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600">
                {data.accounts.length} accounts
            </span>
                </div>
        )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
            <h1 className="text-xl font-bold text-gray-900">Ledger Dashboard</h1>
            <p className="text-sm text-gray-500">Financial Account Management</p>
            </div>
            </div>
            
            <StatusIndicator />
            </div>
            </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Controls */}
            <div className="mb-6">
            <Controls
        onRefresh={handleRefresh}
        onCommandChange={handleCommandChange}
        onPeriodChange={handlePeriodChange}
        onAccountSearch={handleAccountSearch}
        isLoading={isLoading}
        currentCommand={currentCommand}
        currentPeriod={currentPeriod}
            />
            
            {/* Expense Chart Toggle Button */}
        {data && !selectedAccount && !transactionData && (
            <div className="mt-4 flex justify-center">
                <button
            onClick={toggleExpenseChart}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md transition-colors ${
showExpenseChart 
? 'bg-red-500 text-white hover:bg-red-600' 
: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
}`}
                >
                <TrendingDown className="h-5 w-5" />
                <span>{showExpenseChart ? 'Show Account Balances' : 'Show Top 10 Expenses'}</span>
                </button>
                </div>
        )}
        </div>

            {/* Error Message */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">Error:</span>
                <span className="text-red-600 ml-2">{error}</span>
                </div>
                </div>
        )}

        {/* Loading State */}
        {isLoading && !data && (
            <div className="text-center py-12">
                <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading ledger data...</span>
                </div>
                </div>
        )}

        {/* Content */}
        {data && !isLoading && (
            <>
                {/* Show Expense Chart or Normal View */}
            {showExpenseChart && !selectedAccount && !transactionData ? (
                <ExpenseChart 
                expenses={getTop10Expenses()} 
                currency={data.currency} 
                    />
            ) : (
                <>
                    {/* Balance Summary */}
                {!selectedAccount && !transactionData && (
                    <BalanceSummary 
                    accounts={data.accounts} 
                    currency={data.currency} 
                        />
                )}

                {/* Selected Account Info */}
                {selectedAccount && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-blue-800 mb-2">
                        Account Details: {selectedAccount}
                    </h2>
                        <p className="text-blue-600">
                        Showing {data.accounts.length} entries for this account
                    </p>
                        </div>
                )}

                {/* Account Tree */}
                    <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                    {selectedAccount ? `Account: ${selectedAccount}` : 'All Accounts'}
                </h2>
                    <p className="text-sm text-gray-600 mt-1">
                    Command: {currentCommand}
                </p>
                    </div>
                    
                    <div className="p-6">
                    {data.accounts.length > 0 ? (
                        <AccountTree
                        accounts={data.accounts}
                        onAccountSelect={handleAccountSearch}
                        selectedAccount={selectedAccount}
                            />
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No accounts found for the current query.</p>
                            </div>
                    )}
                </div>
                    </div>

                    {/* Clear Selection */}
                {selectedAccount && (
                    <div className="mt-6 text-center">
                        <button
                    onClick={() => {
                        setSelectedAccount('');
                        loadData();
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                        Show All Accounts
                    </button>
                        </div>
                )}
                </>
            )}
            </>
        )}

        {/* Transaction State */}
        {transactionData && (
            <div className="bg-white rounded-lg shadow-md mt-6">
                <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">
                Transactions: {selectedAccount}
            </h2>
                </div>
                <div className="p-6">
                <div className="grid grid-cols-4 gap-4 font-semibold pb-2 border-b">
                <div>Description</div>
                <div>Date</div>
                <div className="text-left">Amount</div>
                <div className="text-left">Balance</div>
                </div>
                {transactionData.transactions.map((tx: any, index: number) => (
                    <div
                    key={index}
                    className="grid grid-cols-4 gap-4 items-center py-2 border-b"
                        >
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-sm text-gray-500">{tx.date}</div>
                        <div
                    className={`font-mono text-left ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                        {tx.formattedAmount}
                    </div>
                        <div
                    className={`font-mono text-left ${tx.runningBalance > 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                        {tx.formattedRunningBalance}
                    </div>
                        </div>
                ))}
            </div>
                </div>
        )}

        {/* Empty State */}
        {!data && !isLoading && !error && (
            <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Ledger Dashboard
            </h3>
                <p className="text-gray-600 mb-4">
                Click refresh to load your ledger data
            </p>
                <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                Load Data
            </button>
                </div>
        )}
        </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-500">
            <p>Ledger Dashboard - Built with React & TypeScript</p>
            {health && (
                <p className="mt-1">
                    Connected to {health.service} | Last updated: {new Date(health.timestamp).toLocaleString('pt-BR')}
                </p>
            )}
        </div>
            </div>
            </footer>
            </div>
    );
}

export default App;
