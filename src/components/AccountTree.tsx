import React from 'react';
import { AccWithBig } from '../types/api';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { formatDecimalByCommodity } from './FormatDecimal';
import { getNonZeroAmounts, assertHasBig, getAmountSign } from '../utils/amounts';

interface AccountTreeProps {
    accounts: AccWithBig[];
    expandAll?: boolean;
}

interface AccountNodeProps {
    account: AccWithBig;
    level?: number;
    expandAll?: boolean;
}

const norm = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const AmountDisplay: React.FC<{ currency: string; value: import('decimal.js').default; className?: string }> = ({ currency, value, className = '' }) => {
    const sign = getAmountSign(value);
    return (
        <span className={`font-mono text-sm whitespace-nowrap text-right ${
            sign === 'positive' ? 'text-green-700' : sign === 'negative' ? 'text-red-600' : 'text-gray-400'
        } ${className}`}>
            {formatDecimalByCommodity(currency, value)}
        </span>
    );
};

const AccountNode: React.FC<AccountNodeProps> = ({
    account,
    level = 0,
    expandAll,
}) => {
    assertHasBig(account);

    const isLiquidoNode = norm((account.account || '').split(':')[0]) === 'liquido';
    const defaultExpanded = expandAll !== undefined
        ? expandAll
        : (level === 0 && !isLiquidoNode);
    const [isExpanded, setIsExpanded] = React.useState<boolean>(defaultExpanded);
    const [showAllCurrencies, setShowAllCurrencies] = React.useState(false);

    React.useEffect(() => {
        if (expandAll !== undefined) {
            setIsExpanded(expandAll || (level === 0 && !isLiquidoNode));
        }
    }, [expandAll, level, isLiquidoNode]);

    const hasChildren = !!account.children?.length;

    const amounts = getNonZeroAmounts(account);
    const primaryAmount = amounts[0] ?? null;
    const extraAmounts = amounts.slice(1);
    const hasExtras = extraAmounts.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) setIsExpanded((v) => !v);
    };
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded((v) => !v);
    };
    const handleToggleCurrencies = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowAllCurrencies((v) => !v);
    };

    const isTopLevel = level === 0;

    return (
        <div>
            {/* Main row */}
            <div
                className={`flex items-center border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${
                    hasChildren ? 'cursor-pointer' : ''
                } ${isTopLevel ? 'bg-gray-50 border-gray-200' : ''}`}
                onClick={handleClick}
            >
                {/* Name side */}
                <div
                    className="flex items-center flex-1 min-w-0 py-1.5 pr-2"
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={handleToggle}
                            className="p-0.5 hover:bg-blue-100 rounded mr-1 flex-shrink-0"
                        >
                            {isExpanded ? (
                                <ChevronDown size={14} className="text-gray-500" />
                            ) : (
                                <ChevronRight size={14} className="text-gray-500" />
                            )}
                        </button>
                    ) : (
                        <span className="w-[22px] flex-shrink-0" />
                    )}
                    <span
                        className={`truncate ${
                            isTopLevel
                                ? 'font-semibold text-gray-900 text-sm'
                                : 'text-gray-700 text-sm'
                        }`}
                    >
                        {account.account}
                    </span>
                    {hasChildren && (
                        <span className="ml-1 text-xs text-gray-400 flex-shrink-0">
                            ({account.children?.length})
                        </span>
                    )}
                    {hasExtras && (
                        <button
                            type="button"
                            onClick={handleToggleCurrencies}
                            className="ml-1.5 flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-gray-200/80 text-gray-500 rounded-full hover:bg-gray-300 transition-colors leading-none"
                        >
                            +{extraAmounts.length}
                        </button>
                    )}
                </div>

                {/* Value side — fixed width column */}
                <div className="w-36 sm:w-44 flex-shrink-0 text-right py-1.5 pr-3 sm:pr-4">
                    {primaryAmount ? (
                        <AmountDisplay
                            currency={primaryAmount.currency}
                            value={primaryAmount.value}
                            className={isTopLevel ? 'font-semibold' : 'font-medium'}
                        />
                    ) : (
                        <span className="text-sm text-gray-300">—</span>
                    )}
                </div>
            </div>

            {/* Extra currencies */}
            {showAllCurrencies && extraAmounts.map(({ currency, value }) => (
                <div
                    key={currency}
                    className="flex items-center border-b border-gray-50 bg-gray-50/30"
                >
                    <div
                        className="flex-1 min-w-0 py-0.5 pr-2"
                        style={{ paddingLeft: `${level * 20 + 38}px` }}
                    >
                        <span className="text-xs text-gray-400">{currency}</span>
                    </div>
                    <div className="w-36 sm:w-44 flex-shrink-0 text-right py-0.5 pr-3 sm:pr-4">
                        <AmountDisplay currency={currency} value={value} className="font-medium" />
                    </div>
                </div>
            ))}

            {/* Children */}
            {isExpanded && hasChildren && (
                <div>
                    {account.children!.map((child) => {
                        const childAcc = child as AccWithBig;
                        assertHasBig(childAcc);
                        return (
                            <AccountNode
                                key={childAcc.fullPath || childAcc.account}
                                account={childAcc}
                                level={level + 1}
                                expandAll={expandAll}
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
    expandAll,
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-2xl mx-auto">
            {sortedAccounts.map((acc) => {
                assertHasBig(acc);
                return (
                    <AccountNode
                        key={acc.fullPath || acc.account}
                        account={acc}
                        level={0}
                        expandAll={expandAll}
                    />
                );
            })}
        </div>
    );
};
