import React from 'react';
import Decimal from 'decimal.js';
import { LedgerAccount, AccWithBig } from '../types/api';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { formatDecimalByCommodity } from './FormatDecimal';

interface AccountTreeProps {
    accounts: AccWithBig[];
    onAccountSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
}

interface AccountNodeProps {
    account: AccWithBig;
    onSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
    level?: number;
}

function assertHasBig(
    acc: AccWithBig
): asserts acc is LedgerAccount & { amountsBigInt: Record<string, Decimal>, clearedAmountsBigInt: Record<string, Decimal> } {
    if (!acc.amountsBigInt || !acc.clearedAmountsBigInt) {
        throw new Error('amountsBigInt is missing');
    }
}

const getAmountSign = (d: Decimal) =>
    d.isZero() ? 'zero' : d.isPositive() ? 'positive' : 'negative';

const getNonZeroAmounts = (acc: AccWithBig) => {
    assertHasBig(acc);
    return Object.entries(acc.amountsBigInt)
        .filter(([_, d]) => !d.isZero())
        .map(([currency, value]) => ({ currency, value }))
        .sort((a, b) => {
            const cmp = b.value.abs().comparedTo(a.value.abs());
            return cmp !== 0 ? cmp : a.currency.localeCompare(b.currency);
        });
};

const norm = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const AccountNode: React.FC<AccountNodeProps> = ({
    account,
    onSelect,
    selectedAccount,
    level = 0,
}) => {
    assertHasBig(account);

    const isLiquidoNode = norm((account.account || '').split(':')[0]) === 'liquido';
    const [isExpanded, setIsExpanded] = React.useState<boolean>(!isLiquidoNode);
    const accountPath = account.fullPath || account.account;
    const hasChildren = !!account.children?.length;
    const isSelected = selectedAccount === accountPath;

    const amounts = getNonZeroAmounts(account);
    const lastClearedDate = account.lastClearedDate || '';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(accountPath, !hasChildren);
    };
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded((v) => !v);
    };

    return (
        <div>
            <div
                className={`border-b cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                }`}
                onClick={handleClick}
            >
                {amounts.map(({ currency, value }, i) => {
                    const sign = getAmountSign(value);
                    const cleared = account.clearedAmountsBigInt?.[currency] ?? null;
                    const isFirst = i === 0;

                    return (
                        <div key={currency} className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_100px_80px_120px_120px] gap-2 sm:gap-4 items-center py-1.5 px-2 sm:px-4">
                            {/* Account name */}
                            <div
                                className="flex items-center min-w-0"
                                style={{ paddingLeft: `${level * 16 + (level > 0 ? 12 : 0)}px` }}
                            >
                                {isFirst && hasChildren && (
                                    <button
                                        type="button"
                                        onClick={handleToggle}
                                        className="p-0.5 hover:bg-blue-100 rounded mr-1.5 flex-shrink-0"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={14} className="text-gray-600" />
                                        ) : (
                                            <ChevronRight size={14} className="text-gray-600" />
                                        )}
                                    </button>
                                )}
                                {isFirst && (
                                    <span
                                        className={`truncate ${
                                            level === 0 ? 'font-semibold text-gray-900 text-sm' : 'text-gray-700 text-sm'
                                        }`}
                                    >
                                        {account.account}
                                        {hasChildren && (
                                            <span className="ml-1.5 text-xs text-gray-400">
                                                ({account.children?.length})
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Last Cleared Date — hidden on mobile */}
                            <div className={`hidden sm:block text-xs ${isFirst ? 'text-gray-500' : 'text-transparent'}`}>
                                {isFirst ? lastClearedDate : ''}
                            </div>

                            {/* Currency */}
                            <div className="text-right text-xs text-gray-400 font-medium">{currency}</div>

                            {/* Amount */}
                            <div className={`font-mono text-right text-sm font-semibold ${
                                sign === 'positive' ? 'text-green-600' : sign === 'negative' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                                {formatDecimalByCommodity(currency, value)}
                            </div>

                            {/* Cleared — hidden on mobile */}
                            <div className="hidden sm:block font-mono text-right text-sm text-slate-500">
                                {cleared ? formatDecimalByCommodity(currency, cleared) : '—'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isExpanded && hasChildren && (
                <div>
                    {account.children!.map((child, i) => {
                        const childAcc = child as AccWithBig;
                        assertHasBig(childAcc);
                        return (
                            <AccountNode
                                key={childAcc.fullPath || childAcc.account}
                                account={childAcc}
                                onSelect={onSelect}
                                selectedAccount={selectedAccount}
                                level={level + 1}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const AccountTree: React.FC<AccountTreeProps> = ({
    accounts,
    onAccountSelect,
    selectedAccount,
}) => {
    const sortedAccounts = React.useMemo(() => {
        const sortChildren = (a: AccWithBig): AccWithBig => {
            if (!a.children) return a;
            return {
                ...a,
                children: a.children
                    .map((c) => sortChildren(c as AccWithBig))
                    .sort((x, y) => {
                        const xIsLiquido = norm(x.account) === 'liquido';
                        const yIsLiquido = norm(y.account) === 'liquido';
                        if (xIsLiquido && !yIsLiquido) return 1;
                        if (!xIsLiquido && yIsLiquido) return -1;
                        return x.account.localeCompare(y.account);
                    }),
            };
        };

        return [...accounts]
            .map(sortChildren)
            .sort((a, b) => {
                const aIsLiquido = norm(a.account) === 'liquido';
                const bIsLiquido = norm(b.account) === 'liquido';
                if (aIsLiquido && !bIsLiquido) return 1;
                if (!aIsLiquido && bIsLiquido) return -1;
                return a.account.localeCompare(b.account);
            });
    }, [accounts]);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_100px_80px_120px_120px] gap-2 sm:gap-4 bg-gray-50 px-2 sm:px-4 py-2.5 border-b font-semibold text-xs text-gray-600 uppercase tracking-wider">
                <div>Conta</div>
                <div className="hidden sm:block">Últ. Conciliação</div>
                <div className="text-right">Moeda</div>
                <div className="text-right">Saldo</div>
                <div className="hidden sm:block text-right">Conciliado</div>
            </div>

            <div>
                {sortedAccounts.map((acc) => {
                    assertHasBig(acc);
                    return (
                        <AccountNode
                            key={acc.fullPath || acc.account}
                            account={acc}
                            onSelect={onAccountSelect}
                            selectedAccount={selectedAccount}
                            level={0}
                        />
                    );
                })}
            </div>
        </div>
    );
};
