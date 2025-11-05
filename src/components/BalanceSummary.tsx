import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Decimal from 'decimal.js';
import { LedgerAccount } from '../types/api';
import { formatDecimalByCommodity } from './FormatDecimal';
import { RefreshCw } from 'lucide-react';

type AccWithBig = LedgerAccount & { amountsBigInt?: Record<string, Decimal> };

interface BalanceSummaryProps {
    accounts: AccWithBig[];
}

interface ExchangeRates {
  BTCUSD: number;
  USDBRL: number;
  lastUpdate: Date;
}

const findTop = (list: AccWithBig[], names: string[]) => {
    const n = names.map((x) => x.toLowerCase());
    return list.find((a) =>
        n.includes((a.fullPath || a.account).split(':')[0].toLowerCase())
                    );
};

const fetchExchangeRates = async (): Promise<ExchangeRates> => {
    try {
        const cryptoResponse = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        const cryptoData = await cryptoResponse.json();
        const btcusd = cryptoData.bitcoin.usd;

        const forexResponse = await fetch(
            'https://economia.awesomeapi.com.br/json/last/USD-BRL'
        );
        const forexData = await forexResponse.json();
        const usdbrl = parseFloat(forexData.USDBRL.bid);

        return { BTCUSD: btcusd, USDBRL: usdbrl, lastUpdate: new Date() };
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return { BTCUSD: 65000, USDBRL: 5.65, lastUpdate: new Date() };
    }
};

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts }) => {
    const { map, currencies } = useMemo(() => {
        const map = {
            assets: findTop(accounts, ['Ativos']),
            liabilities: findTop(accounts, ['Passivos', 'Passivo']),
            expenses: findTop(accounts, ['Despesas']),
            income: findTop(accounts, ['Receitas']),
        };

        // Build currency list from whatever is available
        const set = new Set<string>();
        Object.values(map).forEach((a) => {
            if (!a) return;
            const keys =
                (a as AccWithBig).amountsBigInt
                ? Object.keys((a as AccWithBig).amountsBigInt!)
                : Object.keys(a.amounts || {});
            keys.forEach((k) => set.add(k));
        });

        return { map, currencies: Array.from(set) };
    }, [accounts]);

    const icon = {
        assets: <TrendingUp className="w-3 h-3 text-green-600" />,
        liabilities: <TrendingDown className="w-3 h-3 text-red-600" />,
        expenses: <TrendingDown className="w-3 h-3 text-orange-600" />,
        income: <DollarSign className="w-3 h-3 text-blue-600" />,
    } as const;

    const color = {
        assets: 'border-l-green-500',
        liabilities: 'border-l-red-500',
        expenses: 'border-l-orange-500',
        income: 'border-l-blue-500',
    } as const;

    const order = ['assets', 'liabilities', 'expenses', 'income'] as const;

    const assertHasBig: (acc: AccWithBig) => asserts acc is LedgerAccount & {
        amountsBigInt: Record<string, Decimal>;
    } = (acc) => {
        if (!acc.amountsBigInt) {
            throw new Error('amountsBigInt is missing. Ensure withBigInts() was applied before using this.');
        }
    };

    const convertToUSD = (commodity: string, amount: Decimal): Decimal | null => {
        if (commodity === 'USD' || commodity === '$') return amount;
        if (commodity === 'BTC' && rates.BTCUSD > 0) {
            return amount.mul(rates.BTCUSD);
        }
        if (commodity === 'BRL' && rates.USDBRL > 0) {
            return amount.div(rates.USDBRL);
        }
        return null;
    };

    const convertToBRL = (commodity: string, amount: Decimal): Decimal | null => {
        if (commodity === 'BRL' || commodity === 'R$') return amount;
        if ((commodity === 'USD' || commodity === '$' || commodity === 'USDT' || commodity == 'MUSD') && rates.USDBRL > 0) {
            return amount.mul(rates.USDBRL);
        }
        if (commodity === 'BTC' && rates.BTCUSD > 0 && rates.USDBRL > 0) {
            return amount.mul(rates.BTCUSD).mul(rates.USDBRL);
        }
        return null;
    };

    const [rates, setRates] = useState<ExchangeRates>({
        BTCUSD: 0,
        USDBRL: 0,
        lastUpdate: new Date()
    });
    const [loading, setLoading] = useState(false);

    const loadRates = async () => {
        setLoading(true);
        const newRates = await fetchExchangeRates();
        setRates(newRates);
        setLoading(false);
    };

    useEffect(() => {
        loadRates();
        const interval = setInterval(loadRates, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-xs space-y-2">
            <div className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded text-gray-600">
            <div className="flex items-center gap-3">
            <span>BTC/USD: {formatDecimalByCommodity('USD', new Decimal(rates.BTCUSD))}</span>
            <span>USD/BRL: {formatDecimalByCommodity('BRL', new Decimal(rates.USDBRL))}</span>
        </div>
            <button
        onClick={loadRates}
        disabled={loading}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        title="Refresh rates"
        >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
            </div>
            {currencies.map((cur) => (
                <div key={cur} className="grid grid-cols-2 md:grid-cols-4 gap-1">
                    {order.map((k) => {
                        const acc = map[k];
                        if (acc) {
                            assertHasBig(acc);
                            let valDec = acc.amountsBigInt[cur] ?? new Decimal('0');
                            if ((k == 'liabilities' || k == 'income') && !valDec.isZero())
                                valDec = valDec.neg();
                            const usdValue = convertToUSD(cur, valDec);

                            return (
                                <div
                                key={k}
                                className={`px-2 py-1 bg-white border-l-2 ${color[k]} flex flex-col rounded-sm shadow-sm`}
                                    >
                                    <div className="flex items-center justify-between">
                                    <span className="truncate text-gray-700 font-medium">
                                    {formatDecimalByCommodity(cur, valDec)}
                                </span>
                                    <span className="flex items-center gap-1 text-gray-500">
                                    {icon[k]} {cur}
                                </span>
                                    </div>
                                    {usdValue && cur !== 'USD' && cur !== '$' && (
                                        <span className="text-gray-500 text-[10px] mt-0.5">
                                            ≈ ${usdValue.toFixed(2)}
                                        </span>
                                    )}
                                {convertToBRL(cur, valDec) && cur !== 'BRL' && cur !== 'R$' && (() => {
                                    const brlValue = convertToBRL(cur, valDec);
                                    return brlValue ? (
                                        <span className="text-gray-500 text-[10px]">
                                            ≈ R$ {brlValue.toFixed(2)}
                                        </span>
                                    ) : null;
                                })()}
                                </div>
                            );
                        }
                    })}
                </div>
            ))}
        </div>
    );
};

export default BalanceSummary;
