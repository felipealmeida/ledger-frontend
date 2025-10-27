import Decimal from 'decimal.js';

export type AmountsMap = Record<string, string>;
export type BigAmountsMap = Record<string, Decimal>;

export interface LedgerAccount {
  account: string;
  fullPath: string;
  amounts: AmountsMap;
  lastClearedDate?: string | null;
  children?: LedgerAccount[];
  currency?: string;
}

export interface LedgerBalanceResponse {
  account: LedgerAccount;
  timestamp: string;
  currency?: string;
}

function attachBigInts(
  account: LedgerAccount
): LedgerAccount & { amountsBigInt: BigAmountsMap } {
  return {
    ...account,
    amountsBigInt: Object.fromEntries(
      Object.entries(account.amounts).map(([currency, value]) => [
        currency,
        new Decimal(value),
      ])
    ),
    children: account.children?.map(attachBigInts),
  };
}

export function withBigInts(
  res: LedgerBalanceResponse
): LedgerBalanceResponse & { account: ReturnType<typeof attachBigInts> } {
  return {
    ...res,
    account: attachBigInts(res.account),
  };
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

