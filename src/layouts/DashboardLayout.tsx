import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { usePricesData } from '../hooks/usePricesData';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/contas': 'Contas',
    '/despesas': 'Despesas',
    '/orcamento': 'Orçamento',
    '/fluxo': 'Fluxo de Caixa',
};

export const DashboardLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { isConnected } = useHealthCheck();
    const { rates, isLoading: pricesLoading, refresh: refreshPrices } = usePricesData();

    const title = pageTitles[location.pathname] || 'Ledger';

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isConnected={isConnected}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar
                    title={title}
                    onMenuClick={() => setSidebarOpen(true)}
                    onRefresh={refreshPrices}
                    isLoading={pricesLoading}
                    rates={rates}
                    pricesLoading={pricesLoading}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
