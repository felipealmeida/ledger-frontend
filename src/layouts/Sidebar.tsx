import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Landmark, Receipt, Target, ArrowLeftRight, X, Activity
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isConnected: boolean;
}

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/contas', label: 'Contas', icon: Landmark },
    { to: '/despesas', label: 'Despesas', icon: Receipt },
    { to: '/orcamento', label: 'Orçamento', icon: Target },
    { to: '/fluxo', label: 'Fluxo de Caixa', icon: ArrowLeftRight },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isConnected }) => {
    return (
        <>
            {/* Backdrop (mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full w-60 bg-white border-r border-gray-200 shadow-lg
                    flex flex-col transition-transform duration-200 ease-in-out
                    md:translate-x-0 md:static md:z-auto md:shadow-none
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-blue-600" />
                        <span className="font-bold text-gray-900 text-lg">Ledger</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-gray-100 md:hidden"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer — health */}
                <div className="px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs">
                        <Activity className={`h-3.5 w-3.5 ${isConnected ? 'text-green-500' : 'text-red-400'}`} />
                        <span className={isConnected ? 'text-green-600' : 'text-red-500'}>
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};
