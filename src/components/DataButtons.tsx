import { Upload, Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';

type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';
type Size = 'sm' | 'md';

const FORMAT_CONFIG: Record<ExportFormat, { icon: typeof Upload; label: string; color: string }> = {
  csv:   { icon: Download,         label: 'CSV',   color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' },
  pdf:   { icon: FileText,         label: 'PDF',   color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/30' },
  excel: { icon: FileSpreadsheet,  label: 'Excel', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' },
  json:  { icon: Download,         label: 'JSON',  color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' },
};

const SIZE_CONFIG: Record<Size, { iconCls: string; padCls: string; textCls: string }> = {
  sm: { iconCls: 'w-3.5 h-3.5', padCls: 'py-2.5 px-3', textCls: 'text-xs' },
  md: { iconCls: 'w-4 h-4', padCls: 'py-3 px-4', textCls: 'text-sm' },
};

const IMPORT_COLOR = 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/30';

interface ImportButtonProps {
  onClick: () => void;
  label?: string;
  variant?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ImportButton({ onClick, label = 'Import CSV', variant = 'sm', disabled, loading, className = '' }: ImportButtonProps) {
  const sz = SIZE_CONFIG[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-1.5 ${sz.padCls} ${sz.textCls} font-semibold rounded-xl border transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${IMPORT_COLOR} ${className}`}
    >
      {loading ? <RefreshCw className={`${sz.iconCls} animate-spin`} /> : <Upload className={sz.iconCls} />}
      {loading ? 'Memproses...' : label}
    </button>
  );
}

interface ExportButtonProps {
  onClick: () => void;
  format?: ExportFormat;
  label?: string;
  variant?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ExportButton({ onClick, format = 'csv', label, variant = 'sm', disabled, loading, className = '' }: ExportButtonProps) {
  const sz = SIZE_CONFIG[variant];
  const cfg = FORMAT_CONFIG[format];
  const text = label ?? `Export ${cfg.label}`;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-1.5 ${sz.padCls} ${sz.textCls} font-semibold rounded-xl border transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${cfg.color} ${className}`}
    >
      {loading ? <RefreshCw className={`${sz.iconCls} animate-spin`} /> : <cfg.icon className={sz.iconCls} />}
      {loading ? 'Memproses...' : text}
    </button>
  );
}
