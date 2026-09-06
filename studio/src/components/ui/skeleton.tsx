/**
 * Skeleton Loading Component
 * 
 * Provides visual feedback during data loading for better perceived performance.
 */

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-800', className)}
      {...props}
    />
  );
}

// Pre-built skeleton components for common patterns

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-6 w-12" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SubjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function AvatarSkeleton() {
  return <Skeleton className="h-10 w-10 rounded-full" />;
}

export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-9 w-20 rounded-md', className)} />;
}
