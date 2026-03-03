import { useState, useEffect, useCallback } from 'react';
import { LedgerApiService } from '../services/apiService';
import { HealthResponse } from '../types/api';

export function useHealthCheck(intervalMs = 30000) {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const check = useCallback(async () => {
        try {
            const res = await LedgerApiService.getHealth();
            setHealth(res);
            setIsConnected(true);
        } catch {
            setIsConnected(false);
        }
    }, []);

    useEffect(() => {
        check();
        const id = setInterval(check, intervalMs);
        return () => clearInterval(id);
    }, [check, intervalMs]);

    return { health, isConnected, check };
}
