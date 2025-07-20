import React, { useState } from 'react';
import { RefreshCw, Search, FileText, Activity } from 'lucide-react';

interface ControlsProps {
  onRefresh: () => void;
  onFileChange: (file: string) => void;
  onCommandChange: (command: string) => void;
  onAccountSearch: (account: string) => void;
  isLoading: boolean;
  currentFile: string;
  currentCommand: string;
}

export const Controls: React.FC<ControlsProps> = ({
  onRefresh,
  onFileChange,
  onCommandChange,
  onAccountSearch,
  isLoading,
  currentFile,
  currentCommand
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Refresh Button */}
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

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
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
