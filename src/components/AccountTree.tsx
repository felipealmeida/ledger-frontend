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
    isLastChild?: boolean;
    parentConnections?: boolean[];
}

/** Assert amountsBigInt exists; cleared is optional */
function assertHasBig(
    acc: AccWithBig
): asserts acc is LedgerAccount & { amountsBigInt: Record<string, Decimal>, clearedAmountsBigInt: Record<string, Decimal> } {
    if (!acc.amountsBigInt || !acc.clearedAmountsBigInt) {
        throw new Error('amountsBigInt is missing. Ensure withBigInts() was applied before rendering.');
    }
}

const getAmountSign = (d: Decimal) =>
    d.isZero() ? 'zero' : d.isPositive() ? 'positive' : 'negative';

/** Non-zero amounts sorted by |value| desc (bigger → smaller). Tie-break: currency ASC */
const getNonZeroAmounts = (acc: AccWithBig) => {
    assertHasBig(acc);
    return Object.entries(acc.amountsBigInt)
        .filter(([_, d]) => !d.isZero())
        .map(([currency, value]) => ({ currency, value }))
        .sort((a, b) => {
            const av = a.value.abs();
            const bv = b.value.abs();
            if (bv.gt(av)) return 1;
            if (bv.lt(av)) return -1;
            return a.currency.localeCompare(b.currency);
        });
};

const norm = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const AccountNode: React.FC<AccountNodeProps> = ({
    account,
    onSelect,
    selectedAccount,
    level = 0,
    isLastChild = false,
    parentConnections = [],
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

    const renderCurrencyRow = (
        { currency, value }: { currency: string; value: Decimal },
        isFirst: boolean
    ) => {
        const sign = getAmountSign(value);
        const cleared = account.clearedAmountsBigInt?.[currency] ?? null;

        return (
            <div key={currency} className="relative grid grid-cols-5 gap-4 items-center py-2">
                {isFirst && <div className="absolute inset-x-0 -top-px h-[1px] bg-gray-300" />}
            {/* Account / toggle */}
                <div
            className="flex items-center"
            style={{ paddingLeft: `${level * 20 + (level > 0 ? 20 : 0)}px` }}
                >
                {isFirst && hasChildren && (
                    <button
                    type="button"
                    onClick={handleToggle}
                    className="p-1 hover:bg-blue-100 rounded-full mr-2 border border-transparent hover:border-blue-200"
                        >
                        {isExpanded ? (
                            <ChevronDown size={14} className="text-gray-700" />
                        ) : (
                            <ChevronRight size={14} className="text-gray-700" />
                        )}
                    </button>
                )}
            {isFirst && (
                <>
                    <span className="mr-2 inline-block h-3 w-0.5 bg-gray-300 rounded" aria-hidden />
                    <span
                className={`font-medium ${
level === 0
? 'text-gray-900 font-semibold'
: level === 1
? 'text-gray-800'
: 'text-gray-700'
}`}
                style={{ fontSize: level === 0 ? '0.95rem' : '0.875rem' }}
                    >
                    {account.account}
                </span>
                    {hasChildren && (
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {account.children?.length}
                        </span>
                    )}
                </>
            )}
            </div>

                {/* Last Cleared Date (only on first row) */}
                <div className={`text-sm ${isFirst ? (level === 0 ? 'text-gray-600' : 'text-gray-500') : 'text-transparent'}`}>
                {isFirst ? lastClearedDate : '—'}
            </div>

                {/* Currency */}
                <div className="text-right text-xs text-gray-500 font-medium">{currency}</div>

                {/* Amount (current) */}
                <div
            className={`font-mono text-right font-semibold ${
sign === 'positive'
? 'text-green-600'
: sign === 'negative'
? 'text-red-600'
: 'text-gray-600'
}`}
                >
                {formatDecimalByCommodity(currency, value)}
            </div>

                {/* Cleared amount (optional) */}
                <div className="font-mono text-right font-semibold text-slate-600">
                {cleared ? formatDecimalByCommodity(currency, cleared) : '—'}
            </div>
                </div>
        );
    };

    return (
        <div>
            <div
        className={`relative border-b cursor-pointer transition-all duration-200 ${
isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' : 'hover:bg-gray-50 hover:shadow-sm'
}`}
        onClick={handleClick}
            >
            {amounts.map((a, i) => renderCurrencyRow(a, i === 0))}
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
                            isLastChild={i === account.children!.length - 1}
                            parentConnections={parentConnections}
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
            {/* updated header: + Cleared */}
            <div className="grid grid-cols-5 gap-4 bg-gray-50 px-4 py-3 border-b font-semibold text-sm text-gray-700">
            <div>Account</div>
            <div>Last Cleared</div>
            <div className="text-right">Currency</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Cleared</div>
            </div>

            <div className="divide-y divide-gray-100">
            {sortedAccounts.map((acc, i) => {
                assertHasBig(acc);
                return (
                    <AccountNode
                    key={acc.fullPath || acc.account}
                    account={acc}
                    onSelect={onAccountSelect}
                    selectedAccount={selectedAccount}
                    level={0}
                    isLastChild={i === sortedAccounts.length - 1}
                    parentConnections={[]}
                        />
                );
            })}
        </div>
            </div>
    );
};
