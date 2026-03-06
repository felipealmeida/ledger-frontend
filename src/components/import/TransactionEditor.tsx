import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { LedgerTransaction, Posting } from '../../types/api';

interface TransactionEditorProps {
  transactions: LedgerTransaction[];
  categories: string[];
  onUpdate: (transactions: LedgerTransaction[]) => void;
  onConfirm: (selected: LedgerTransaction[]) => void;
}

// ── Account Autocomplete ─────────────────────────────────────────────────
const AccountAutocomplete: React.FC<{
  value: string;
  categories: string[];
  onChange: (val: string) => void;
}> = ({ value, categories, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilter(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return categories.filter(c => c.toLowerCase().includes(q));
  }, [filter, categories]);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        type="text"
        value={filter}
        onChange={e => {
          setFilter(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Conta..."
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg text-xs">
          {filtered.slice(0, 50).map(cat => (
            <li
              key={cat}
              onClick={() => {
                onChange(cat);
                setFilter(cat);
                setIsOpen(false);
              }}
              className={`cursor-pointer px-2 py-1.5 hover:bg-blue-50 ${
                cat === value ? 'bg-blue-100 font-medium' : ''
              }`}
            >
              {cat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Status Toggle ────────────────────────────────────────────────────────
const StatusToggle: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const cycle = () => {
    if (value === '') onChange('!');
    else if (value === '!') onChange('*');
    else onChange('');
  };

  const label = value === '!' ? '!' : value === '*' ? '✓' : '·';
  const color =
    value === '!'
      ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
      : value === '*'
        ? 'bg-green-100 text-green-700 border-green-300'
        : 'bg-gray-100 text-gray-400 border-gray-300';

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Status: ${value || 'none'} (clique para alternar)`}
      className={`w-7 h-7 rounded border text-xs font-bold flex items-center justify-center ${color}`}
    >
      {label}
    </button>
  );
};

// ── Posting Row ──────────────────────────────────────────────────────────
const PostingRow: React.FC<{
  posting: Posting;
  index: number;
  categories: string[];
  canRemove: boolean;
  onChange: (index: number, posting: Posting) => void;
  onRemove: (index: number) => void;
}> = ({ posting, index, categories, canRemove, onChange, onRemove }) => {
  return (
    <div className="flex items-center gap-1.5">
      <StatusToggle
        value={posting.status ?? ''}
        onChange={status => onChange(index, { ...posting, status })}
      />
      <AccountAutocomplete
        value={posting.account}
        categories={categories}
        onChange={account => onChange(index, { ...posting, account })}
      />
      <input
        type="text"
        value={posting.commodity}
        onChange={e => onChange(index, { ...posting, commodity: e.target.value })}
        className="w-12 rounded border border-gray-300 px-1.5 py-1 text-xs text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="BRL"
      />
      <input
        type="number"
        step="0.01"
        value={posting.amount ?? ''}
        onChange={e =>
          onChange(index, {
            ...posting,
            amount: e.target.value === '' ? null : parseFloat(e.target.value),
          })
        }
        className="w-24 rounded border border-gray-300 px-2 py-1 text-xs text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="valor"
      />
      {posting.date_tag !== null && (
        <input
          type="text"
          value={posting.date_tag || ''}
          onChange={e => onChange(index, { ...posting, date_tag: e.target.value })}
          className="w-28 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="[YYYY/MM/DD]"
        />
      )}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Remover posting"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

// ── Transaction Card ─────────────────────────────────────────────────────
const TransactionCard: React.FC<{
  tx: LedgerTransaction;
  txIndex: number;
  categories: string[];
  selected: boolean;
  onToggleSelect: () => void;
  onUpdate: (tx: LedgerTransaction) => void;
}> = ({ tx, txIndex, categories, selected, onToggleSelect, onUpdate }) => {
  const isSkipped = tx.skip;

  const handlePostingChange = useCallback(
    (pIdx: number, posting: Posting) => {
      const newPostings = [...tx.postings];
      newPostings[pIdx] = posting;
      onUpdate({ ...tx, postings: newPostings });
    },
    [tx, onUpdate]
  );

  const handlePostingRemove = useCallback(
    (pIdx: number) => {
      if (tx.postings.length <= 2) return;
      const newPostings = tx.postings.filter((_, i) => i !== pIdx);
      onUpdate({ ...tx, postings: newPostings });
    },
    [tx, onUpdate]
  );

  const handleAddPosting = useCallback(() => {
    const newPosting: Posting = {
      account: '',
      amount: null,
      commodity: 'BRL',
      status: '',
      date_tag: null,
    };
    onUpdate({ ...tx, postings: [...tx.postings, newPosting] });
  }, [tx, onUpdate]);

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        isSkipped
          ? 'border-gray-200 bg-gray-50 opacity-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          disabled={isSkipped}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
        />
        {isSkipped ? (
          <>
            <span className="text-xs text-gray-500">{tx.date}</span>
            <span className="text-xs text-gray-500 flex-1">{tx.description}</span>
            <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
              {tx.skip_reason || 'Ignorada'}
            </span>
          </>
        ) : (
          <>
            <input
              type="date"
              value={tx.date.replace(/\//g, '-')}
              onChange={e =>
                onUpdate({ ...tx, date: e.target.value.replace(/-/g, '/') })
              }
              className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={tx.description}
              onChange={e => onUpdate({ ...tx, description: e.target.value })}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Descrição"
            />
          </>
        )}
      </div>

      {/* Postings */}
      {!isSkipped && (
        <div className="ml-6 space-y-1.5">
          {tx.postings.map((p, pIdx) => (
            <PostingRow
              key={pIdx}
              posting={p}
              index={pIdx}
              categories={categories}
              canRemove={tx.postings.length > 2}
              onChange={handlePostingChange}
              onRemove={handlePostingRemove}
            />
          ))}
          <button
            type="button"
            onClick={handleAddPosting}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mt-1"
          >
            <Plus className="h-3 w-3" />
            <span>Adicionar posting</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────
export const TransactionEditor: React.FC<TransactionEditorProps> = ({
  transactions,
  categories,
  onUpdate,
  onConfirm,
}) => {
  // Selection state as parallel array
  const [selected, setSelected] = useState<boolean[]>(() =>
    transactions.map(t => !t.skip)
  );

  // Sync selection array length when transactions change
  useEffect(() => {
    setSelected(prev => {
      if (prev.length === transactions.length) return prev;
      return transactions.map((t, i) => (i < prev.length ? prev[i] : !t.skip));
    });
  }, [transactions.length]);

  const toggleSelect = useCallback(
    (idx: number) => {
      setSelected(prev => {
        const next = [...prev];
        next[idx] = !next[idx];
        return next;
      });
    },
    []
  );

  const selectAll = useCallback(() => {
    setSelected(transactions.map(t => !t.skip));
  }, [transactions]);

  const deselectAll = useCallback(() => {
    setSelected(transactions.map(() => false));
  }, [transactions]);

  const handleTxUpdate = useCallback(
    (idx: number, tx: LedgerTransaction) => {
      const next = [...transactions];
      next[idx] = tx;
      onUpdate(next);
    },
    [transactions, onUpdate]
  );

  // Stats for selected non-skip transactions
  const stats = useMemo(() => {
    let count = 0;
    let sum = 0;
    transactions.forEach((tx, i) => {
      if (tx.skip || !selected[i]) return;
      count++;
      tx.postings.forEach(p => {
        if (p.amount != null && p.amount < 0) {
          sum += p.amount;
        }
      });
    });
    return { count, sum };
  }, [transactions, selected]);

  const handleConfirm = useCallback(() => {
    const selectedTxs = transactions.filter((t, i) => !t.skip && selected[i]);
    onConfirm(selectedTxs);
  }, [transactions, selected, onConfirm]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Math.abs(val)
    );

  return (
    <div className="space-y-4">
      {/* Global controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 p-3">
        <button
          type="button"
          onClick={selectAll}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Selecionar Todas
        </button>
        <button
          type="button"
          onClick={deselectAll}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Desmarcar Todas
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-500">
          {stats.count} transações · {formatBRL(stats.sum)}
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={stats.count === 0}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Importar Selecionadas →
        </button>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {transactions.map((tx, i) => (
          <TransactionCard
            key={i}
            tx={tx}
            txIndex={i}
            categories={categories}
            selected={!tx.skip && selected[i]}
            onToggleSelect={() => toggleSelect(i)}
            onUpdate={updated => handleTxUpdate(i, updated)}
          />
        ))}
      </div>
    </div>
  );
};
