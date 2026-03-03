import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BalancePage } from './pages/BalancePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetPage } from './pages/BudgetPage';
import { CashFlowPage } from './pages/CashFlowPage';

function App() {
    return (
        <Routes>
            <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/contas" element={<BalancePage />} />
                <Route path="/despesas" element={<ExpensesPage />} />
                <Route path="/orcamento" element={<BudgetPage />} />
                <Route path="/fluxo" element={<CashFlowPage />} />
            </Route>
        </Routes>
    );
}

export default App;
