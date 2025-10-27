import React from 'react';
import { LedgerAccount } from '../types/api';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface AccountTreeProps {
    accounts: LedgerAccount[];
    onAccountSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
    currency?: string;
}

interface AccountNodeProps {
    account: LedgerAccount;
    onSelect?: (account: string, showTransactions?: boolean) => void;
    selectedAccount?: string;
    level?: number;
    isLastChild?: boolean;
    parentConnections?: boolean[];
    currency?: string;
}

// Helper function to parse amount from the new format
const parseAmount = (amounts: Record<string, string>, currency: string = 'BRL'): number => {
    if (!amounts || typeof amounts !== 'object') return 0;
    
    const amountStr = amounts[currency] || amounts[currency.toLowerCase()] || '0';
    // Remove formatting: "693928,00" -> 693928.00
    // Handle both Brazilian format (1.234,56) and US format (1,234.56)
    const cleanValue = amountStr.toString()
        .replace(/\./g, '') // Remove thousand separators (dots)
        .replace(',', '.'); // Convert decimal comma to dot
    
    return parseFloat(cleanValue) || 0;
};

// Helper function to format amount for display
const formatAmount = (amounts: Record<string, string>, currency: string = 'BRL'): string => {
    const amount = parseAmount(amounts, currency);
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: currency 
    }).format(amount);
};

// Helper function to get primary amount (first non-zero amount or BRL)
const getPrimaryAmount = (amounts: Record<string, string>, preferredCurrency: string = 'BRL'): number => {
    // Try preferred currency first
    const preferred = parseAmount(amounts, preferredCurrency);
    if (preferred !== 0) return preferred;
    
    // Otherwise, find first non-zero amount
    for (const [currency, value] of Object.entries(amounts)) {
        const amount = parseAmount(amounts, currency);
        if (amount !== 0) return amount;
    }
    
    return 0;
};

// Recursive function to calculate parent amounts from children
const calculateParentAmounts = (node: LedgerAccount, currency: string = 'BRL'): number => {
    if (!node.children || node.children.length === 0) {
        return parseAmount(node.amounts, currency);
    }
    
    // Sum all children
    const childrenSum = node.children.reduce((sum, child) => {
        return sum + calculateParentAmounts(child, currency);
    }, 0);
    
    // Get node's own amount
    const nodeAmount = parseAmount(node.amounts, currency);
    
    // If node has its own amount, use it; otherwise use children sum
    return nodeAmount !== 0 ? nodeAmount : childrenSum;
};

const AccountNode: React.FC<AccountNodeProps> = ({ 
    account, 
    onSelect, 
    selectedAccount, 
    level = 0,
    isLastChild = false,
    parentConnections = [],
    currency = 'BRL'
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    
    const accountPath = account.fullPath || account.account;
    const hasChildren = account.children && account.children.length > 0;
    const isSelected = selectedAccount === accountPath;
    
    // Calculate amounts
    const totalAmount = React.useMemo(() => {
        return calculateParentAmounts(account, currency);
    }, [account, currency]);
    
    const clearedAmount = React.useMemo(() => {
        // For now, use the same as total amount
        // You can adjust this if you have cleared amounts in the API
        return totalAmount;
    }, [totalAmount]);
    
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
                    top: '20px',
                    width: '10px',
                }}
                    />
            );
            
            // Draw vertical line for current level
            lines.push(
                <div
                key="vertical"
                className={`absolute w-px bg-gray-300 ${isLastChild ? 'h-5' : 'h-full'}`}
                style={{
                    left: `${(level - 1) * 20 + 10}px`,
                    top: 0,
                }}
                    />
            );
        }
        
        return lines;
    };
    
    // Get last cleared date if available
    const lastClearedDate = account.lastClearedDate || '';
    
    return (
        <div>
            <div
        className={`
relative grid grid-cols-4 gap-4 items-center py-2 border-b cursor-pointer transition-all duration-200
${isSelected 
? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
: 'hover:bg-gray-50 hover:shadow-sm'
}
`}
        onClick={handleClick}
            >
            {/* Tree lines */}
        {renderTreeLines()}
        
        {/* Account Name Column with enhanced styling */}
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
            
            {/* Last Cleared Date Column */}
            <div className={`text-sm ${level === 0 ? 'text-gray-600' : 'text-gray-500'}`}>
            {lastClearedDate}
        </div>
            
            {/* Cleared Amount Column */}
            <div
        className={`font-mono text-right font-medium ${
clearedAmount > 0 ? 'text-green-600' : clearedAmount < 0 ? 'text-red-600' : 'text-gray-600'
}`}
            >
            {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: currency 
            }).format(clearedAmount)}
        </div>
            
            {/* Total Amount Column */}
            <div
        className={`font-mono text-right font-semibold ${
totalAmount > 0 ? 'text-green-600' : totalAmount < 0 ? 'text-red-600' : 'text-gray-600'
}`}
            >
            {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: currency 
            }).format(totalAmount)}
        </div>
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
                            currency={currency}
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
    currency = 'BRL'
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
            <div className="text-right">Cleared Amount</div>
            <div className="text-right">Total Amount</div>
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
                    currency={currency}
                        />
                );
            })}
        </div>
            </div>
    );
};
