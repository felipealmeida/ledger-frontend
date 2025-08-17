import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExpenseItem {
    account: string;
    amount: number;
}

interface MonthData {
    label: string;              // e.g., "July 2025"
    expenses: ExpenseItem[];    // aggregated per account for the month
}

interface ExpenseDiffChartProps {
    monthA: MonthData;          // baseline / older month
    monthB: MonthData;          // comparison / newer month
    currency: string;           // e.g., 'BRL'
    maxItems?: number;          // how many biggest changes to show (by absolute difference)
}

type Row = {
    account: string;
    a: number;          // amount in month A
    b: number;          // amount in month B
    diff: number;       // b - a (positive = increase in spending)
    absDiff: number;    // |diff|
    pctChange?: number; // diff / a (if a != 0)
    isOthers?: boolean;
};

export const ExpenseDiffChart: React.FC<ExpenseDiffChartProps> = ({
    monthA,
    monthB,
    currency,
    maxItems = 12, // keeps the chart readable; adjust as you like
}) => {
    const fmtMoney = (v: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'BRL',
        }).format(Math.abs(v));

    // Build a map for quick lookup
    const aMap = React.useMemo(() => {
        const m = new Map<string, number>();
        monthA.expenses.forEach((e) => m.set(e.account, (m.get(e.account) || 0) + e.amount));
        return m;
    }, [monthA]);

    const bMap = React.useMemo(() => {
        const m = new Map<string, number>();
        monthB.expenses.forEach((e) => m.set(e.account, (m.get(e.account) || 0) + e.amount));
        return m;
    }, [monthB]);

    // Union of accounts
    const allAccounts = React.useMemo(() => {
        const s = new Set<string>([...aMap.keys(), ...bMap.keys()]);
        return Array.from(s);
    }, [aMap, bMap]);

    // Per-account rows
    const rows = React.useMemo<Row[]>(() => {
        const r: Row[] = allAccounts.map((acc) => {
            const a = aMap.get(acc) ?? 0;
            const b = bMap.get(acc) ?? 0;
            const diff = b - a;
            const pctChange = a !== 0 ? diff / a : undefined;
            return { account: acc, a, b, diff, absDiff: Math.abs(diff), pctChange };
        });

        // Sort by biggest absolute change first
        r.sort((x, y) => y.absDiff - x.absDiff);

        if (r.length <= maxItems) return r;

        const top = r.slice(0, maxItems - 1);
        const rest = r.slice(maxItems - 1);

        const others = rest.reduce(
            (acc, cur) => {
                acc.a += cur.a;
                acc.b += cur.b;
                acc.diff += cur.diff;
                acc.absDiff = Math.abs(acc.diff);
                return acc;
            },
            { account: `Others (${rest.length} accounts)`, a: 0, b: 0, diff: 0, absDiff: 0, isOthers: true } as Row
        );
        others.pctChange = others.a !== 0 ? others.diff / others.a : undefined;

        return [...top, others];
    }, [allAccounts, aMap, bMap, maxItems]);

    // Totals
    const totalA = React.useMemo(() => rows.reduce((s, r) => s + r.a, 0), [rows]);
    const totalB = React.useMemo(() => rows.reduce((s, r) => s + r.b, 0), [rows]);
    const totalDiff = totalB - totalA;
    const totalPct =
        totalA !== 0 ? totalDiff / totalA : undefined;

    // Chart data = rows (diff only)
    const chartData = rows.map((r) => ({
        account: r.account,
        diff: r.diff,
        isOthers: r.isOthers,
    }));

    // Colors (increase = spent more = red, decrease = spent less = green, others = gray-ish tint)
    const colorFor = (diff: number, isOthers?: boolean) => {
        if (diff > 0) return isOthers ? '#f87171' : '#dc2626'; // reds
        if (diff < 0) return isOthers ? '#86efac' : '#16a34a'; // greens
        return '#9ca3af'; // neutral gray
        // Tip: tweak palette to match your app
    };

    // Tooltip for the bar chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const { account, diff } = payload[0].payload;
            const row = rows.find((r) => r.account === account);
            if (!row) return null;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{row.account}</p>
                    <div className="text-sm text-gray-700 space-y-1">
                    <p>
                    {monthA.label}: <span className="font-mono">{fmtMoney(row.a)}</span>
                    </p>
                    <p>
                    {monthB.label}: <span className="font-mono">{fmtMoney(row.b)}</span>
                    </p>
                    <p className={`${row.diff > 0 ? 'text-red-600' : row.diff < 0 ? 'text-green-600' : 'text-gray-600'} font-medium`}>
                    Δ {fmtMoney(row.diff)} {row.diff > 0 ? '(more)' : row.diff < 0 ? '(less)' : ''}
                {row.pctChange !== undefined && (
                    <span className="ml-1 text-xs text-gray-500">
                        ({(row.pctChange * 100).toFixed(1)}%)
                    </span>
                )}
                </p>
                    </div>
                    {row.isOthers && (
                        <p className="text-xs text-gray-500 mt-1">Aggregated from remaining accounts</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
            <h2 className="text-lg font-semibold text-gray-800">
            Expense Changes: {monthA.label} → {monthB.label}
        </h2>
            <p className="text-sm text-gray-600">
            Bars show the change in spending per account (positive = more spent in {monthB.label}).
            </p>
            </div>
            <div className="text-sm text-gray-600">
            Showing {rows.length} {rows.length === 1 ? 'account' : 'accounts'}
        </div>
            </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diverging bar chart */}
            <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={420}>
            <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
            <XAxis type="number" tickFormatter={(v) => fmtMoney(v)} />
            <YAxis
        type="category"
        dataKey="account"
        width={160}
        tickFormatter={(v: string) =>
            v.length > 24 ? v.slice(0, 23) + '…' : v
                      }
            />
            <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="diff" radius={4}>
            {chartData.map((d, i) => (
                <Cell key={i} fill={colorFor(d.diff, d.isOthers)} />
            ))}
        </Bar>
            </BarChart>
            </ResponsiveContainer>
            </div>

            {/* List */}
            <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Per-Account Detail
        </h3>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {rows.map((r) => {
                const up = r.diff > 0;
                const down = r.diff < 0;
                const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
                const tone = up ? 'text-red-600' : down ? 'text-green-600' : 'text-gray-600';
                const chip =
                    up ? 'bg-red-50 text-red-700' : down ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700';

                return (
                    <div
                    key={r.account}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50"
                        >
                        <div className="flex items-center gap-3 min-w-0">
                        <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded ${chip}`}
                    title={up ? 'Increase' : down ? 'Decrease' : 'No change'}
                        >
                        <Icon className={`w-4 h-4 ${tone}`} />
                        </span>
                        <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${r.isOthers ? 'text-gray-600' : 'text-gray-800'}`}>
                        {r.account}
                    </div>
                        {r.isOthers && (
                            <div className="text-xs text-gray-500">Aggregated</div>
                        )}
                    </div>
                        </div>

                        <div className="flex items-center gap-4 ml-3 text-sm">
                        <div className="text-right">
                        <div className="text-gray-500">{monthA.label}</div>
                        <div className="font-mono">{fmtMoney(r.a)}</div>
                        </div>
                        <div className="text-right">
                        <div className="text-gray-500">{monthB.label}</div>
                        <div className="font-mono">{fmtMoney(r.b)}</div>
                        </div>
                        <div className="text-right">
                        <div className="text-gray-500">Δ</div>
                        <div className={`font-mono font-semibold ${tone}`}>
                        {fmtMoney(r.diff)}
                    {r.pctChange !== undefined && (
                        <span className="ml-2 text-xs text-gray-500">
                            ({(r.pctChange * 100).toFixed(1)}%)
                        </span>
                    )}
                    </div>
                        </div>
                        </div>
                        </div>
                );
            })}
        </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
            <div className="text-gray-500">{monthA.label}</div>
            <div className="font-mono">{fmtMoney(totalA)}</div>
            </div>
            <div className="text-right">
            <div className="text-gray-500">{monthB.label}</div>
            <div className="font-mono">{fmtMoney(totalB)}</div>
            </div>
            <div className="text-right">
            <div className="text-gray-500">Δ</div>
            <div className={`font-mono font-semibold ${
totalDiff > 0 ? 'text-red-600' : totalDiff < 0 ? 'text-green-600' : 'text-gray-600'
}`}>
            {fmtMoney(totalDiff)}
        {totalPct !== undefined && (
            <span className="ml-2 text-xs text-gray-500">
                ({(totalPct * 100).toFixed(1)}%)
            </span>
        )}
        </div>
            </div>
            </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
            Positive Δ means you spent more in {monthB.label} than in {monthA.label}.
            </p>
            </div>
            </div>
            </div>
            </div>
    );
};

export default ExpenseDiffChart;
