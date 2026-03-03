import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import { PriceTicker } from '../components/PriceTicker';
import { DerivedRates } from '../hooks/usePricesData';

interface TopBarProps {
    title: string;
    onMenuClick: () => void;
    onRefresh: () => void;
    isLoading: boolean;
    rates: DerivedRates;
    pricesLoading: boolean;
    timestamp?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
    title,
    onMenuClick,
    onRefresh,
    isLoading,
    rates,
    pricesLoading,
    timestamp,
}) => {
    return (
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left: hamburger + title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="p-1.5 rounded-md hover:bg-gray-100 md:hidden"
                    >
                        <Menu className="h-5 w-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
                </div>

                {/* Center: ticker (hidden on small screens) */}
                <div className="hidden sm:flex flex-1 justify-center mx-4">
                    <PriceTicker rates={rates} isLoading={pricesLoading} />
                </div>

                {/* Right: timestamp + refresh */}
                <div className="flex items-center gap-3">
                    {timestamp && (
                        <span className="hidden lg:inline text-xs text-gray-500">
                            {new Date(timestamp).toLocaleString('pt-BR')}
                        </span>
                    )}
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Ticker row for mobile */}
            <div className="sm:hidden px-4 pb-2">
                <PriceTicker rates={rates} isLoading={pricesLoading} />
            </div>
        </header>
    );
};
