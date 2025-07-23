import axios from 'axios';
import { LedgerBalanceResponse, ValidationResponse, HealthResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

export class LedgerApiService {


    static async getAccountTransactions(account: string, file?: string, period?: string): Promise<any> {
        const params = new URLSearchParams();
        if (file) params.append('file', file);
        if (period) params.append('period', period);
        
        const response = await api.get(
            `/api/transactions/${encodeURIComponent(account)}${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data;
    }

    /**
     * Get all account balances
     */
    static async getBalance(file?: string, command?: string, period?: string): Promise<LedgerBalanceResponse> {
        const params = new URLSearchParams();
        if (file) params.append('file', file);
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
    static async getAccountBalance(account: string, file?: string, period?: string): Promise<LedgerBalanceResponse> {
        const params = file ? `?file=${encodeURIComponent(file)}` : '';
        const response = await api.get<LedgerBalanceResponse>(
            `/api/balance/${encodeURIComponent(account)}${params}`
        );
        return response.data;
    }

    /**
     * Validate ledger file
     */
    static async validateFile(file: string): Promise<ValidationResponse> {
        const response = await api.get<ValidationResponse>(
            `/api/validate/${encodeURIComponent(file)}`
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
}
