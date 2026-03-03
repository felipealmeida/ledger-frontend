import React from 'react';
import { formatDecimalByCommodity } from './FormatDecimal';
import { DerivedRates } from '../hooks/usePricesData';

interface PriceTickerProps {
    rates: DerivedRates;
    isLoading: boolean;
}

export const PriceTicker: React.FC<PriceTickerProps> = ({ rates, isLoading }) => {
    const items = [
        { label: 'BTC/USD', value: rates.BTCUSD, commodity: 'USD' },
        { label: 'USD/BRL', value: rates.USDBRL, commodity: 'BRL' },
    ].filter(item => !item.value.isZero());

    if (items.length === 0 && !isLoading) return null;

    return (
        <div className="flex items-center gap-3 text-xs overflow-x-auto scrollbar-none">
            {isLoading && items.length === 0 && (
                <span className="text-gray-400 animate-pulse">Carregando cotações...</span>
            )}
            {items.map(({ label, value, commodity }) => (
                <div key={label} className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1 bg-gray-100 rounded-md">
                    <span className="text-gray-500 font-medium">{label}</span>
                    <span className="text-gray-800 font-mono font-semibold">
                        {formatDecimalByCommodity(commodity, value)}
                    </span>
                </div>
            ))}
        </div>
    );
};
