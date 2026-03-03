import React from 'react';

interface KpiCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'green' | 'red' | 'blue' | 'orange' | 'purple';
    trend?: 'up' | 'down' | 'neutral';
}

const colorMap = {
    green: 'border-l-green-500 bg-green-50/30',
    red: 'border-l-red-500 bg-red-50/30',
    blue: 'border-l-blue-500 bg-blue-50/30',
    orange: 'border-l-orange-500 bg-orange-50/30',
    purple: 'border-l-purple-500 bg-purple-50/30',
};

const iconColorMap = {
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    blue: 'text-blue-600 bg-blue-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
};

export const KpiCard: React.FC<KpiCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    color = 'blue',
}) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${colorMap[color]} p-4 sm:p-5`}>
        <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
                <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
                {subtitle && (
                    <p className="mt-0.5 text-xs sm:text-sm text-gray-500 truncate">{subtitle}</p>
                )}
            </div>
            <div className={`flex-shrink-0 ml-3 p-2 rounded-lg ${iconColorMap[color]}`}>
                {icon}
            </div>
        </div>
    </div>
);
