import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumb mb-1.5">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-2.5 h-2.5 breadcrumb-separator" />}
              <button
                onClick={bc.onClick}
                disabled={!bc.onClick}
                className={`breadcrumb-item ${bc.onClick ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {bc.label}
              </button>
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
