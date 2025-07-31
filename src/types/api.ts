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
