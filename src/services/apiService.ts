import axios from 'axios';
import { LedgerBalanceResponse, LedgerSubTotalsResponse, HealthResponse, BudgetResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

export class LedgerApiService {


    static async getAccountTransactions(account: string, period?: string): Promise<any> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        
        const response = await api.get(
            `/api/transactions/${encodeURIComponent(account)}${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data;
    }

    /**
     * Get all account balances
     */
    static async getBalance(command?: string, period?: string): Promise<LedgerBalanceResponse> {
        const params = new URLSearchParams();
        if (command) params.append('command', command);
        if (period) params.append('period', period);
        
        const response = await api.get<LedgerBalanceResponse>(
            `/api/balance${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data;
    }

    /**
     * Get balance for specific account
     */
    static async getAccountBalance(account: string, period?: string): Promise<LedgerBalanceResponse> {
        const response = await api.get<LedgerBalanceResponse>(
            `/api/balance/${encodeURIComponent(account)}`
        );
        return response.data;
    }

    /**
     * Health check
     */
    static async getHealth(): Promise<HealthResponse> {
        const response = await api.get<HealthResponse>('/api/health');
        return response.data;
    }

    /**
     * Get API documentation
     */
    static async getApiDocs(): Promise<any> {
        const response = await api.get('/');
        return response.data;
    }


    static async getCashFlow(period?: string): Promise<LedgerSubTotalsResponse> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        
        const response = await axios.get(`${API_BASE_URL}/api/cash-flow?${params}`);
        return response.data;
    }

    static async getAccountCashFlow(account: string, period?: string): Promise<LedgerSubTotalsResponse> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        
        const response = await axios.get(`${API_BASE_URL}/api/cash-flow/${encodeURIComponent(account)}?${params}`);
        return response.data;
    }


    static async getBudgetReport(period?: string): Promise<BudgetResponse> {
        try {
            const params = new URLSearchParams();
            if (period) {
                params.append('period', period);
            }
            
            const url = `${API_BASE_URL}/api/budget${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch budget report:', error);
            throw error;
        }
    }
}
