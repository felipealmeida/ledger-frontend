import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface AccountSearchProps {
    onSearch: (account: string | null) => void;
    placeholder?: string;
}

export const AccountSearch: React.FC<AccountSearchProps> = ({
    onSearch,
    placeholder = 'Buscar conta...',
}) => {
    const [query, setQuery] = useState('');

    const handleChange = (value: string) => {
        setQuery(value);
        onSearch(value.trim() || null);
    };

    const handleClear = () => {
        setQuery('');
        onSearch(null);
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {query && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
};
