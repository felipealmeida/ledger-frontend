import { useState, useCallback, useEffect } from 'react';
import { LedgerApiService } from '../services/apiService';
import { LedgerPriceResponse } from '../types/api';
import Decimal from 'decimal.js';

export interface DerivedRates {
    BTCUSD: Decimal;
    USDBRL: Decimal;
}

export function usePricesData(autoRefreshMs = 5 * 60 * 1000) {
    const [prices, setPrices] = useState<LedgerPriceResponse | null>(null);
    const [rates, setRates] = useState<DerivedRates>({ BTCUSD: new Decimal(0), USDBRL: new Decimal(0) });
    const [isLoading, setIsLoading] = useState(false);

    const deriveRates = useCallback((data: LedgerPriceResponse) => {
        let btcusd = new Decimal(0);
        let usdbrl = new Decimal(0);

        for (const p of data.prices) {
            if (p.what === 'BTC' && p.amounts['USD']) {
                btcusd = new Decimal(p.amounts['USD']);
            }
            if (p.what === 'BTC' && p.amounts['$']) {
                btcusd = new Decimal(p.amounts['$']);
            }
            if (p.what === 'USD' && p.amounts['BRL']) {
                usdbrl = new Decimal(p.amounts['BRL']);
            }
            if (p.what === '$' && p.amounts['BRL']) {
                usdbrl = new Decimal(p.amounts['BRL']);
            }
        }

        setRates({ BTCUSD: btcusd, USDBRL: usdbrl });
    }, []);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await LedgerApiService.getPrices();
            setPrices(data);
            deriveRates(data);
        } catch (err) {
            console.error('Failed to load prices:', err);
        } finally {
            setIsLoading(false);
        }
    }, [deriveRates]);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, autoRefreshMs);
        return () => clearInterval(id);
    }, [refresh, autoRefreshMs]);

    return { prices, rates, isLoading, refresh };
}
