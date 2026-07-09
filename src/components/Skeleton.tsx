import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonCard({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('card p-4 animate-pulse', className)}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 skeleton rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 skeleton rounded-lg w-2/3" />
              <div className="h-3 skeleton rounded-lg w-1/2" />
              <div className="h-3 skeleton rounded-lg w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonTable({ count = 3 }: SkeletonProps) {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-11 skeleton rounded-none border-b border-slate-100 dark:border-slate-700" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 flex items-center gap-3 px-4 border-b border-slate-50 dark:border-slate-800">
          <div className="h-3 skeleton rounded-lg flex-1" />
          <div className="h-3 skeleton rounded-lg w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 skeleton rounded-lg"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 skeleton rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 skeleton rounded-lg w-3/4" />
            <div className="h-2.5 skeleton rounded-lg w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
