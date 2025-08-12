import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown } from 'lucide-react';

// Types
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

// Build tree from flat list based on description paths
const buildCashFlowTree = (subtotals: LedgerSubTotalNode[]): CashFlowTreeNode[] => {
    const tree: CashFlowTreeNode[] = [];
    const nodeMap = new Map<string, CashFlowTreeNode>();
    
    // First pass: create all nodes
    subtotals.forEach(item => {
        const path = item.description;
        const parts = path.split(':');
        const level = parts.length - 1;
        
        // Create parent nodes if they don't exist
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
                    isParent: !isLeaf
                });
            }
        }
    });
    
    // Second pass: build tree structure
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
    
    // Calculate parent amounts (sum of children)
    const calculateParentAmounts = (node: CashFlowTreeNode): void => {
        if (node.children.length > 0) {
            let inflowSum = 0;
            let outflowSum = 0;
            
            node.children.forEach(child => {
                calculateParentAmounts(child);
                inflowSum += child.inflow_amount;
                outflowSum += child.outflow_amount;
            });
            
            // Only update if this is a parent node (not original data)
            if (node.isParent) {
                node.inflow_amount = inflowSum;
                node.outflow_amount = outflowSum;
            }
        }
    };
    
    tree.forEach(calculateParentAmounts);
    
    // Sort children by amount (largest first), but not at root level
    const sortChildren = (node: CashFlowTreeNode) => {
        if (node.children.length > 0) {
            node.children.sort((a, b) => {
                // Calculate net amount for each node (inflow - outflow)
                const aNet = a.inflow_amount + a.outflow_amount; // outflow is negative
                const bNet = b.inflow_amount + b.outflow_amount;
                
                // Sort by absolute value, largest first
                return Math.abs(bNet) - Math.abs(aNet);
            });
            node.children.forEach(sortChildren);
        }
    };
    
    tree.forEach(sortChildren);
    // Don't sort root level - keep original order
    
    return tree;
};

// Tree node component
const CashFlowTreeNodeComponent: React.FC<{
    node: CashFlowTreeNode;
    formatCurrency: (amount: number) => string;
    expandedPaths: Set<string>;
    onToggleExpand: (path: string) => void;
}> = ({ node, formatCurrency, expandedPaths, onToggleExpand }) => {
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.children.length > 0;
    
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            onToggleExpand(node.path);
        }
    };
    
    return (
        <>
            <tr className="border-b hover:bg-gray-50">
                <td className="py-2 px-4" style={{ paddingLeft: `${node.level * 24 + 16}px` }}>
                    <div className="flex items-center">
                        {hasChildren && (
                            <button
                                onClick={handleToggle}
                                className="p-1 hover:bg-gray-200 rounded transition-colors mr-2"
                            >
                                {isExpanded ? 
                                    <ChevronDown size={16} className="text-gray-600" /> : 
                                    <ChevronRight size={16} className="text-gray-600" />
                                }
                            </button>
                        )}
                        <span className={hasChildren ? 'font-semibold' : ''}>{node.description}</span>
                    </div>
                </td>
                <td className="text-right py-2 px-4 text-green-600">
                    {node.inflow_amount > 0 ? formatCurrency(node.inflow_amount) : '-'}
                </td>
                <td className="text-right py-2 px-4 text-red-600">
                    {node.outflow_amount < 0 ? formatCurrency(Math.abs(node.outflow_amount)) : '-'}
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
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: currency || 'BRL' 
        }).format(amount);
    };
    
    // Build tree structure
    const treeData = useMemo(() => buildCashFlowTree(subtotals), [subtotals]);
    
    // Initialize with all paths expanded
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
    
    // Calculate totals
    const totalInflow = subtotals.reduce((sum, item) => sum + item.inflow_amount, 0);
    const totalOutflow = subtotals.reduce((sum, item) => sum + Math.abs(item.outflow_amount), 0);
    const netFlow = totalInflow - totalOutflow;
    
    const handleToggleExpand = (path: string) => {
        setExpandedPaths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };
    
    const handleExpandAll = () => {
        if (expandAll) {
            setExpandedPaths(new Set());
        } else {
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
            setExpandedPaths(allPaths);
        }
        setExpandAll(!expandAll);
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Total Inflow</p>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(totalInflow)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Total Outflow</p>
                            <p className="text-2xl font-bold text-red-700">
                                {formatCurrency(totalOutflow)}
                            </p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 border ${netFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                Net Cash Flow
                            </p>
                            <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                {formatCurrency(netFlow)}
                            </p>
                        </div>
                        {netFlow >= 0 ? (
                            <TrendingUp className="h-8 w-8 text-blue-500" />
                        ) : (
                            <TrendingDown className="h-8 w-8 text-orange-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* Cash Flow Items */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Cash Flow Details</h2>
                    <button
                        onClick={handleExpandAll}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        {expandAll ? 'Collapse All' : 'Expand All'}
                    </button>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-4">Description</th>
                                    <th className="text-right py-2 px-4 text-green-600">Inflow</th>
                                    <th className="text-right py-2 px-4 text-red-600">Outflow</th>
                                </tr>
                            </thead>
                            <tbody>
                                {treeData.map((node, index) => (
                                    <CashFlowTreeNodeComponent
                                        key={`${node.path}-${index}`}
                                        node={node}
                                        formatCurrency={formatCurrency}
                                        expandedPaths={expandedPaths}
                                        onToggleExpand={handleToggleExpand}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

