export interface LedgerAccount {
  account: string;
  amount: number;
  formattedAmount: string;
  children: LedgerAccount[];
  fullPath: string;
}

export interface LedgerBalanceResponse {
  accounts: LedgerAccount[];
  currency: string;
  timestamp: string;
  total: number;
}

export interface ValidationResponse {
  file: string;
  valid: boolean;
  timestamp: string;
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
  formattedAmount: string;
  runningBalance: number;
  formattedRunningBlanace: string;
}
