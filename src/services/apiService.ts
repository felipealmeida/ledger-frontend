import axios from 'axios';
import {
    LedgerBalanceResponse, LedgerSubTotalsResponse, HealthResponse, BudgetResponse,
    withBigInts, LedgerPriceResponse, withBigIntsPrices
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
}
