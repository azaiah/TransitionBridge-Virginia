import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ReactNode;
  className?: string;
}

/** Designed empty state — says what to do next (docs/11_USABILITY.md test 4). */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-sunken px-6 py-12 text-center',
        className,
      )}
    >
      {icon && <div className="mb-4 text-ink-3">{icon}</div>}
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-body text-ink-2">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-6">
          <Button variant="primary" href={actionHref} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
