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
          formattedAmount: 'BRL 0.00',
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
      node.formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(childrenSum);
      return childrenSum;
    }
  };
  
  // Calculate amounts for all root nodes
  tree.forEach(node => calculateParentAmounts(node));
  
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

const AccountNode: React.FC<AccountNodeProps> = ({ account, onSelect, selectedAccount }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    
    // Use fullPath if available, otherwise use account name
    const accountPath = account.fullPath || account.account;
    
    // Calculate level from the path (number of colons)
    const level = accountPath.split(':').length - 1;
    
    // Check if has children
    const hasChildren = account.children && account.children.length > 0;
    
    // Check if this account is selected
    const isSelected = selectedAccount === accountPath;
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            // Use fullPath if available, otherwise use account name
            onSelect(accountPath, !hasChildren);
        }
    };
    
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };
    
    const getAmountColor = (amount: number) => {
        if (amount > 0) return 'text-green-600';
        if (amount < 0) return 'text-red-600';
        return 'text-gray-600';
    };
    
    const paddingLeft = level * 20;
    
    return (
        <div>
            <div
                className={`
                    flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
                    ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                `}
                style={{ paddingLeft: `${paddingLeft + 8}px` }}
                onClick={handleClick}
            >
                <div className="flex items-center space-x-2 flex-1">
                    {hasChildren && (
                        <button 
                            onClick={handleToggle}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                            {isExpanded ? 
                                <ChevronDown size={16} className="text-gray-600" /> : 
                                <ChevronRight size={16} className="text-gray-600" />
                            }
                        </button>
                    )}
                    {!hasChildren && <div className="w-6" />}
                    <span className="font-medium text-gray-800">
                        {account.account}
                    </span>
                    {level > 0 && (
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Sub
                        </span>
                    )}
                </div>
                
                <div className="flex items-center space-x-3">
                    <span className={`font-mono text-sm font-semibold ${getAmountColor(account.amount)}`}>
                        {account.formattedAmount}
                    </span>
                </div>
            </div>
            
            {isExpanded && hasChildren && account.children && (
                <div>
                    {account.children.map((childAccount, index) => (
                        <AccountNode
                            key={`${childAccount.fullPath || childAccount.account}-${index}`}
                            account={childAccount}
                            onSelect={onSelect}
                            selectedAccount={selectedAccount}
                        />
                    ))}
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
        // Check if already a tree structure
        const isTree = accounts.some(acc => acc.children && acc.children.length > 0);
        
        if (isTree) {
            return accounts;
        }
        
        // Build tree from paths
        return buildTreeFromPaths(accounts);
    }, [accounts]);
    
    return (
        <div className="space-y-1">
            {treeAccounts.map((account, index) => (
                <AccountNode
                    key={`${account.fullPath || account.account}-${index}`}
                    account={account}
                    onSelect={onAccountSelect}
                    selectedAccount={selectedAccount}
                />
            ))}
        </div>
    );
};
