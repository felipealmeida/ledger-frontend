import React, { useState, useEffect } from 'react';
import { LedgerApiService } from './services/apiService';
import { LedgerBalanceResponse, HealthResponse } from './types/api';
import { AccountTree } from './components/AccountTree';
import { BalanceSummary } from './components/BalanceSummary';
import { Controls } from './components/Controls';
import { AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react';

function App() {
  const [data, setData] = useState<LedgerBalanceResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  // Controls state
  const [currentFile, setCurrentFile] = useState('main.ledger');
  const [currentCommand, setCurrentCommand] = useState('bal');

  useEffect(() => {
    loadData();
    checkHealth();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await LedgerApiService.getBalance(currentFile, currentCommand);
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

  const handleAccountSearch = async (account: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedAccount(account);
    
    try {
      const response = await LedgerApiService.getAccountBalance(account, currentFile);
      setData(response);
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

  const handleFileChange = (file: string) => {
    setCurrentFile(file);
    setSelectedAccount('');
  };

  const handleCommandChange = (command: string) => {
    setCurrentCommand(command);
    setSelectedAccount('');
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
        <Controls
          onRefresh={handleRefresh}
          onFileChange={handleFileChange}
          onCommandChange={handleCommandChange}
          onAccountSearch={handleAccountSearch}
          isLoading={isLoading}
          currentFile={currentFile}
          currentCommand={currentCommand}
        />

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
            {/* Balance Summary */}
            {!selectedAccount && (
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
                  File: {currentFile} | Command: {currentCommand}
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
