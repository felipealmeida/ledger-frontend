import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
    className?: string;
}

const variantMap = {
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'gray',
    className = '',
}) => (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${variantMap[variant]} ${className}`}>
        {children}
    </span>
);
