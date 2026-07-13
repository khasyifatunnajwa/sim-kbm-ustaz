import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  value, onChange, options, placeholder = 'Pilih...', label, icon, disabled, className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={className} ref={ref}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="input-field flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="flex-shrink-0 text-slate-400">{icon}</span>}
          <span className={`truncate ${selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown size={16} className={`flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden"
            style={{ minWidth: '100%' }}
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari..."
                  className="w-full pl-8 pr-7 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 rounded-lg outline-none border border-transparent focus:border-emerald-400 text-slate-700 dark:text-slate-200"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Tidak ada data</p>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                      opt.value === value
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && <Check size={14} className="flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
