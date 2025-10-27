import React from 'react';
import { LedgerAccount } from '../types/api';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface AccountTreeProps {
    accounts: LedgerAccount[];
    onAccountSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
}

interface AccountNodeProps {
    account: LedgerAccount;
    onSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
    level?: number;
    isLastChild?: boolean;
    parentConnections?: boolean[];
}

// Helper function to get all non-zero amounts
const getNonZeroAmounts = (amounts: Record<string, string>): Array<{currency: string, value: string}> => {
    if (!amounts || typeof amounts !== 'object') return [];
    
    return Object.entries(amounts)
        .filter(([_, value]) => {
            // Check if value is not zero
            const cleanValue = value.replace(/[^\d,.-]/g, '');
            const numericValue = cleanValue.replace(/\./g, '').replace(',', '.');
            const parsed = parseFloat(numericValue);
            return !isNaN(parsed) && parsed !== 0;
        })
        .map(([currency, value]) => ({ currency, value }));
};

// Helper function to determine if amount is positive, negative, or zero
const getAmountSign = (amountStr: string): 'positive' | 'negative' | 'zero' => {
    if (!amountStr) return 'zero';
    
    // Remove formatting and check for negative sign
    const cleanValue = amountStr.replace(/[^\d,.-]/g, '');
    
    if (cleanValue.includes('-')) return 'negative';
    
    // Check if it's zero
    const numericValue = cleanValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(numericValue);
    
    if (isNaN(parsed) || parsed === 0) return 'zero';
    
    return 'positive';
};

