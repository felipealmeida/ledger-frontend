import axios from 'axios';
import {
    LedgerBalanceResponse, LedgerSubTotalsResponse, HealthResponse, BudgetResponse,
    withBigInts, LedgerPriceResponse, withBigIntsPrices,
    ImportAccountsResponse, ParseResponse, ImportCategoriesResponse,
    RecentTransactionsResponse, AppendRequest, AppendResponse,
} from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

export class LedgerApiService {

    static async getBalance(command: string, after: string | null, before: string | null): Promise<LedgerBalanceResponse> {
        const params = new URLSearchParams();
        if (after) params.append('after', after);
        if (before) params.append('before', before);
        const response = await api.get<LedgerBalanceResponse>(
            `/api/balance${params.toString() ? `?${params.toString()}` : ''}`
        );
        return withBigInts(response.data);
    }

    static async getHealth(): Promise<HealthResponse> {
        const response = await api.get<HealthResponse>('/api/health');
        return response.data;
    }

    static async getCashFlow(period?: string): Promise<LedgerSubTotalsResponse> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        const response = await api.get<LedgerSubTotalsResponse>(`/api/cash-flow?${params}`);
        return response.data;
    }

    static async getAccountCashFlow(account: string, period?: string): Promise<LedgerSubTotalsResponse> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        const response = await api.get<LedgerSubTotalsResponse>(
            `/api/cash-flow/${encodeURIComponent(account)}?${params}`
        );
        return response.data;
    }

    static async getBudgetReport(period?: string): Promise<BudgetResponse> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        const response = await api.get<BudgetResponse>(
            `/api/budget${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data;
    }

    static async getPrices(): Promise<LedgerPriceResponse> {
        const response = await api.get<LedgerPriceResponse>('api/prices');
        return withBigIntsPrices(response.data);
    }

    // ── Import endpoints ────────────────────────────────────────────────

    static async getImportAccounts(): Promise<ImportAccountsResponse> {
        const response = await api.get<ImportAccountsResponse>('/api/import/accounts');
        return response.data;
    }

    static async parseStatement(
        file: File,
        account: string,
        parser: string,
        year?: string,
    ): Promise<ParseResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('account', account);
        formData.append('parser', parser);
        if (year) formData.append('year', year);
        const response = await api.post<ParseResponse>('/api/import/parse', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000,
        });
        return response.data;
    }

    static async getImportCategories(): Promise<ImportCategoriesResponse> {
        const response = await api.get<ImportCategoriesResponse>('/api/import/categories');
        return response.data;
    }

    static async getRecentTransactions(
        account: string,
        limit?: number,
    ): Promise<RecentTransactionsResponse> {
        const params = new URLSearchParams();
        params.append('account', account);
        if (limit) params.append('limit', limit.toString());
        const response = await api.get<RecentTransactionsResponse>(
            `/api/import/recent?${params}`
        );
        return response.data;
    }

    static async appendTransactions(body: AppendRequest): Promise<AppendResponse> {
        const response = await api.post<AppendResponse>('/api/import/append', body);
        return response.data;
    }
}
