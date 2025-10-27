import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { LedgerAccount } from '../types/api';

interface BalanceSummaryProps {
    accounts: LedgerAccount[];
    labels?: Partial<Record<'assets' | 'expenses' | 'income' | 'liabilities', string>>;
}

const normalize = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const firstSegment = (path: string) => (path || '').split(':')[0] || '';

const getTopLevel = (accounts: LedgerAccount[], names: string[]): LedgerAccount | undefined => {
    const wanted = names.map(normalize);
    for (const acc of accounts) {
        const first = normalize(firstSegment(acc.fullPath || acc.account || ''));
        if (wanted.includes(first)) return acc;
    }
    return undefined;
};

const SummaryCard: React.FC<{
    title: string;
    value: string | undefined;
    Icon: React.ComponentType<{ className?: string }>;
    borderClass: string;
    iconClass: string;
    currency: string;
}> = ({ title, value, Icon, borderClass, iconClass, currency }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${borderClass}`}>
        <div className="flex items-center justify-between">
        <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">
        {value ?? '—'} <span className="ml-2 text-sm text-gray-500">{currency}</span>
        </p>
        </div>
        <div className="p-3 rounded-full bg-gray-100">
        <Icon className={`h-6 w-6 ${iconClass}`} />
        </div>
        </div>
        </div>
);

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({
    accounts,
    labels,
}) => {
    const names = {
        assets: ['Ativos'],
        expenses: ['Despesas'],
        income: ['Receitas'],
        liabilities: ['Passivos', 'Passivo'],
    };

    const top = useMemo(() => {
        const assets = getTopLevel(accounts, names.assets);
        const expenses = getTopLevel(accounts, names.expenses);
        const income = getTopLevel(accounts, names.income);
        const liabilities = getTopLevel(accounts, names.liabilities);
        return { assets, expenses, income, liabilities };
    }, [accounts]);

    // Auto-detect currencies from the four top-level accounts' amounts maps.
    const currenciesToShow = useMemo(() => {
        const set = new Set<string>();
        [top.assets, top.expenses, top.income, top.liabilities].forEach((acc) => {
            if (!acc) return;
            Object.keys(acc.amounts || {}).forEach((k) => set.add(k));
        });
        return Array.from(set);
    }, [top.assets, top.expenses, top.income, top.liabilities]);

    const lbl = {
        assets: labels?.assets ?? 'Ativos',
        expenses: labels?.expenses ?? 'Despesas',
        income: labels?.income ?? 'Receitas',
        liabilities: labels?.liabilities ?? 'Passivos',
    } as const;

    return (
        <div className="space-y-8">
            {currenciesToShow.map((cur) => (
                <div key={cur}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">{cur}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard
                title={lbl.assets}
                value={top.assets?.amounts?.[cur]}
                currency={cur}
                Icon={TrendingUp}
                borderClass="border-l-green-500"
                iconClass="text-green-600"
                    />
                    <SummaryCard
                title={lbl.liabilities}
                value={top.liabilities?.amounts?.[cur]}
                currency={cur}
                Icon={TrendingDown}
                borderClass="border-l-red-500"
                iconClass="text-red-600"
                    />
                    <SummaryCard
                title={lbl.expenses}
                value={top.expenses?.amounts?.[cur]}
                currency={cur}
                Icon={TrendingDown}
                borderClass="border-l-orange-500"
                iconClass="text-orange-600"
                    />
                    <SummaryCard
                title={lbl.income}
                value={top.income?.amounts?.[cur]}
                currency={cur}
                Icon={DollarSign}
                borderClass="border-l-blue-500"
                iconClass="text-blue-600"
                    />
                    </div>
                    </div>
            ))}
        </div>
    );
};

export default BalanceSummary;