const AccountNode: React.FC<AccountNodeProps> = ({ 
    account, 
    onSelect, 
    selectedAccount, 
    level = 0,
    isLastChild = false,
    parentConnections = []
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    
    const accountPath = account.fullPath || account.account;
    const hasChildren = account.children && account.children.length > 0;
    const isSelected = selectedAccount === accountPath;
    
    // Get all non-zero amounts
    const amounts = getNonZeroAmounts(account.amounts);
    const hasMultipleCurrencies = amounts.length > 1;
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect(accountPath, !hasChildren);
        }
    };
    
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };
    
    // Create tree lines
    const renderTreeLines = () => {
        const lines = [];
        
        // Draw vertical lines for parent connections
        parentConnections.forEach((hasConnection, index) => {
            if (hasConnection) {
                lines.push(
                    <div
                    key={`parent-${index}`}
                    className="absolute w-px bg-gray-300"
                    style={{
                        left: `${index * 20 + 10}px`,
                        top: 0,
                        bottom: 0,
                    }}
                        />
                );
            }
        });
        
        // Draw horizontal line for current item (if not root)
        if (level > 0) {
            lines.push(
                <div
                key="horizontal"
                className="absolute h-px bg-gray-300"
                style={{
                    left: `${(level - 1) * 20 + 10}px`,
                    top: hasMultipleCurrencies ? '50%' : '20px',
                    width: '10px',
                }}
                    />
            );
            
            // Draw vertical line for current level
            lines.push(
                <div
                key="vertical"
                className={`absolute w-px bg-gray-300 ${isLastChild ? '' : 'h-full'}`}
                style={{
                    left: `${(level - 1) * 20 + 10}px`,
                    top: 0,
                    height: isLastChild ? (hasMultipleCurrencies ? '50%' : '20px') : '100%'
                }}
                    />
            );
        }
        
        return lines;
    };
    
    // Get last cleared date if available
    const lastClearedDate = account.lastClearedDate || '';
    
    // Render a single currency row
    const renderCurrencyRow = (currencyData: {currency: string, value: string}, isFirst: boolean) => {
        const amountSign = getAmountSign(currencyData.value);
        
        return (
            <div key={currencyData.currency} className="grid grid-cols-4 gap-4 items-center py-2">
                {/* Account Name Column - only show on first row */}
                <div 
            className="flex items-center relative z-10" 
            style={{ paddingLeft: `${level * 20 + (level > 0 ? 20 : 0)}px` }}
                >
                {isFirst && hasChildren && (
                    <button 
                    onClick={handleToggle}
                    className="p-1 hover:bg-blue-100 rounded-full transition-all duration-200 mr-2 border border-transparent hover:border-blue-200"
                    >
                    {isExpanded ? 
                        <ChevronDown size={14} className="text-gray-700" /> : 
                        <ChevronRight size={14} className="text-gray-700" />
                        }
                    </button>
                )}
            {!isFirst && hasChildren && (
                <div className="w-8 mr-2" /> // Spacer for alignment
            )}
            {isFirst && (
                <>
                    <span 
                className={`font-medium transition-colors ${
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
                
                {/* Last Cleared Date Column - only show on first row */}
                <div className={`text-sm ${level === 0 ? 'text-gray-600' : 'text-gray-500'}`}>
                {isFirst ? lastClearedDate : ''}
            </div>
                
                {/* Currency Label Column */}
                <div className="text-right text-xs text-gray-500 font-medium">
                {currencyData.currency}
            </div>
                
                {/* Amount Column */}
                <div
            className={`font-mono text-right font-semibold ${
amountSign === 'positive' ? 'text-green-600' : 
amountSign === 'negative' ? 'text-red-600' : 
'text-gray-600'
}`}
                >
                {currencyData.value}
            </div>
                </div>
        );
    };
    
    return (
        <div>
            <div
        className={`
relative border-b cursor-pointer transition-all duration-200
${isSelected 
? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
: 'hover:bg-gray-50 hover:shadow-sm'
}
`}
        onClick={handleClick}
            >
            {/* Tree lines */}
        {renderTreeLines()}
        
        {/* Render each currency */}
        {amounts.length > 0 ? (
            amounts.map((currencyData, index) => 
                renderCurrencyRow(currencyData, index === 0)
                       )
        ) : (
            // Empty account with no amounts
            <div className="grid grid-cols-4 gap-4 items-center py-2">
                <div 
            className="flex items-center relative z-10" 
            style={{ paddingLeft: `${level * 20 + (level > 0 ? 20 : 0)}px` }}
                >
                {hasChildren && (
                    <button 
                    onClick={handleToggle}
                    className="p-1 hover:bg-blue-100 rounded-full transition-all duration-200 mr-2 border border-transparent hover:border-blue-200"
                        >
                        {isExpanded ? 
                            <ChevronDown size={14} className="text-gray-700" /> : 
                            <ChevronRight size={14} className="text-gray-700" />
                            }
                    </button>
                )}
                <span 
            className={`font-medium transition-colors ${
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
            </div>
                <div className={`text-sm ${level === 0 ? 'text-gray-600' : 'text-gray-500'}`}>
                {lastClearedDate}
            </div>
                <div className="text-right text-xs text-gray-400">—</div>
                <div className="text-right text-gray-400 font-mono">—</div>
                </div>
        )}
        </div>
            
            {isExpanded && hasChildren && account.children && (
                <div>
                    {account.children.map((childAccount, index) => {
                        const isLast = index === account.children!.length - 1;
                        const newParentConnections = [...parentConnections];
                        
                        // Add connection info for this level
                        if (level >= 0) {
                            newParentConnections[level] = !isLastChild;
                        }
                        
                        return (
                            <AccountNode
                            key={`${childAccount.fullPath || childAccount.account}-${index}`}
                            account={childAccount}
                            onSelect={onSelect}
                            selectedAccount={selectedAccount}
                            level={level + 1}
                            isLastChild={isLast}
                            parentConnections={newParentConnections}
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
    selectedAccount
}) => {
    // Sort accounts alphabetically
    const sortedAccounts = React.useMemo(() => {
        const sorted = [...accounts].sort((a, b) => 
            a.account.localeCompare(b.account)
                                         );
        
        // Recursively sort children
        const sortChildren = (account: LedgerAccount): LedgerAccount => {
            if (account.children && account.children.length > 0) {
                return {
                    ...account,
                    children: account.children
                        .map(sortChildren)
                        .sort((a, b) => a.account.localeCompare(b.account))
                };
            }
            return account;
        };
        
        return sorted.map(sortChildren);
    }, [accounts]);
    
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 bg-gray-50 px-4 py-3 border-b font-semibold text-sm text-gray-700">
            <div>Account</div>
            <div>Last Cleared</div>
            <div className="text-right">Currency</div>
            <div className="text-right">Amount</div>
            </div>
            
            {/* Tree Content */}
            <div className="divide-y divide-gray-100">
            {sortedAccounts.map((account, index) => {
                const isLast = index === sortedAccounts.length - 1;
                return (
                    <AccountNode
                    key={`${account.fullPath || account.account}-${index}`}
                    account={account}
                    onSelect={onAccountSelect}
                    selectedAccount={selectedAccount}
                    level={0}
                    isLastChild={isLast}
                    parentConnections={[]}
                        />
                );
            })}
        </div>
            </div>
    );
};
