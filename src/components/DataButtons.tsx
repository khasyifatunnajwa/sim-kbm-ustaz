import {
  FileUp,
  Download,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';

type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';
type Size = 'sm' | 'md';

interface ConfirmAction {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const FORMAT_CONFIG: Record<
  ExportFormat,
  { icon: LucideIcon; label: string; color: string }
> = {
  csv: {
    icon: FileSpreadsheet,
    label: 'CSV',
    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
  },
  pdf: {
    icon: FileText,
    label: 'PDF',
    color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/30',
  },
  excel: {
    icon: FileSpreadsheet,
    label: 'Excel',
    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
  },
  json: {
    icon: Download,
    label: 'JSON',
    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
  },
};

const SIZE_CONFIG: Record<Size, { iconCls: string; padCls: string; textCls: string }> = {
  sm: { iconCls: 'w-4 h-4', padCls: 'py-2 px-2.5', textCls: 'text-xs' },
  md: { iconCls: 'w-4 h-4', padCls: 'py-3 px-3', textCls: 'text-sm' },
};

const IMPORT_COLOR =
  'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/30';

interface CommonButtonProps {
  onClick: () => void | Promise<void>;
  label?: string;
  variant?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  iconOnly?: boolean;
  confirmAction?: ConfirmAction;
}

function useConfirmedAction(
  onClick: () => void | Promise<void>,
  confirmAction?: ConfirmAction,
) {
  const { confirm, dialog } = useConfirm();

  const run = async () => {
    if (confirmAction) {
      const accepted = await confirm({
        title: confirmAction.title,
        message: confirmAction.message,
        confirmText: confirmAction.confirmText || 'Ya, lanjutkan',
        cancelText: confirmAction.cancelText || 'Batal',
        variant: 'warning',
      });

      if (!accepted) return;
    }

    await onClick();
  };

  return { run, dialog };
}

export function ImportButton({
  onClick,
  label = 'Impor Data',
  variant = 'sm',
  disabled,
  loading,
  className = '',
  iconOnly = false,
  confirmAction,
}: CommonButtonProps) {
  const sz = SIZE_CONFIG[variant];
  const { run, dialog } = useConfirmedAction(onClick, confirmAction);

  return (
    <>
      <button
        type="button"
        onClick={() => void run()}
        disabled={disabled || loading}
        title={iconOnly ? label : undefined}
        aria-label={label}
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 ${iconOnly ? 'h-10 w-10 p-0' : `${sz.padCls} ${sz.textCls}`} font-semibold rounded-xl border transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${IMPORT_COLOR} ${className}`}
      >
        {loading
          ? <RefreshCw className={`${sz.iconCls} animate-spin`} />
          : <FileUp className={sz.iconCls} />}
        {!iconOnly && (loading ? 'Memproses…' : label)}
      </button>
      {dialog}
    </>
  );
}

interface ExportButtonProps extends CommonButtonProps {
  format?: ExportFormat;
}

export function ExportButton({
  onClick,
  format = 'csv',
  label,
  variant = 'sm',
  disabled,
  loading,
  className = '',
  iconOnly = false,
  confirmAction,
}: ExportButtonProps) {
  const sz = SIZE_CONFIG[variant];
  const cfg = FORMAT_CONFIG[format];
  const text = label ?? `Ekspor ${cfg.label}`;
  const { run, dialog } = useConfirmedAction(onClick, confirmAction);
  const Icon = cfg.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => void run()}
        disabled={disabled || loading}
        title={iconOnly ? text : undefined}
        aria-label={text}
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 ${iconOnly ? 'h-10 w-10 p-0' : `${sz.padCls} ${sz.textCls}`} font-semibold rounded-xl border transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${cfg.color} ${className}`}
      >
        {loading
          ? <RefreshCw className={`${sz.iconCls} animate-spin`} />
          : <Icon className={sz.iconCls} />}
        {!iconOnly && (loading ? 'Memproses…' : text)}
      </button>
      {dialog}
    </>
  );
}

interface ActionIconButtonProps {
  onClick: () => void | Promise<void>;
  label: string;
  icon: LucideIcon;
  color: 'amber' | 'violet' | 'whatsapp';
  confirmAction: ConfirmAction;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const ACTION_COLORS: Record<ActionIconButtonProps['color'], string> = {
  amber:
    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100',
  violet:
    'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-100',
  whatsapp:
    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100',
};

export function ActionIconButton({
  onClick,
  label,
  icon: Icon,
  color,
  confirmAction,
  disabled,
  loading,
  className = '',
}: ActionIconButtonProps) {
  const { run, dialog } = useConfirmedAction(onClick, confirmAction);

  return (
    <>
      <button
        type="button"
        onClick={() => void run()}
        disabled={disabled || loading}
        title={label}
        aria-label={label}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${ACTION_COLORS[color]} ${className}`}
      >
        {loading
          ? <RefreshCw className="h-4 w-4 animate-spin" />
          : <Icon className="h-4 w-4" />}
      </button>
      {dialog}
    </>
  );
}

export const TemplateDownloadButton = (
  props: Omit<ActionIconButtonProps, 'icon' | 'color' | 'label' | 'confirmAction'> & {
    onClick: ActionIconButtonProps['onClick'];
  },
) => (
  <ActionIconButton
    {...props}
    icon={Download}
    color="amber"
    label="Unduh templat"
    confirmAction={{
      title: 'Unduh templat?',
      message: 'Templat akan diunduh ke perangkat Anda. Lanjutkan?',
      confirmText: 'Ya, unduh',
    }}
  />
);

export const PrintActionButton = (
  props: Omit<ActionIconButtonProps, 'icon' | 'color' | 'label' | 'confirmAction'>,
) => (
  <ActionIconButton
    {...props}
    icon={Printer}
    color="violet"
    label="Cetak data"
    confirmAction={{
      title: 'Cetak data?',
      message: 'Lanjutkan untuk membuka dialog cetak?',
      confirmText: 'Ya, cetak',
    }}
  />
);

export const WhatsAppActionButton = (
  props: Omit<ActionIconButtonProps, 'icon' | 'color' | 'label' | 'confirmAction'>,
) => (
  <ActionIconButton
    {...props}
    icon={MessageCircle}
    color="whatsapp"
    label="Bagikan via WhatsApp"
    confirmAction={{
      title: 'Bagikan melalui WhatsApp?',
      message: 'Data akan disiapkan untuk dibagikan melalui WhatsApp. Lanjutkan?',
      confirmText: 'Ya, bagikan',
    }}
  />
);
