import Decimal from 'decimal.js';

export type AmountsMap = Record<string, string>;
export type BigAmountsMap = Record<string, Decimal>;

export interface LedgerAccount {
  account: string;
  fullPath: string;
  amounts: AmountsMap;
  clearedAmounts: AmountsMap;
  lastClearedDate?: string | null;
  children?: LedgerAccount[];
  currency?: string;
}

export type AccWithBig = LedgerAccount & { amountsBigInt?: Record<string, Decimal>, clearedAmountsBigInt?: Record<string, Decimal> };

export interface LedgerBalanceResponse {
  account: LedgerAccount;
  timestamp: string;
  currency?: string;
}

function attachBigInts(
  account: LedgerAccount
): LedgerAccount & { amountsBigInt: BigAmountsMap, clearedAmountsBigInt: Record<string, Decimal> } {
  return {
    ...account,
    amountsBigInt: Object.fromEntries(
      Object.entries(account.amounts).map(([currency, value]) => [
        currency,
        new Decimal(value),
      ])
    ),
    clearedAmountsBigInt: Object.fromEntries(
      Object.entries(account.clearedAmounts).map(([currency, value]) => [
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

export interface Price {
    what: string;
    amounts: Record<string, string>;
    is_commodity: boolean;
}

function attachBigIntsToPrice(
  prices: Price[]
): (Price & { amountsBigInt: BigAmountsMap })[] {
  return prices.map(price => ({
    ...price,
    amountsBigInt: Object.fromEntries(
      Object.entries(price.amounts).map(([currency, value]) => [
        currency,
        new Decimal(value),
      ])
    ),
  }));
}

export interface LedgerPriceResponse {
    prices: Price[];
    timestamp: string;
}

export function withBigIntsPrices(
  res: LedgerPriceResponse
): LedgerPriceResponse & { prices: ReturnType<typeof attachBigIntsToPrice> } {
  return {
    ...res,
    prices: attachBigIntsToPrice(res.prices),
  };
}

// Import feature types

export interface Importer {
  parser: string;
  label: string;
}

export interface ImportableAccount {
  account: string;
  import_file: string;
  importers: Importer[];
}

export interface Posting {
  account: string;
  amount?: number | null;
  commodity?: string;
  status?: string;
  date_tag?: string | null;
}

export interface LedgerTransaction {
  date: string;
  description: string;
  skip: boolean;
  skip_reason?: string | null;
  postings: Posting[];
  selected?: boolean;
}

export interface ImportAccountsResponse {
  accounts: ImportableAccount[];
}

export interface ParseResponse {
  account: string;
  file: string;
  period: string;
  transactions: LedgerTransaction[];
}

export interface ImportCategoriesResponse {
  categories: string[];
}

export interface RecentMapping {
  description: string;
  account: string;
}

export interface RecentTransactionsResponse {
  account: string;
  mappings: RecentMapping[];
}

export interface AppendRequest {
  file: string;
  transactions: LedgerTransaction[];
}

export interface AppendResponse {
  success: boolean;
  file: string;
  count: number;
  preview: string;
}
