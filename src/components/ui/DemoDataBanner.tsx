'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tb-demo-banner-dismissed';

/**
 * Persistent demonstration-data marker. Dismissible but returns on next session.
 * CLAUDE.md §3.4 — this is a selling point, not an apology.
 */
export function DemoDataBanner({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setVisible(false);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        'border-b border-warn/30 bg-warn-bg px-4 py-2.5 text-caption text-ink',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="content-product flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <p className="min-w-0">
          <strong className="font-semibold">DEMONSTRATION DATA</strong>
          {' — '}
          Figures on this screen are synthetic and generated for demonstration. No real student,
          referral, or case data is present. Statutory and programmatic references are sourced.{' '}
          <Link href="/sources/" className="font-medium text-orange-deep underline underline-offset-2">
            View sources
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-ink-3 hover:bg-surface hover:text-ink"
          aria-label="Dismiss demonstration data notice for this session"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Inline chip for record-level views. */
export function DemoDataChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border border-warn/30 bg-warn-bg px-2 py-0.5 text-meta font-medium uppercase tracking-wide text-warn',
        className,
      )}
    >
      Demo data
    </span>
  );
}
