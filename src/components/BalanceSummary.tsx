import React from 'react';
import { LedgerAccount } from '../types/api';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface BalanceSummaryProps {
  accounts: LedgerAccount[];
  currency: string;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts, currency }) => {
  const calculateSummary = () => {
    // Use all accounts and check their full path to categorize them
    const assets = accounts
      .filter(acc => {
        const path = (acc.fullPath || acc.account).toLowerCase();
        return path.startsWith('ativos');
      })
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const expenses = accounts
      .filter(acc => {
        const path = (acc.fullPath || acc.account).toLowerCase();
        return path.startsWith('despesas');
      })
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const liabilities = accounts
      .filter(acc => {
        const path = (acc.fullPath || acc.account).toLowerCase();
        return path.startsWith('passivo');
      })
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const income = accounts
      .filter(acc => {
        const path = (acc.fullPath || acc.account).toLowerCase();
        return path.startsWith('receitas');
      })
      .reduce((sum, acc) => sum + Math.abs(acc.amount), 0);
    
    // Note: expenses are already positive in ledger, liabilities are negative
    return { 
      assets: assets, 
      liabilities: liabilities, 
      income: income,
      expenses: expenses,
    };
  };

  const { assets, liabilities, income, expenses } = calculateSummary();

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
        title="Despesas"
        amount={expenses}
        icon={<TrendingDown className="h-6 w-6 text-orange-600" />}
        color="border-l-orange-500"
      />
      
      <SummaryCard
        title="Receitas"
        amount={income}
        icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        color="border-l-blue-500"
      />
    </div>
  );
};
