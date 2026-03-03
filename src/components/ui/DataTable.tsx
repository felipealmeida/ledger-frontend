import React from 'react';

interface Column<T> {
    key: string;
    header: string;
    render: (row: T, index: number) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyFn: (row: T, index: number) => string;
    emptyMessage?: string;
    className?: string;
    stickyHeader?: boolean;
    onRowClick?: (row: T) => void;
}

export function DataTable<T>({
    columns,
    data,
    keyFn,
    emptyMessage = 'Nenhum dado disponível',
    className = '',
    stickyHeader = false,
    onRowClick,
}: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full">
                <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${col.headerClassName || 'text-left'}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((row, i) => (
                        <tr
                            key={keyFn(row, i)}
                            className={`transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : ''} ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className={`px-4 py-2.5 text-sm ${col.className || ''}`}>
                                    {col.render(row, i)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
