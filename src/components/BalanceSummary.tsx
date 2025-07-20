import React from 'react';
import { LedgerAccount } from '../types/api';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface BalanceSummaryProps {
  accounts: LedgerAccount[];
  currency: string;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts, currency }) => {
  const calculateSummary = () => {
    const topLevelAccounts = accounts.filter(acc => acc.indentLevel === 0);
    
    const assets = topLevelAccounts
      .filter(acc => acc.account.toLowerCase().includes('ativo') || acc.amount > 0)
      .reduce((sum, acc) => sum + Math.abs(acc.amount), 0);
    
    const liabilities = topLevelAccounts
      .filter(acc => acc.account.toLowerCase().includes('passivo') || 
                     acc.account.toLowerCase().includes('despesa') ||
                     (acc.amount < 0 && !acc.account.toLowerCase().includes('receita')))
      .reduce((sum, acc) => sum + Math.abs(acc.amount), 0);
    
    const income = topLevelAccounts
      .filter(acc => acc.account.toLowerCase().includes('receita'))
      .reduce((sum, acc) => sum + Math.abs(acc.amount), 0);
    
    const netWorth = assets - liabilities;
    
    return { assets, liabilities, income, netWorth };
  };

  const { assets, liabilities, income, netWorth } = calculateSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(amount);
  };

  const SummaryCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, amount, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatCurrency(amount)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        title="Ativos"
        amount={assets}
        icon={<TrendingUp className="h-6 w-6 text-green-600" />}
        color="border-l-green-500"
      />
      
      <SummaryCard
        title="Passivos"
        amount={liabilities}
        icon={<TrendingDown className="h-6 w-6 text-red-600" />}
        color="border-l-red-500"
      />
      
      <SummaryCard
        title="Receitas"
        amount={income}
        icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        color="border-l-blue-500"
      />
      
      <SummaryCard
        title="Patrimônio Líquido"
        amount={netWorth}
        icon={<DollarSign className="h-6 w-6 text-purple-600" />}
        color="border-l-purple-500"
      />
    </div>
  );
};
