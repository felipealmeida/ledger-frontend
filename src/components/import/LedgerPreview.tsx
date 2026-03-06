import React, { useMemo, useState } from 'react';
import { LedgerTransaction, Posting } from '../../types/api';

interface LedgerPreviewProps {
  transactions: LedgerTransaction[];
  fileName: string;
  onBack: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

// ── Client-side ledger formatting (mirrors backend format_ledger_text) ───

function formatAmount(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `BRL ${sign}${formatted}`;
}

function formatPostingLine(posting: Posting): string {
  const statusPrefix = posting.status ? `${posting.status} ` : '';

  let line: string;
  if (posting.amount != null) {
    const amountStr = formatAmount(posting.amount);
    const accountPart = `    ${statusPrefix}${posting.account}`;
    const padding = Math.max(2, 48 - accountPart.length);
    line = `${accountPart}${' '.repeat(padding)}${amountStr}`;
  } else {
    line = `    ${statusPrefix}${posting.account}`;
  }

  if (posting.date_tag) {
    line = `${line} ; ${posting.date_tag}`;
  }

  return line;
}

function formatTransactionBlock(tx: LedgerTransaction): string {
  const lines = [`${tx.date} ${tx.description}`];
  for (const posting of tx.postings) {
    lines.push(formatPostingLine(posting));
  }
  return lines.join('\n');
}

function formatAllTransactions(transactions: LedgerTransaction[]): string {
  const blocks = transactions
    .filter(tx => !tx.skip)
    .map(formatTransactionBlock);
  return blocks.length > 0 ? blocks.join('\n\n') + '\n' : '';
}

// ── Syntax highlighting ─────────────────────────────────────────────────

function highlightLine(line: string, isFirstLine: boolean): React.ReactNode[] {
  if (isFirstLine) {
    // Date line: "YYYY/MM/DD description"
    const match = line.match(/^(\d{4}\/\d{2}\/\d{2})\s(.+)$/);
    if (match) {
      return [
        <span key="date" className="ledger-date">{match[1]}</span>,
        <span key="sep"> </span>,
        <span key="desc">{match[2]}</span>,
      ];
    }
    return [<span key="raw">{line}</span>];
  }

  // Posting line - parse components
  const parts: React.ReactNode[] = [];
  // Match: indent + optional status + account + optional amount + optional date_tag
  const postingMatch = line.match(
    /^(\s+)(?:([!*])\s)?(.+?)(\s{2,})(BRL\s-?[\d,]+\.\d{2})(.*)/
  );

  if (postingMatch) {
    const [, indent, status, account, spacing, amount, rest] = postingMatch;
    parts.push(<span key="indent">{indent}</span>);
    if (status) {
      parts.push(<span key="status">{status} </span>);
    }
    parts.push(<span key="account" className="ledger-account">{account}</span>);
    parts.push(<span key="spacing">{spacing}</span>);

    // Color amount based on sign
    const isNegative = amount.includes('-');
    parts.push(
      <span key="amount" className={isNegative ? 'ledger-amount-neg' : 'ledger-amount-pos'}>
        {amount}
      </span>
    );

    // Date tag in rest
    if (rest) {
      const tagMatch = rest.match(/^(\s*;\s*)(\[.+\])(.*)$/);
      if (tagMatch) {
        parts.push(<span key="tag-semi">{tagMatch[1]}</span>);
        parts.push(<span key="tag-date" className="ledger-date">{tagMatch[2]}</span>);
        if (tagMatch[3]) parts.push(<span key="tag-rest">{tagMatch[3]}</span>);
      } else {
        parts.push(<span key="rest">{rest}</span>);
      }
    }
  } else {
    // Auto-balanced posting (no amount)
    const autoMatch = line.match(/^(\s+)(?:([!*])\s)?(.+)$/);
    if (autoMatch) {
      const [, indent, status, account] = autoMatch;
      parts.push(<span key="indent">{indent}</span>);
      if (status) {
        parts.push(<span key="status">{status} </span>);
      }
      parts.push(<span key="account" className="ledger-account">{account}</span>);
    } else {
      parts.push(<span key="raw">{line}</span>);
    }
  }

  return parts;
}

function HighlightedPre({ text }: { text: string }) {
  const lines = text.split('\n');
  // Track which lines are "first lines" of a transaction (after blank or start)
  let afterBlank = true;

  return (
    <pre className="ledger-preview-pre bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
      <style>{`
        .ledger-date { color: #60a5fa; }
        .ledger-account { color: #4ade80; }
        .ledger-amount-neg { color: #f87171; }
        .ledger-amount-pos { color: #4ade80; }
      `}</style>
      {lines.map((line, i) => {
        if (line.trim() === '') {
          afterBlank = true;
          return <span key={i}>{'\n'}</span>;
        }
        const isFirst = afterBlank;
        afterBlank = false;
        return (
          <span key={i}>
            {highlightLine(line, isFirst)}
            {i < lines.length - 1 ? '\n' : ''}
          </span>
        );
      })}
    </pre>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export const LedgerPreview: React.FC<LedgerPreviewProps> = ({
  transactions,
  fileName,
  onBack,
  onConfirm,
  isLoading,
}) => {
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const ledgerText = useMemo(() => formatAllTransactions(transactions), [transactions]);
  const txCount = useMemo(
    () => transactions.filter(t => !t.skip).length,
    [transactions]
  );

  const handleConfirm = async () => {
    setSaveResult(null);
    setErrorMsg('');
    try {
      await onConfirm();
      setSaveResult('success');
    } catch (err: any) {
      setSaveResult('error');
      setErrorMsg(err?.response?.data?.detail || err?.message || 'Erro ao salvar transações');
    }
  };

  if (saveResult === 'success') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center space-y-4">
        <div className="text-green-600 text-4xl">✓</div>
        <h3 className="text-lg font-medium text-gray-900">Importação concluída!</h3>
        <p className="text-sm text-gray-600">
          {txCount} transações salvas em <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{fileName}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          <span className="font-medium">{txCount}</span> transações →{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{fileName}</code>
        </div>
      </div>

      {/* Ledger text preview */}
      <HighlightedPre text={ledgerText} />

      {/* Error display */}
      {saveResult === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {errorMsg || 'Erro ao salvar transações'}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          ← Voltar
        </button>
        {saveResult === 'error' ? (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Salvando...' : 'Tentar Novamente'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || txCount === 0}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Salvando...' : 'Confirmar e Gravar'}
          </button>
        )}
      </div>
    </div>
  );
};
