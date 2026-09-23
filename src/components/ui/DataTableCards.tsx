'use client';

import { useState } from 'react';
import { Button } from './Button';
import type { DataTableColumn } from './DataTable';

const PAGE = 25;

/**
 * The small-screen form of a data table. A row becomes a card of label / value pairs,
 * because a table that scrolls sideways on a phone is a table nobody reads.
 * docs/06_BUILD_PROMPTS.md prompt 10 §4.
 */
export function DataTableCards<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  const [shown, setShown] = useState(PAGE);
  const visible = rows.slice(0, shown);
  const [first, ...rest] = columns;

  return (
    <div>
      <ul className="divide-y divide-line-hair">
        {visible.map((row) => (
          <li key={rowKey(row)} className="px-4 py-3">
            {/*
              Only the card's heading is the control. A button may not contain a
              definition list, and the details below read better as plain content.
            */}
            {first &&
              (onRowClick ? (
                <button
                  type="button"
                  onClick={() => onRowClick(row)}
                  className="w-full rounded-control text-left text-body font-semibold text-ink underline-offset-2 hover:underline"
                >
                  {first.render(row)}
                </button>
              ) : (
                <p className="text-body font-semibold text-ink">{first.render(row)}</p>
              ))}
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {rest.map((col) => (
                <div key={col.key} className="min-w-0">
                  <dt className="text-caption text-ink-3">{col.header}</dt>
                  <dd className="truncate text-body text-ink">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {shown < rows.length && (
        <div className="border-t border-line p-3">
          <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
            Show {Math.min(PAGE, rows.length - shown)} more
          </Button>
        </div>
      )}
    </div>
  );
}
