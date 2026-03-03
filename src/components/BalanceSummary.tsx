import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import Decimal from 'decimal.js';
import { LedgerAccount } from '../types/api';
import { formatDecimalByCommodity } from './FormatDecimal';
import { KpiCard } from './ui/KpiCard';
import { DerivedRates } from '../hooks/usePricesData';

type AccWithBig = LedgerAccount & { amountsBigInt?: Record<string, Decimal> };

interface BalanceSummaryProps {
    accounts: AccWithBig[];
    rates: DerivedRates;
}

const findTop = (list: AccWithBig[], names: string[]) => {
    const n = names.map((x) => x.toLowerCase());
    return list.find((a) =>
        n.includes((a.fullPath || a.account).split(':')[0].toLowerCase())
    );
};

function assertHasBig(acc: AccWithBig): asserts acc is LedgerAccount & { amountsBigInt: Record<string, Decimal> } {
    if (!acc.amountsBigInt) throw new Error('amountsBigInt is missing');
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts, rates }) => {
    const map = useMemo(() => ({
        assets: findTop(accounts, ['Ativos']),
        liabilities: findTop(accounts, ['Passivos', 'Passivo']),
        expenses: findTop(accounts, ['Despesas']),
        income: findTop(accounts, ['Receitas']),
    }), [accounts]);

    const convertToBRL = (commodity: string, amount: Decimal): Decimal | null => {
        if (commodity === 'BRL' || commodity === 'R$') return amount;
        if ((commodity === 'USD' || commodity === '$' || commodity === 'USDT' || commodity === 'MUSD') && !rates.USDBRL.isZero()) {
            return amount.mul(rates.USDBRL);
        }
        if (commodity === 'BTC' && !rates.BTCUSD.isZero() && !rates.USDBRL.isZero()) {
            return amount.mul(rates.BTCUSD).mul(rates.USDBRL);
        }
        return null;
    };

    const getKpiValue = (acc: AccWithBig | undefined, negate: boolean): { brl: string; subtitle: string } => {
        if (!acc) return { brl: 'R$ 0,00', subtitle: '' };
        assertHasBig(acc);

        let totalBRL = new Decimal(0);
        const parts: string[] = [];

        for (const [commodity, val] of Object.entries(acc.amountsBigInt)) {
            if (val.isZero()) continue;
            const adjusted = negate ? val.neg() : val;
            parts.push(formatDecimalByCommodity(commodity, adjusted));
            const brlVal = convertToBRL(commodity, adjusted);
            if (brlVal) totalBRL = totalBRL.plus(brlVal);
        }

        return {
            brl: formatDecimalByCommodity('BRL', totalBRL),
            subtitle: parts.length > 1 ? parts.join(' + ') : (parts.length === 1 && !totalBRL.eq(0) ? '' : ''),
        };
    };

    const assets = getKpiValue(map.assets, false);
    const liabilities = getKpiValue(map.liabilities, true);
    const expenses = getKpiValue(map.expenses, false);
    const income = getKpiValue(map.income, true);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
                title="Ativos"
                value={assets.brl}
                subtitle={assets.subtitle}
                icon={<TrendingUp className="h-5 w-5" />}
                color="green"
            />
            <KpiCard
                title="Passivos"
                value={liabilities.brl}
                subtitle={liabilities.subtitle}
                icon={<TrendingDown className="h-5 w-5" />}
                color="red"
            />
            <KpiCard
                title="Despesas"
                value={expenses.brl}
                subtitle={expenses.subtitle}
                icon={<Wallet className="h-5 w-5" />}
                color="orange"
            />
            <KpiCard
                title="Receitas"
                value={income.brl}
                subtitle={income.subtitle}
                icon={<DollarSign className="h-5 w-5" />}
                color="blue"
            />
        </div>
    );
};

export default BalanceSummary;
