import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, Globe } from 'lucide-react';
import { ImportableAccount } from '../../types/api';

interface FileUploadProps {
  accounts: ImportableAccount[];
  onSubmit: (file: File | null, account: string, parser: string, year?: number) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ accounts, onSubmit, isLoading }) => {
  const currentYear = new Date().getFullYear();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedParser, setSelectedParser] = useState('');
  const [year, setYear] = useState(currentYear);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAccountData = useMemo(
    () => accounts.find((a) => a.account === selectedAccount),
    [accounts, selectedAccount]
  );

  const importers = useMemo(() => selectedAccountData?.importers ?? [], [selectedAccountData]);

  const isWebParser = selectedParser.endsWith('-web');

  const handleAccountChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const account = e.target.value;
      setSelectedAccount(account);
      const acct = accounts.find((a) => a.account === account);
      if (acct && acct.importers.length === 1) {
        setSelectedParser(acct.importers[0].parser);
      } else {
        setSelectedParser('');
      }
    },
    [accounts]
  );

  const handleFile = useCallback((f: File) => {
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const canSubmit = selectedAccount && selectedParser && (isWebParser || file) && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(isWebParser ? null : file, selectedAccount, selectedParser, year);
  };

  return (
    <div className="space-y-5">
      {/* Account selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
        <select
          value={selectedAccount}
          onChange={handleAccountChange}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Selecione uma conta...</option>
          {accounts.map((a) => (
            <option key={a.account} value={a.account}>
              {a.account}
            </option>
          ))}
        </select>
      </div>

      {/* Format/importer selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
        <select
          value={selectedParser}
          onChange={(e) => setSelectedParser(e.target.value)}
          disabled={!selectedAccount || importers.length <= 1}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        >
          {importers.length === 0 && <option value="">Selecione uma conta primeiro</option>}
          {importers.length === 1 && (
            <option value={importers[0].parser}>{importers[0].label}</option>
          )}
          {importers.length > 1 && (
            <>
              <option value="">Selecione o formato...</option>
              {importers.map((imp) => (
                <option key={imp.parser} value={imp.parser}>
                  {imp.label}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Year input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10) || currentYear)}
          min={2000}
          max={2099}
          className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Drag & drop zone — hidden for web parsers */}
      {!isWebParser && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : file
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <Upload className={`h-8 w-8 mb-2 ${file ? 'text-green-500' : 'text-gray-400'}`} />
            {file ? (
              <p className="text-sm text-green-700 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Arraste o arquivo aqui ou <span className="text-blue-600 font-medium">clique para selecionar</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">.pdf ou .csv</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Web parser info */}
      {isWebParser && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Globe className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            As transações serão buscadas diretamente do site do MercadoPago.
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center space-x-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>{isWebParser ? 'Buscando...' : 'Analisando...'}</span>
          </span>
        ) : isWebParser ? (
          'Buscar Transações'
        ) : (
          'Analisar Fatura'
        )}
      </button>
    </div>
  );
};
