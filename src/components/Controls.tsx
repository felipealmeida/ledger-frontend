import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Activity, Calendar } from 'lucide-react';

interface ControlsProps {
    onRefresh: () => void;
    onCommandChange: (command: string) => void;
    onAccountSearch: (account: string) => void;
    onPeriodChange: (after: string | null, before: string | null) => void;
    isLoading: boolean;
    currentCommand: string;
    currentPeriod: string; // still accepted; shown as the “effective” value if no range is set
}

export const Controls: React.FC<ControlsProps> = ({
    onRefresh,
    onCommandChange,
    onAccountSearch,
    onPeriodChange,
    isLoading,
    currentCommand,
    currentPeriod,
}) => {
    const [searchAccount, setSearchAccount] = useState('');
    const [dateFrom, setDateFrom] = useState<string | null>(null);
    const [dateTo, setDateTo] = useState<string | null>(null);

    const handleAccountSearch = () => {
        if (searchAccount.trim()) onAccountSearch(searchAccount.trim());
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAccountSearch();
    };

    const fmt = (n: number) => String(n).padStart(2, '0');
    const ymd = (d: Date) => `${d.getFullYear()}-${fmt(d.getMonth() + 1)}-${fmt(d.getDate())}`;

    useEffect(() => {
        onPeriodChange(dateFrom || null, dateTo || null);
    }, [dateFrom, dateTo, onPeriodChange]);

    const applyRange = (from: string, to: string) => {
        setDateFrom(from);
        setDateTo(to);
    };

    const clearRange = () => {
        setDateFrom(null);
        setDateTo(null);
    };

    // Quick helpers
    const setThisYear = () => {
        const now = new Date();
        const from = `${now.getFullYear()}-01-01`;
        const to = `${now.getFullYear()+1}-01-01`;
        applyRange(from, to);
    };

    const setThisMonth = () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        applyRange(ymd(first), ymd(last));
    };

    const setLastMonth = () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 1);
        applyRange(ymd(first), ymd(last));
    };

    const effectivePeriod = dateFrom && dateTo ? `${dateFrom}..${dateTo}` : currentPeriod || '';

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {/* Top Row - Main Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
            <option value="bal">Balance</option>
            <option value="flow">Fluxo</option>
            <option value="reg">Register (reg)</option>
            </select>
            </div>

            {/* Date Range (Calendar) */}
            <div className="space-y-2 lg:col-span-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4 mr-1" />
            Period (From .. To)
        </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
        type="date"
        value={dateFrom || ''}
        onChange={(e) => setDateFrom(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="From"
            />
            <input
        type="date"
        value={dateTo || ''}
        onChange={(e) => setDateTo(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="To"
            />
            {/*
            <div className="flex gap-2">
            <button
        onClick={applyIfReady}
        disabled={!(dateFrom && dateTo)}
        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        title={dateFrom && dateTo ? 'Apply range' : 'Select both dates'}
            >
            Apply
            </button>
            {(dateFrom || dateTo) && (
                <button
                onClick={clearRange}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                    Clear
                </button>
            )}
        </div>*/}
            </div>
            <div className="text-xs text-gray-500">
            Effective period:{' '}
            <span className="font-mono">{effectivePeriod || '(none)'}</span>
            </div>
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
            <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Quick Period:</span>
            <button
        onClick={setThisYear}
        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
            This Year
        </button>
            <button
        onClick={setThisMonth}
        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
            This Month
        </button>
            <button
        onClick={setLastMonth}
        className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
            >
            Last Month
        </button>
            <button
        onClick={clearRange}
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
