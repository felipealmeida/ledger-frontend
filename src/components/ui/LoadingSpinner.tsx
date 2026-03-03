import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Carregando...',
    size = 'md',
}) => (
    <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
            <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeMap[size]}`} />
            <span className="text-gray-600 text-sm">{message}</span>
        </div>
    </div>
);
