import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/** One section of the transition record: a titled card with an optional action on the right. */
export function RecordCard({
  title,
  description,
  action,
  children,
  className,
  coach,
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Coach-mark target name, see src/lib/coach.ts. */
  coach?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      data-coach={coach}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn('rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id ? `${id}-title` : undefined} className="text-h3 text-ink">
            {title}
          </h2>
          {description && <p className="mt-1 text-caption text-ink-2">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Shown in place of a section this role does not see — says so, and says why. */
export function RestrictedNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-control bg-surface-sunken p-3 text-caption text-ink-2">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
