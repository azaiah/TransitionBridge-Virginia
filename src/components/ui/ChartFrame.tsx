'use client';

import { useState, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';
import { GuardedDownload } from '@/components/privacy/GuardedDownload';
import { Button } from './Button';
import { ExplainThis } from './ExplainThis';
import { cn } from '@/lib/utils';

export interface ChartFrameProps {
  /** Title states the FINDING, not the variable name. */
  title: string;
  children: ReactNode;
  explain?: {
    definition: string;
    formula?: string;
    citation?: string;
    citationHref?: string;
    whyItMatters: string;
  };
  tableHeaders: string[];
  tableRows: (string | number)[][];
  csvFilename?: string;
  className?: string;
}

/** Every chart lives here — accessible table toggle and CSV download included. */
export function ChartFrame({
  title,
  children,
  explain,
  tableHeaders,
  tableRows,
  csvFilename = 'chart-data.csv',
  className,
}: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);
  // A chart with nothing in it says so, rather than drawing empty axes.
  const isEmpty = tableRows.length === 0;

  function buildCsv() {
    return [
      tableHeaders.join(','),
      ...tableRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
  }

  return (
    <section
      className={cn('rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm', className)}
      aria-label={title}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <h3 className="text-h3 text-ink">{title}</h3>
          {explain && (
            <ExplainThis title={title} {...explain} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="!py-1.5 !px-3 text-caption"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            disabled={isEmpty}
          >
            <Table2 className="h-4 w-4" aria-hidden="true" />
            {showTable ? 'View as chart' : 'View as table'}
          </Button>
          {!isEmpty && (
            <GuardedDownload
              kind="aggregate"
              filename={csvFilename}
              rowCount={tableRows.length}
              buildCsv={buildCsv}
            />
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface-sunken px-6 py-10 text-center">
          <p className="text-body font-medium text-ink">Nothing to show here yet</p>
          <p className="mt-1 text-caption text-ink-2">
            No records match this view. Widen the filters or pick a different quarter, and this
            chart will fill in.
          </p>
        </div>
      ) : showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-body">
            <caption className="sr-only">{title} — the same figures as the chart</caption>
            <thead>
              <tr className="bg-surface-sunken">
                {tableHeaders.map((h) => (
                  <th key={h} scope="col" className="border-b border-line px-3 py-2 text-left text-label text-ink-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className="border-b border-line-hair">
                  {row.map((cell, j) => (
                    <td key={j} data-numeric={typeof cell === 'number' ? 'true' : undefined} className="px-3 py-2 tabular">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Announced as a single image with its finding, rather than letting a screen
        // reader walk through every axis tick. The table toggle above is the equivalent.
        <div
          className="min-h-[200px]"
          role="img"
          aria-label={`${title}. Chart. Choose "View as table" for the same figures as text.`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
