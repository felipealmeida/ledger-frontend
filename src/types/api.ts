export interface LedgerAccount {
  account: string;
  amount: number;
  formattedAmount: string;
  indentLevel: number;
  isSubAccount: boolean;
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
