import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FileUpload } from '../components/import/FileUpload';
import { TransactionEditor } from '../components/import/TransactionEditor';
import { LedgerPreview } from '../components/import/LedgerPreview';
import { LedgerApiService } from '../services/apiService';
import { ImportableAccount, ParseResponse, LedgerTransaction } from '../types/api';

type WizardStep = 'upload' | 'review' | 'confirm' | 'done';

const ImportPage: React.FC = () => {
    // Wizard state machine
    const [step, setStep] = useState<WizardStep>('upload');

    // Data state
    const [accounts, setAccounts] = useState<ImportableAccount[]>([]);

    // API state
    const [isLoading, setIsLoading] = useState(false);
    const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
    const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
    const [selectedTransactions, setSelectedTransactions] = useState<LedgerTransaction[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch accounts on mount
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setIsLoading(true);
                const res = await LedgerApiService.getImportAccounts();
                setAccounts(res.accounts);
            } catch (err: any) {
                setError(err?.response?.data?.detail || err?.message || 'Erro ao carregar contas');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const handleSubmitUpload = useCallback(async (file: File, account: string, parser: string, year?: number) => {
        setError(null);
        setIsLoading(true);
        try {
            const yearStr = year ? String(year) : undefined;
            const [result, catRes] = await Promise.all([
                LedgerApiService.parseStatement(file, account, parser, yearStr),
                LedgerApiService.getImportCategories(),
            ]);
            setParseResult(result);
            const txsWithSelected = result.transactions.map(tx => ({
                ...tx,
                selected: !tx.skip,
            }));
            setTransactions(txsWithSelected);
            setCategories(catRes.categories);
            setStep('review');
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || 'Erro ao processar fatura');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleTransactionsUpdate = useCallback((updated: LedgerTransaction[]) => {
        setTransactions(updated);
    }, []);

    const handleEditorConfirm = useCallback((selected: LedgerTransaction[]) => {
        setSelectedTransactions(selected);
        setStep('confirm');
    }, []);

    const getTargetFile = useCallback((): string => {
        if (!parseResult) return '';
        const acc = accounts.find(a => a.account === parseResult.account);
        return acc?.import_file || '';
    }, [parseResult, accounts]);

    const handleConfirm = useCallback(async () => {
        const targetFile = getTargetFile();
        if (!targetFile) {
            throw new Error('Arquivo de destino não encontrado para a conta');
        }
        setError(null);
        setIsLoading(true);
        try {
            await LedgerApiService.appendTransactions({
                file: targetFile,
                transactions: selectedTransactions,
            });
            setStep('done');
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || 'Erro ao salvar transações');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [getTargetFile, selectedTransactions]);

    const handleReset = useCallback(() => {
        setStep('upload');
        setParseResult(null);
        setTransactions([]);
        setSelectedTransactions([]);
        setCategories([]);
        setError(null);
    }, []);

    // ── Review Step ───────────────────────────────────────────────────────
    const renderReview = () => (
        <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-900">
                    Revisão — {parseResult?.period}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {transactions.length} transações encontradas para {parseResult?.account}
                </p>
            </div>

            <TransactionEditor
                transactions={transactions}
                categories={categories}
                onUpdate={handleTransactionsUpdate}
                onConfirm={handleEditorConfirm}
            />

            <div className="flex gap-3">
                <button
                    onClick={() => setStep('upload')}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                    ← Voltar
                </button>
            </div>
        </div>
    );

    // ── Confirm Step ──────────────────────────────────────────────────────
    const renderConfirm = () => (
        <LedgerPreview
            transactions={selectedTransactions}
            fileName={getTargetFile()}
            onBack={() => setStep('review')}
            onConfirm={handleConfirm}
            isLoading={isLoading}
        />
    );

    // ── Done Step ────────────────────────────────────────────────────────
    const renderDone = () => (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center space-y-4">
            <div className="text-green-600 text-4xl">✓</div>
            <h3 className="text-lg font-medium text-gray-900">Importação concluída!</h3>
            <p className="text-sm text-gray-600">
                {selectedTransactions.length} transações salvas com sucesso.
            </p>
            <button
                onClick={handleReset}
                className="bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
            >
                Importar Outra Fatura
            </button>
        </div>
    );

    return (
        <div className="space-y-4 max-w-2xl">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                {(['upload', 'review', 'confirm', 'done'] as WizardStep[]).map((s, i) => (
                    <React.Fragment key={s}>
                        {i > 0 && <span className="text-gray-300">→</span>}
                        <span className={step === s ? 'text-blue-600 font-semibold' : ''}>
                            {s === 'upload' && 'Upload'}
                            {s === 'review' && 'Revisão'}
                            {s === 'confirm' && 'Confirmar'}
                            {s === 'done' && 'Concluído'}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium ml-3"
                    >
                        Fechar
                    </button>
                </div>
            )}

            {/* Loading spinner (not shown during confirm — LedgerPreview handles its own loading) */}
            {isLoading && step !== 'confirm' && <LoadingSpinner message="Processando..." />}

            {/* Step content */}
            {!isLoading && step === 'upload' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <FileUpload
                        accounts={accounts}
                        onSubmit={handleSubmitUpload}
                        isLoading={isLoading}
                    />
                </div>
            )}
            {!isLoading && step === 'review' && renderReview()}
            {step === 'confirm' && renderConfirm()}
            {step === 'done' && renderDone()}
        </div>
    );
};

export default ImportPage;
