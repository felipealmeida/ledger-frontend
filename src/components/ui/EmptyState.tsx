import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
}) => (
    <div className="text-center py-12">
        <div className="flex justify-center mb-4 text-gray-300">
            {icon || <Inbox className="h-16 w-16" />}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-gray-500 mb-4">{description}</p>}
        {action}
    </div>
);
