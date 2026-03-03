import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface AccountSearchProps {
    onSearch: (account: string) => void;
    placeholder?: string;
}

export const AccountSearch: React.FC<AccountSearchProps> = ({
    onSearch,
    placeholder = 'Buscar conta...',
}) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </form>
    );
};
