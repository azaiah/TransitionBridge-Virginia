import { cn } from '@/lib/utils';

/**
 * Loading placeholder. The shimmer is a CSS animation, so it stops entirely under
 * prefers-reduced-motion along with everything else.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-card bg-surface-sunken', className)}
    />
  );
}
