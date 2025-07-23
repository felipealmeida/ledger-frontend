import React, { useState } from 'react';
import { RefreshCw, Search, FileText, Activity, Calendar } from 'lucide-react';

interface ControlsProps {
  onRefresh: () => void;
  onFileChange: (file: string) => void;
  onCommandChange: (command: string) => void;
  onAccountSearch: (account: string) => void;
  onPeriodChange: (period: string) => void;
  isLoading: boolean;
  currentFile: string;
  currentCommand: string;
  currentPeriod: string;
}

export const Controls: React.FC<ControlsProps> = ({
  onRefresh,
  onFileChange,
  onCommandChange,
  onPeriodChange,
  onAccountSearch,
  isLoading,
  currentFile,
  currentCommand,
  currentPeriod
}) => {
  const [searchAccount, setSearchAccount] = useState('');

  const handleAccountSearch = () => {
    if (searchAccount.trim()) {
      onAccountSearch(searchAccount.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAccountSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Top Row - Main Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {/* File Input */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <FileText className="h-4 w-4 mr-1" />
            Ledger File
          </label>
          <input
            type="text"
            value={currentFile}
            onChange={(e) => onFileChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="main.ledger"
          />
        </div>

        {/* Command Input */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Activity className="h-4 w-4 mr-1" />
            Command
          </label>
          <select
            value={currentCommand}
            onChange={(e) => onCommandChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="bal">Balance (bal)</option>
            <option value="bal Assets">Assets Only</option>
            <option value="bal Liabilities">Liabilities Only</option>
            <option value="bal Income">Income Only</option>
            <option value="bal Expenses">Expenses Only</option>
            <option value="reg">Register (reg)</option>
          </select>
        </div>

        {/* Period Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4 mr-1" />
            Period Filter
          </label>
          <input
            type="text"
            value={currentPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="2025/07 or 2025"
          />
        </div>

        {/* Account Search */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Search className="h-4 w-4 mr-1" />
            Search Account
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchAccount}
              onChange={(e) => setSearchAccount(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Account name..."
            />
            <button
              onClick={handleAccountSearch}
              disabled={!searchAccount.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Actions
          </label>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Period Quick Buttons */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Quick Period:</span>
          <button
            onClick={() => onPeriodChange(new Date().getFullYear().toString())}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            This Year
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              onPeriodChange(`${now.getFullYear()}/${month}`);
            }}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
              const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
              const month = String(lastMonth).padStart(2, '0');
              onPeriodChange(`${year}/${month}`);
            }}
            className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
          >
            Last Month
          </button>
          <button
            onClick={() => onPeriodChange('')}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick Account Filters */}
      <div>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
          <button
            onClick={() => onCommandChange('bal Ativos')}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Ativos
          </button>
          <button
            onClick={() => onCommandChange('bal Passivo')}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
          >
            Passivos
          </button>
          <button
            onClick={() => onCommandChange('bal Receitas')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            Receitas
          </button>
          <button
            onClick={() => onCommandChange('bal Despesas')}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
          >
            Despesas
          </button>
          <button
            onClick={() => onCommandChange('bal')}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            All Accounts
          </button>
        </div>
      </div>
    </div>
  );
};
