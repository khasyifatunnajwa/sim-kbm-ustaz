import type { ReactNode } from 'react';

// ====== Section Wrapper ======
export function SettingsSection({
  icon: Icon,
  title,
  desc,
  children,
  accent = 'text-primary-600 bg-primary-50',
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4 md:p-5 border-b border-slate-100 dark:border-slate-700">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">{title}</h3>
          {desc && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-1">{children}</div>
    </div>
  );
}

// ====== Row Wrapper ======
export function SettingsRow({
  title,
  desc,
  children,
  control,
}: {
  title: string;
  desc?: string;
  children?: ReactNode;
  control?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {desc && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {control ?? children}
    </div>
  );
}

// ====== Toggle Switch ======
export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

// ====== Option Group (pill buttons) ======
export function OptionGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            value === opt.value
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ====== Segmented Control (full-width) ======
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            value === opt.value
              ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ====== Slider ======
export function SettingsSlider({
  min,
  max,
  step,
  value,
  onChange,
  labels,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  labels?: string[];
}) {
  return (
    <div className="w-full max-w-xs">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full appearance-none cursor-pointer accent-primary-600"
      />
      {labels && (
        <div className="flex justify-between mt-1.5">
          {labels.map((l, i) => (
            <span key={i} className="text-[10px] text-slate-400">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ====== Action Button (storage, security, about) ======
export function SettingsAction({
  icon: Icon,
  title,
  desc,
  onClick,
  variant = 'default',
  rightIcon: RightIcon,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger' | 'primary';
  rightIcon?: React.ElementType;
}) {
  const iconColor =
    variant === 'danger'
      ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
      : variant === 'primary'
      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 group"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-semibold ${variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>{title}</p>
        {desc && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {RightIcon && <RightIcon className="w-4 h-4 text-slate-300 dark:text-slate-500 flex-shrink-0 group-hover:text-slate-400 transition-colors" />}
    </button>
  );
}

// ====== Color Swatch Picker ======
export function ColorSwatchPicker<T extends string>({
  colors,
  value,
  onChange,
}: {
  colors: { label: string; value: T; bg: string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {colors.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          title={c.label}
          className={`relative w-10 h-10 rounded-full transition-all active:scale-90 ${c.bg} ${value === c.value ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-slate-700 dark:ring-white' : ''}`}
        >
          {value === c.value && (
            <svg className="absolute inset-0 m-auto w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
