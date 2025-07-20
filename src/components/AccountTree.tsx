import React from 'react';
import { LedgerAccount } from '../types/api';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface AccountTreeProps {
  accounts: LedgerAccount[];
  onAccountSelect?: (account: string) => void;
  selectedAccount?: string;
}

interface AccountNodeProps {
  account: LedgerAccount;
  onSelect?: (account: string) => void;
  isSelected: boolean;
}

const AccountNode: React.FC<AccountNodeProps> = ({ account, onSelect, isSelected }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  const handleClick = () => {
    if (onSelect) {
      onSelect(account.account);
    }
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const paddingLeft = account.indentLevel * 20;

  return (
    <div
      className={`
        flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
      `}
      style={{ paddingLeft: `${paddingLeft + 8}px` }}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2 flex-1">
        <span className="font-medium text-gray-800">
          {account.account}
        </span>
        {account.isSubAccount && (
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
  );
};

export const AccountTree: React.FC<AccountTreeProps> = ({ 
  accounts, 
  onAccountSelect, 
  selectedAccount 
}) => {
  return (
    <div className="space-y-1">
      {accounts.map((account, index) => (
        <AccountNode
          key={`${account.account}-${index}`}
          account={account}
          onSelect={onAccountSelect}
          isSelected={selectedAccount === account.account}
        />
      ))}
    </div>
  );
};
