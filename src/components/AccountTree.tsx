import React from 'react';
import Decimal from 'decimal.js';
import { LedgerAccount, AccWithBig } from '../types/api';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { formatDecimalByCommodity } from './FormatDecimal';

interface AccountTreeProps {
    accounts: AccWithBig[]; // plural (you iterate a list)
    onAccountSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
}

interface AccountNodeProps {
    account: AccWithBig; // singular (node renders a single account)
    onSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
    level?: number;
    isLastChild?: boolean;
    parentConnections?: boolean[];
}

/** Runtime assertion that also narrows the type for TS */
function assertHasBig(
    acc: AccWithBig
): asserts acc is LedgerAccount & { amountsBigInt: Record<string, Decimal> } {
    if (!acc.amountsBigInt) {
        throw new Error('amountsBigInt is missing. Ensure withBigInts() was applied before rendering.');
    }
}

const getAmountSign = (d: Decimal) =>
    d.isZero() ? 'zero' : d.isPositive() ? 'positive' : 'negative';

const getNonZeroAmounts = (acc: AccWithBig) => {
    assertHasBig(acc); // narrow here (or at call site)
    return Object.entries(acc.amountsBigInt)
        .filter(([_, d]) => !d.isZero())
        .map(([currency, value]) => ({ currency, value }));
};

const AccountNode: React.FC<AccountNodeProps> = ({
    account,
    onSelect,
    selectedAccount,
    level = 0,
    isLastChild = false,
    parentConnections = [],
}) => {
    // Narrow immediately so the rest of the function is strictly typed
    assertHasBig(account);

    const [isExpanded, setIsExpanded] = React.useState(true);
    const accountPath = account.fullPath || account.account;
    const hasChildren = !!account.children?.length;
    const isSelected = selectedAccount === accountPath;
    const amounts = getNonZeroAmounts(account);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(accountPath, !hasChildren);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const lastClearedDate = account.lastClearedDate || '';

    const renderCurrencyRow = (
        { currency, value }: { currency: string; value: Decimal },
        isFirst: boolean
    ) => {
        const sign = getAmountSign(value);
        return (
            <div key={currency} className="grid grid-cols-4 gap-4 items-center py-2">
                <div
            className="flex items-center"
            style={{ paddingLeft: `${level * 20 + (level > 0 ? 20 : 0)}px` }}
                >
                {isFirst && hasChildren && (
                    <button
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
                <div className={`text-sm ${level === 0 ? 'text-gray-600' : 'text-gray-500'}`}>
                {isFirst ? lastClearedDate : ''}
            </div>
                <div className="text-right text-xs text-gray-500 font-medium">{currency}</div>
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
                        // Assert each child as we recurse
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
                    .sort((x, y) => x.account.localeCompare(y.account)),
            };
        };
        return [...accounts].map(sortChildren).sort((a, b) => a.account.localeCompare(b.account));
    }, [accounts]);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 bg-gray-50 px-4 py-3 border-b font-semibold text-sm text-gray-700">
            <div>Account</div>
            <div>Last Cleared</div>
            <div className="text-right">Currency</div>
            <div className="text-right">Amount</div>
            </div>
            <div className="divide-y divide-gray-100">
            {sortedAccounts.map((acc, i) => {
                // Optional: assert here too if you want an earlier failure
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
