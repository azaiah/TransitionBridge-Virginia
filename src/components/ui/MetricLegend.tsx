'use client';

import { ExplainThis } from './ExplainThis';
import { explain } from '@/lib/definitions';
import { cn } from '@/lib/utils';

/**
 * A row of "explain this" chips for the columns of a dense table.
 *
 * Tables cannot carry a "?" in every header without becoming unreadable, so the definitions
 * sit underneath, named, in the order the columns appear.
 */
export function MetricLegend({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      <span className="text-caption text-ink-3">What these columns mean:</span>
      {keys.map((key) => {
        const props = explain(key);
        return (
          <span key={key} className="inline-flex items-center gap-0.5 text-caption text-ink-2">
            {props.title}
            <ExplainThis {...props} />
          </span>
        );
      })}
    </div>
  );
}
