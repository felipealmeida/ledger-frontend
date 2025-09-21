export interface LedgerAccount {
  account: string;
  amount: number;
  clearedAmount: number;
  lastClearedDate: string;
  children: LedgerAccount[];
  fullPath: string;
}

export interface LedgerBalanceResponse {
  accounts: LedgerAccount[];
  currency: string;
  timestamp: string;
  total: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface TransactionData {
  transactions: Transaction[];
  account: string;
  period?: string;
  timestamp: string;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  runningBalance: number;
}

export interface LedgerSubTotalNode {
    description: string;
    inflow_amount: number;
    outflow_amount: number;
    runningBalance: number;
}

export interface LedgerSubTotalsResponse {
    subtotals: LedgerSubTotalNode[];
    period?: string;
    account: string;
    timestamp: string;
}

export interface BudgetItem {
    account: string;
    fullPath: string;
    actualAmount: number;
    budgetAmount: number;
    variance: number;
    variancePercentage: number;
    formattedActual: string;
    formattedBudget: string;
    formattedVariance: string;
    isOverBudget: boolean;
}

export interface BudgetResponse {
    budgetItems: BudgetItem[];
    totalActual: number;
    totalBudget: number;
    totalVariance: number;
    period: string;
    timestamp: string;
}

