import Link from 'next/link';
import { SeverityPill } from './StatusPill';
import { cn } from '@/lib/utils';

export interface AlertRowProps {
  message: string;
  ageLabel: string;
  ownerLabel: string;
  severity: 'INFO' | 'WARN' | 'RISK';
  linkTo: string;
  linkLabel?: string;
  className?: string;
}

const severityTone = { INFO: 'info', WARN: 'warn', RISK: 'risk' } as const;

/** Complete plain-language sentence + age + owner + working link. */
export function AlertRow({
  message,
  ageLabel,
  ownerLabel,
  severity,
  linkTo,
  linkLabel = 'View records',
  className,
}: AlertRowProps) {
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-table border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between',
        severity === 'RISK' && 'border-l-[3px] border-l-risk',
        severity === 'WARN' && 'border-l-[3px] border-l-warn',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-body text-ink">{message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SeverityPill label={ageLabel} tone={severityTone[severity]} />
          <span className="text-caption text-ink-3">Owner: {ownerLabel}</span>
        </div>
      </div>
      <Link
        href={linkTo}
        className="shrink-0 text-label font-medium text-orange-deep underline underline-offset-2 hover:text-orange"
      >
        {linkLabel}
      </Link>
    </article>
  );
}
