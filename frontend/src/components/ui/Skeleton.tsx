'use client';

import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('sk', className)} />;
}

/** A list of skeleton rows resembling list items. */
export function SkeletonList({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
          <Skeleton className="h-3 w-12 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** A grid of skeleton cards resembling poster/anime cards. */
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          <Skeleton className="aspect-[3/4] rounded-none" />
          <div className="p-2.5 space-y-2">
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
