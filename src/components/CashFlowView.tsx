import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown } from 'lucide-react';
import { KpiCard } from './ui/KpiCard';
import { Card, CardHeader } from './ui/Card';

interface LedgerSubTotalNode {
    description: string;
    inflow_amount: number;
    outflow_amount: number;
    runningBalance?: number;
}

interface CashFlowTreeNode extends LedgerSubTotalNode {
    path: string;
    level: number;
    children: CashFlowTreeNode[];
    isParent: boolean;
}

interface CashFlowViewProps {
    subtotals: LedgerSubTotalNode[];
    currency: string;
}

const buildCashFlowTree = (subtotals: LedgerSubTotalNode[]): CashFlowTreeNode[] => {
    const tree: CashFlowTreeNode[] = [];
    const nodeMap = new Map<string, CashFlowTreeNode>();

    subtotals.forEach(item => {
        const path = item.description;
        const parts = path.split(':');
        let currentPath = '';
        for (let i = 0; i < parts.length; i++) {
            currentPath = currentPath ? `${currentPath}:${parts[i]}` : parts[i];
            if (!nodeMap.has(currentPath)) {
                const isLeaf = i === parts.length - 1;
                nodeMap.set(currentPath, {
                    description: parts[i].trim(),
                    path: currentPath,
                    level: i,
                    inflow_amount: isLeaf ? item.inflow_amount : 0,
                    outflow_amount: isLeaf ? item.outflow_amount : 0,
                    runningBalance: isLeaf ? item.runningBalance : 0,
                    children: [],
                    isParent: !isLeaf,
                });
            }
        }
    });

    nodeMap.forEach((node, path) => {
        const parts = path.split(':');
        if (parts.length === 1) {
            tree.push(node);
        } else {
            const parentPath = parts.slice(0, -1).join(':');
            const parent = nodeMap.get(parentPath);
            if (parent) {
                parent.children.push(node);
                parent.isParent = true;
            }
        }
    });

    const calculateParentAmounts = (node: CashFlowTreeNode): void => {
        if (node.children.length > 0) {
            let inflowSum = 0;
            let outflowSum = 0;
            node.children.forEach(child => {
                calculateParentAmounts(child);
                inflowSum += child.inflow_amount;
                outflowSum += child.outflow_amount;
            });
            if (node.isParent) {
                node.inflow_amount = inflowSum;
                node.outflow_amount = outflowSum;
            }
        }
    };
    tree.forEach(calculateParentAmounts);

    const sortChildren = (node: CashFlowTreeNode) => {
        if (node.children.length > 0) {
            node.children.sort((a, b) => Math.abs(b.inflow_amount + b.outflow_amount) - Math.abs(a.inflow_amount + a.outflow_amount));
            node.children.forEach(sortChildren);
        }
    };
    tree.forEach(sortChildren);

    return tree;
};

const CashFlowTreeNodeComponent: React.FC<{
    node: CashFlowTreeNode;
    formatCurrency: (amount: number) => string;
    expandedPaths: Set<string>;
    onToggleExpand: (path: string) => void;
}> = ({ node, formatCurrency, expandedPaths, onToggleExpand }) => {
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.children.length > 0;

    return (
        <>
            <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-2 px-4" style={{ paddingLeft: `${node.level * 20 + 16}px` }}>
                    <div className="flex items-center">
                        {hasChildren && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onToggleExpand(node.path); }}
                                className="p-0.5 hover:bg-gray-200 rounded mr-1.5"
                            >
                                {isExpanded ? <ChevronDown size={14} className="text-gray-600" /> : <ChevronRight size={14} className="text-gray-600" />}
                            </button>
                        )}
                        <span className={`text-sm ${hasChildren ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{node.description}</span>
                    </div>
                </td>
                <td className="text-right py-2 px-4 text-sm font-mono text-green-600">
                    {node.inflow_amount > 0 ? formatCurrency(node.inflow_amount) : '—'}
                </td>
                <td className="text-right py-2 px-4 text-sm font-mono text-red-600">
                    {node.outflow_amount < 0 ? formatCurrency(Math.abs(node.outflow_amount)) : '—'}
                </td>
            </tr>
            {isExpanded && hasChildren && node.children.map((child, index) => (
                <CashFlowTreeNodeComponent
                    key={`${child.path}-${index}`}
                    node={child}
                    formatCurrency={formatCurrency}
                    expandedPaths={expandedPaths}
                    onToggleExpand={onToggleExpand}
                />
            ))}
        </>
    );
};

export default function CashFlowView({ subtotals, currency }: CashFlowViewProps) {
    const formatCurrencyFn = (amount: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(amount);

    const treeData = useMemo(() => buildCashFlowTree(subtotals), [subtotals]);

    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
        const allPaths = new Set<string>();
        const collectPaths = (nodes: CashFlowTreeNode[]) => {
            nodes.forEach(node => {
                if (node.children.length > 0) {
                    allPaths.add(node.path);
                    collectPaths(node.children);
                }
            });
        };
        collectPaths(treeData);
        return allPaths;
    });

    const [expandAll, setExpandAll] = useState(true);

    const totalInflow = subtotals.reduce((sum, item) => sum + item.inflow_amount, 0);
    const totalOutflow = subtotals.reduce((sum, item) => sum + Math.abs(item.outflow_amount), 0);
    const netFlow = totalInflow - totalOutflow;

    const handleToggleExpand = (path: string) => {
        setExpandedPaths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) newSet.delete(path);
            else newSet.add(path);
            return newSet;
        });
    };

    const handleExpandAll = () => {
        if (expandAll) {
            setExpandedPaths(new Set());
        } else {
            const allPaths = new Set<string>();
            const collectPaths = (nodes: CashFlowTreeNode[]) => {
                nodes.forEach(node => { if (node.children.length > 0) { allPaths.add(node.path); collectPaths(node.children); } });
            };
            collectPaths(treeData);
            setExpandedPaths(allPaths);
        }
        setExpandAll(!expandAll);
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <KpiCard
                    title="Entradas"
                    value={formatCurrencyFn(totalInflow)}
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="green"
                />
                <KpiCard
                    title="Saídas"
                    value={formatCurrencyFn(totalOutflow)}
                    icon={<TrendingDown className="h-5 w-5" />}
                    color="red"
                />
                <KpiCard
                    title="Líquido"
                    value={formatCurrencyFn(netFlow)}
                    icon={netFlow >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    color={netFlow >= 0 ? 'blue' : 'orange'}
                />
            </div>

            {/* Tree */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Detalhamento</h2>
                        <button
                            type="button"
                            onClick={handleExpandAll}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            {expandAll ? 'Recolher Tudo' : 'Expandir Tudo'}
                        </button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-600 uppercase">Descrição</th>
                                <th className="text-right py-2.5 px-4 text-xs font-semibold text-green-600 uppercase">Entradas</th>
                                <th className="text-right py-2.5 px-4 text-xs font-semibold text-red-600 uppercase">Saídas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {treeData.map((node, index) => (
                                <CashFlowTreeNodeComponent
                                    key={`${node.path}-${index}`}
                                    node={node}
                                    formatCurrency={formatCurrencyFn}
                                    expandedPaths={expandedPaths}
                                    onToggleExpand={handleToggleExpand}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
