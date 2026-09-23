import type { ReactNode } from 'react';
import type { Provenance } from '@/data/types';
import { cn } from '@/lib/utils';

export interface StatProps {
  value: ReactNode;
  label?: string;
  unit?: string;
  /** Required — verified vs illustrative must never be omitted. */
  provenance: Provenance;
  className?: string;
  numeric?: boolean;
}

/** Renders a number with explicit provenance. Illustrative values sit inside demo framing. */
export function Stat({ value, label, unit, provenance, className, numeric = true }: StatProps) {
  const isIllustrative = provenance.kind === 'illustrative';

  return (
    <span
      className={cn('inline-flex items-baseline gap-1', className)}
      data-provenance={provenance.kind}
      title={
        provenance.kind === 'verified'
          ? `Verified — source ${provenance.sourceId}`
          : 'Demonstration data — synthetic figure'
      }
    >
      {label && <span className="sr-only">{label}: </span>}
      {/* Thousands separators, always. "3423" on a dashboard reads as a typo. */}
      <span className={cn(numeric && 'tabular')}>
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </span>
      {unit && <span className="text-caption text-ink-3">{unit}</span>}
      {provenance.kind === 'verified' && (
        <sup className="text-meta text-info cursor-help" aria-label={`Source ${provenance.sourceId}`}>
          †
        </sup>
      )}
      {isIllustrative && <span className="sr-only"> (demonstration data)</span>}
    </span>
  );
}
