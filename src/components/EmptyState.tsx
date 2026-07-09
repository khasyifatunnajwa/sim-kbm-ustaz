import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'Belum ada data',
  description = 'Mulai tambahkan data untuk melihat di sini',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
        {icon || <Inbox size={28} />}
      </div>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
