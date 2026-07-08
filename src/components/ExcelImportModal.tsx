import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, X, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from './Modal';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: { key: string; label: string; required?: boolean; example?: string }[];
  onImport: (data: Record<string, any>[]) => Promise<void>;
}

export default function ExcelImportModal({ isOpen, onClose, title, columns, onImport }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setSuccess(false);
    setErrors([]);
    setPreview([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        if (json.length === 0) {
          setErrors(['File kosong atau tidak ada data yang dapat dibaca']);
          return;
        }

        // Validate required columns
        const missingCols: string[] = [];
        columns.forEach(col => {
          if (col.required && !json[0].hasOwnProperty(col.key) && !json[0].hasOwnProperty(col.label)) {
            missingCols.push(col.label);
          }
        });

        if (missingCols.length > 0) {
          setErrors([`Kolom wajib tidak ditemukan: ${missingCols.join(', ')}`]);
        } else {
          setPreview(json.slice(0, 5));
        }
      } catch (err: any) {
        setErrors([`Gagal membaca file: ${err.message}`]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      await onImport(preview);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setFile(null);
        setPreview([]);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setErrors([err.message || 'Gagal impor data']);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-4">
        {/* Column Guide */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Format Kolom Excel</span>
          </div>
          <div className="space-y-1 text-[11px]">
            {columns.map(col => (
              <div key={col.key} className="flex items-center gap-2">
                <span className={`font-mono px-1.5 py-0.5 rounded ${col.required ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {col.key}
                </span>
                {col.required && <span className="text-rose-500">*</span>}
                <span className="text-slate-500 dark:text-slate-400">{col.label}</span>
                {col.example && <span className="text-slate-400 dark:text-slate-500 italic">(contoh: {col.example})</span>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">* Kolom wajib harus ada</p>
        </div>

        {/* File Upload */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview([]); }} className="p-1 hover:bg-slate-200 rounded">
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Klik untuk pilih file Excel</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">.xlsx atau .xls</p>
            </>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3">
            {errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {err}
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Preview Data (5 baris pertama)</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="px-2 py-1.5 text-left font-semibold text-slate-600 dark:text-slate-300">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                      {columns.map(col => (
                        <td key={col.key} className="px-2 py-1.5 text-slate-700 dark:text-slate-300">
                          {row[col.key] ?? row[col.label] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Data berhasil diimpor!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={handleClose} className="btn-secondary flex-1 text-sm">Batal</button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing || success}
            className="btn-primary flex-1 text-sm disabled:opacity-50"
          >
            {importing ? 'Mengimpor...' : success ? 'Berhasil!' : `Impor ${preview.length > 0 ? `(${preview.length})` : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
