'use client';

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, Download, X } from 'lucide-react';
import { Button } from './Button';
import { DataTableCards } from './DataTableCards';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Plain-English column name shown to users. */
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  numeric?: boolean;
  defaultVisible?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Row-level treatment, e.g. the aging highlight on referrals waiting over 14 days. */
  rowClassName?: (row: T) => string | undefined;
  csvFilename?: string;
  /** Names the table for screen readers. Say what the rows are, e.g. "Referral queue". */
  caption?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptyActionHref?: string;
  className?: string;
}

const ROW_HEIGHT = 40;
const VIRTUAL_THRESHOLD = 100;
const OVERSCAN = 8;

function toCsv<T>(columns: DataTableColumn<T>[], rows: T[]): string {
  const headers = columns.map((c) => c.header);
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const v = c.sortValue ? c.sortValue(row) : '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
      .join(','),
  );
  return [headers.join(','), ...lines].join('\n');
}

/** Sticky sortable table with virtualization above 100 rows. Row click opens drawer, not navigation. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  csvFilename = 'export.csv',
  caption = 'Records',
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'When records appear, they will show up in this table.',
  emptyActionLabel,
  onEmptyAction,
  emptyActionHref,
  className,
}: DataTableProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Global search sends people here with ?find=<name>. Every table honours it, so one
  // convention covers landing on a division, a provider, or a school from anywhere.
  const find = searchParams.get('find')?.trim() ?? '';

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hidden, setHidden] = useState<Set<string>>(() => {
    const h = new Set<string>();
    for (const c of columns) {
      if (c.defaultVisible === false) h.add(c.key);
    }
    return h;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCols = useMemo(() => columns.filter((c) => !hidden.has(c.key)), [columns, hidden]);

  // Match the search term against every column's own sort value, so "Portsmouth" finds the
  // Portsmouth row whether that word sits in the name column or the district column.
  const filtered = useMemo(() => {
    if (find.length === 0) return rows;
    const needle = find.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        if (!col.sortValue) return false;
        return String(col.sortValue(row)).toLowerCase().includes(needle);
      }),
    );
  }, [rows, columns, find]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const virtualize = sorted.length > VIRTUAL_THRESHOLD;
  const totalHeight = sorted.length * ROW_HEIGHT;
  const startIdx = virtualize
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    : 0;
  const endIdx = virtualize
    ? Math.min(sorted.length, Math.ceil((scrollTop + 480) / ROW_HEIGHT) + OVERSCAN)
    : sorted.length;
  const windowRows = sorted.slice(startIdx, endIdx);
  const offsetY = startIdx * ROW_HEIGHT;

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey],
  );

  function downloadCsv() {
    const blob = new Blob([toCsv(visibleCols, sorted)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Drop the search term but keep everything else about where the user is. */
  function clearFind() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('find');
    const query = params.toString();
    router.replace(query ? `?${query}` : '?');
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        actionHref={emptyActionHref}
      />
    );
  }

  // Rows exist, but the search term matched none of them. Say so and offer the way out.
  if (sorted.length === 0) {
    return (
      <EmptyState
        title={`Nothing matches “${find}”`}
        description={`None of the ${rows.length.toLocaleString()} records here match that search. Clear it to see all of them again.`}
        actionLabel="Clear search"
        onAction={clearFind}
      />
    );
  }

  return (
    <div className={cn('rounded-table border border-line bg-surface', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Announced on change, so filtering from the keyboard says how many are left. */}
          <p className="text-caption text-ink-3" aria-live="polite">
            {/* Built as one string so a screen reader reads "records", not "record s". */}
            {`Showing ${sorted.length.toLocaleString()}${
              find ? ` of ${rows.length.toLocaleString()}` : ''
            } ${sorted.length === 1 ? 'record' : 'records'}`}
          </p>
          {find && (
            <button
              type="button"
              onClick={clearFind}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-orange-subtle px-2.5 py-1 text-caption text-ink hover:bg-surface-sunken"
            >
              Matching “{find}”
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Clear this search</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <details className="relative text-caption">
            <summary className="cursor-pointer list-none rounded-control border border-line px-3 py-1.5 text-ink-2 hover:bg-surface-sunken">
              Columns
            </summary>
            <div className="absolute right-0 z-10 mt-1 min-w-[180px] rounded-control border border-line bg-surface p-2 shadow-md">
              {columns.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 px-2 py-1 text-caption">
                  <input
                    type="checkbox"
                    checked={!hidden.has(c.key)}
                    onChange={() => {
                      setHidden((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.key)) next.delete(c.key);
                        else next.add(c.key);
                        return next;
                      });
                    }}
                  />
                  {c.header}
                </label>
              ))}
            </div>
          </details>
          <Button variant="ghost" onClick={downloadCsv} className="!py-1.5 !px-3 text-caption">
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
        </div>
      </div>

      {/* Below 1024 the same records read as stacked cards instead of a sideways scroll. */}
      <div className="lg:hidden">
        <DataTableCards
          columns={visibleCols}
          rows={sorted}
          rowKey={rowKey}
          onRowClick={onRowClick}
        />
      </div>

      <div
        ref={scrollRef}
        className="hidden max-h-[480px] overflow-auto lg:block"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <table className="w-full min-w-[640px] border-collapse text-body">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-[1] bg-surface-sunken">
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  data-numeric={col.numeric ? 'true' : undefined}
                  // Tells a screen reader which column the table is sorted by, and which way.
                  aria-sort={
                    sortKey !== col.key
                      ? undefined
                      : sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                  }
                  className="h-row border-b border-line px-4 text-left text-label font-semibold text-ink-2"
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-ink"
                    onClick={() => col.sortValue && toggleSort(col.key)}
                    disabled={!col.sortValue}
                  >
                    {col.header}
                    {col.sortValue && (
                      <span className="sr-only">
                        {sortKey === col.key
                          ? `, sorted ${sortDir === 'asc' ? 'ascending' : 'descending'}. Activate to reverse the order.`
                          : ', activate to sort by this column'}
                      </span>
                    )}
                    {sortKey === col.key &&
                      (sortDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={virtualize ? { height: totalHeight } : undefined}>
            {virtualize && (
              <tr aria-hidden="true">
                <td colSpan={visibleCols.length} style={{ height: offsetY, padding: 0, border: 0 }} />
              </tr>
            )}
            {windowRows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'h-row border-b border-line-hair hover:bg-orange-subtle/40',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row),
                )}
                onClick={() => onRowClick?.(row)}
              >
                {visibleCols.map((col, colIndex) => (
                  <td
                    key={col.key}
                    data-numeric={col.numeric ? 'true' : undefined}
                    className="px-4 py-2 text-ink"
                  >
                    {/*
                      The whole row is clickable for the mouse, but the keyboard needs a
                      real control. The first cell carries it, so the row keeps its table
                      semantics instead of pretending to be a button.
                    */}
                    {onRowClick && colIndex === 0 ? (
                      <button
                        type="button"
                        className="text-left underline-offset-2 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(row);
                        }}
                      >
                        {col.render(row)}
                      </button>
                    ) : (
                      col.render(row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
