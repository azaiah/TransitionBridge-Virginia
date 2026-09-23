import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'We could not load this',
  description = 'Try again — if it keeps happening, nothing you did caused it.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-risk/30 bg-risk-bg px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="mb-4 h-10 w-10 text-risk" aria-hidden="true" />
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-body text-ink-2">{description}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
