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

// Helper function to build tree from flat list with paths
const buildTreeFromPaths = (accounts: LedgerAccount[]): LedgerAccount[] => {
    const tree: LedgerAccount[] = [];
    const nodeMap = new Map<string, LedgerAccount>();
    
    // First, create all necessary parent nodes
    accounts.forEach(account => {
        const path = account.fullPath || account.account;
        const parts = path.split(':');
        
        // Create parent nodes if they don't exist
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}:${parts[i]}` : parts[i];

            if (!nodeMap.has(currentPath)) {
                nodeMap.set(currentPath, {
                    account: parts[i],
                    fullPath: currentPath,
                    amount: 0,
                    clearedAmount: 0,
                    lastClearedDate: '',
                    children: []
                });
            }
        }

        // Add the actual account
        nodeMap.set(path, {
            ...account,
            children: []
        });
    });
    
    // Now build the tree structure
    nodeMap.forEach((node, path) => {
        const parts = path.split(':');
        
        if (parts.length === 1) {
            // Root node
            tree.push(node);
        } else {
            // Find parent and add as child
            const parentPath = parts.slice(0, -1).join(':');
            const parent = nodeMap.get(parentPath);
            
            if (parent) {
                if (!parent.children) parent.children = [];
                parent.children.push(node);
            }
        }
    });
    
    // Calculate parent amounts (sum of children)
    const calculateParentAmounts = (node: LedgerAccount): number => {
        if (!node.children || node.children.length === 0) {
            return node.amount;
        }
        
        const childrenSum = node.children.reduce((sum, child) => {
            return sum + calculateParentAmounts(child);
        }, 0);
        
        // If this node has its own amount (from the original data), use it
        // Otherwise, use the sum of children
        const originalNode = accounts.find(acc => 
            (acc.fullPath || acc.account) === (node.fullPath || node.account)
                                          );
        
        if (originalNode) {
            return node.amount;
        } else {
            node.amount = childrenSum;
            return childrenSum;
        }
    };

    // Calculate parent amounts (sum of children)
    const calculateParentClearedAmounts = (node: LedgerAccount): number => {
        if (!node.children || node.children.length === 0) {
            return node.clearedAmount;
        }
        
        const childrenSum = node.children.reduce((sum, child) => {
            return sum + calculateParentClearedAmounts(child);
        }, 0);
        
        // If this node has its own ClearedAmount (from the original data), use it
        // Otherwise, use the sum of children
        const originalNode = accounts.find(acc => 
            (acc.fullPath || acc.account) === (node.fullPath || node.account)
                                          );
        
        if (originalNode) {
            return node.clearedAmount;
        } else {
            node.clearedAmount = childrenSum;
            return childrenSum;
        }
    };

    // Calculate ClearedAmounts for all root nodes
    tree.forEach(node => calculateParentAmounts(node));
    tree.forEach(node => calculateParentClearedAmounts(node));
    
    // Sort children alphabetically
    const sortChildren = (node: LedgerAccount) => {
        if (node.children && node.children.length > 0) {
            node.children.sort((a, b) => a.account.localeCompare(b.account));
            node.children.forEach(sortChildren);
        }
    };
    
    tree.forEach(sortChildren);
    tree.sort((a, b) => a.account.localeCompare(b.account));
    
    return tree;
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
            {account.lastClearedDate}
        </div>
            
            {/* Cleared Amount Column */}
            <div
        className={`font-mono text-right font-medium ${
account.clearedAmount > 0 ? 'text-green-600' : 'text-red-600'
}`}
            >
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL'}).format(account.clearedAmount)}
        </div>
            
            {/* Total Amount Column */}
            <div
        className={`font-mono text-right font-semibold ${
account.amount > 0 ? 'text-green-600' : 'text-red-600'
}`}
            >
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL'}).format(account.amount)}
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
    // Build tree from flat list
    const treeAccounts = React.useMemo(() => {
        const isTree = accounts.some(acc => acc.children && acc.children.length > 0);
        
        if (isTree) {
            return accounts;
        }
        
        return buildTreeFromPaths(accounts);
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
            {treeAccounts.map((account, index) => {
                const isLast = index === treeAccounts.length - 1;
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
