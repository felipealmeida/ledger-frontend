import React from 'react';
import { LedgerAccount } from '../types/api';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface BalanceSummaryProps {
    accounts: LedgerAccount[];
    currency: string;
}

// Helper function to parse amount from the new format
const parseAmount = (amounts: Record<string, string>, currency: string = 'BRL'): number => {
    if (!amounts || typeof amounts !== 'object') return 0;
    
    const amountStr = amounts[currency] || amounts[currency.toLowerCase()] || '0';
    // Remove formatting: "693928,00" -> 693928.00
    const cleanValue = amountStr.toString()
        .replace(/\./g, '') // Remove thousand separators (dots)
        .replace(',', '.'); // Convert decimal comma to dot
    
    return parseFloat(cleanValue) || 0;
};

// Helper function to find account by path prefix in the tree
const findAccountByPrefix = (
    accounts: LedgerAccount[], 
    prefix: string,
    currency: string = 'BRL'
): number => {
    for (const account of accounts) {
        const path = (account.fullPath || account.account).toLowerCase();
        
        // Check if this account matches
        if (path === prefix.toLowerCase() || path.startsWith(prefix.toLowerCase() + ':')) {
            // If exact match at top level, return its amount
            if (path === prefix.toLowerCase()) {
                return parseAmount(account.amounts, currency);
            }
        }
        
        // Check if the prefix matches this account
        if (path.startsWith(prefix.toLowerCase())) {
            return parseAmount(account.amounts, currency);
        }
        
        // Recursively search children
        if (account.children && account.children.length > 0) {
            const childResult = findAccountByPrefix(account.children, prefix, currency);
            if (childResult !== 0) {
                return childResult;
            }
        }
    }
    
    return 0;
};

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts, currency }) => {
    const calculateSummary = () => {
        // Find the top-level category accounts (they already have summed values)
        const assets = findAccountByPrefix(accounts, 'ativos', currency);
        const expenses = findAccountByPrefix(accounts, 'despesas', currency);
        const liabilities = -findAccountByPrefix(accounts, 'passivo', currency);
        const income = Math.abs(findAccountByPrefix(accounts, 'receitas', currency));
        
        return { 
            assets, 
            liabilities, 
            income,
            expenses,
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
