import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';

interface ExpenseItem {
    account: string;
    amount: number;
}

interface MonthData {
    label: string;
    expenses: ExpenseItem[];
}

interface ExpenseDiffChartProps {
    monthA: MonthData;
    monthB: MonthData;
    currency: string;
    maxItems?: number;
}

type Row = {
    account: string;
    a: number;
    b: number;
    diff: number;
    absDiff: number;
    pctChange?: number;
    isOthers?: boolean;
};

export const ExpenseDiffChart: React.FC<ExpenseDiffChartProps> = ({
    monthA,
    monthB,
    currency,
    maxItems = 12,
}) => {
    const fmtMoney = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(Math.abs(v));

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

    const allAccounts = React.useMemo(() => Array.from(new Set([...aMap.keys(), ...bMap.keys()])), [aMap, bMap]);

    const rows = React.useMemo<Row[]>(() => {
        const r: Row[] = allAccounts.map((acc) => {
            const a = aMap.get(acc) ?? 0;
            const b = bMap.get(acc) ?? 0;
            const diff = b - a;
            return { account: acc, a, b, diff, absDiff: Math.abs(diff), pctChange: a !== 0 ? diff / a : undefined };
        });
        r.sort((x, y) => y.absDiff - x.absDiff);
        if (r.length <= maxItems) return r;

        const top = r.slice(0, maxItems - 1);
        const rest = r.slice(maxItems - 1);
        const others = rest.reduce(
            (acc, cur) => { acc.a += cur.a; acc.b += cur.b; acc.diff += cur.diff; acc.absDiff = Math.abs(acc.diff); return acc; },
            { account: `Outros (${rest.length})`, a: 0, b: 0, diff: 0, absDiff: 0, isOthers: true } as Row
        );
        others.pctChange = others.a !== 0 ? others.diff / others.a : undefined;
        return [...top, others];
    }, [allAccounts, aMap, bMap, maxItems]);

    const totalA = React.useMemo(() => rows.reduce((s, r) => s + r.a, 0), [rows]);
    const totalB = React.useMemo(() => rows.reduce((s, r) => s + r.b, 0), [rows]);
    const totalDiff = totalB - totalA;

    const chartData = rows.map((r) => ({ account: r.account, diff: r.diff, isOthers: r.isOthers }));

    const colorFor = (diff: number, isOthers?: boolean) => {
        if (diff > 0) return isOthers ? '#f87171' : '#dc2626';
        if (diff < 0) return isOthers ? '#86efac' : '#16a34a';
        return '#9ca3af';
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload[0]) {
            const { account } = payload[0].payload;
            const row = rows.find((r) => r.account === account);
            if (!row) return null;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{row.account}</p>
                    <p className="text-gray-600">{monthA.label}: <span className="font-mono">{fmtMoney(row.a)}</span></p>
                    <p className="text-gray-600">{monthB.label}: <span className="font-mono">{fmtMoney(row.b)}</span></p>
                    <p className={row.diff > 0 ? 'text-red-600' : row.diff < 0 ? 'text-green-600' : 'text-gray-600'}>
                        Δ {fmtMoney(row.diff)} {row.pctChange !== undefined && `(${(row.pctChange * 100).toFixed(1)}%)`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                    Variação: {monthA.label} → {monthB.label}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    Positivo = gastou mais em {monthB.label}
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                            <XAxis type="number" tickFormatter={(v) => fmtMoney(v)} fontSize={11} />
                            <YAxis type="category" dataKey="account" width={150} tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 21) + '…' : v} fontSize={11} />
                            <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="3 3" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="diff" radius={3}>
                                {chartData.map((d, i) => <Cell key={i} fill={colorFor(d.diff, d.isOthers)} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                        {rows.map((r) => {
                            const Icon = r.diff > 0 ? TrendingUp : r.diff < 0 ? TrendingDown : Minus;
                            const tone = r.diff > 0 ? 'text-red-600' : r.diff < 0 ? 'text-green-600' : 'text-gray-500';
                            return (
                                <div key={r.account} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Icon className={`w-4 h-4 flex-shrink-0 ${tone}`} />
                                        <span className="truncate text-gray-700">{r.account}</span>
                                    </div>
                                    <span className={`font-mono font-semibold ml-2 flex-shrink-0 ${tone}`}>
                                        {fmtMoney(r.diff)}
                                    </span>
                                </div>
                            );
                        })}

                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                            <span className="font-semibold text-gray-700">Total</span>
                            <span className={`font-mono font-bold ${totalDiff > 0 ? 'text-red-600' : totalDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {fmtMoney(totalDiff)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ExpenseDiffChart;
