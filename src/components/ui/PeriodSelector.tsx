import React from 'react';

interface PeriodSelectorProps {
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (v: string) => void;
    onDateToChange: (v: string) => void;
    onApply: (from?: string, to?: string) => void;
}

const quickPeriods = [
    { label: 'Este Ano', getRange: () => { const y = new Date().getFullYear(); return { from: `${y}-01-01`, to: '' }; } },
    { label: 'Este Mês', getRange: () => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); return { from: `${y}-${m}-01`, to: '' }; } },
    { label: 'Mês Passado', getRange: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const last = new Date(y, d.getMonth() + 1, 0).getDate(); return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` }; } },
    { label: 'Limpar', getRange: () => ({ from: '', to: '' }) },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onApply,
}) => {
    const handleQuick = (getRange: () => { from: string; to: string }) => {
        const { from, to } = getRange();
        onDateFromChange(from);
        onDateToChange(to);
        onApply(from, to);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="De"
            />
            <span className="text-gray-400 text-sm">até</span>
            <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Até"
            />
            <button
                onClick={() => onApply()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
                Aplicar
            </button>

            <div className="flex flex-wrap gap-1.5 ml-1">
                {quickPeriods.map(({ label, getRange }) => (
                    <button
                        key={label}
                        onClick={() => handleQuick(getRange)}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};
