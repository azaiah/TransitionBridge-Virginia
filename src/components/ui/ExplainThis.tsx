'use client';

import { useId, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExplainThisProps {
  title: string;
  definition: string;
  formula?: string;
  citation?: string;
  /** Deep link to the citation on the sources page, when the metric has one. */
  citationHref?: string;
  whyItMatters: string;
  className?: string;
}

/**
 * The "?" panel — plain definition, formula in words, citation, and why it matters.
 * docs/11_USABILITY.md § explain-this affordance.
 */
export function ExplainThis({
  title,
  definition,
  formula,
  citation,
  citationHref,
  whyItMatters,
  className,
}: ExplainThisProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:bg-surface-sunken hover:text-ink focus-visible:outline-offset-1"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Explain: ${title}`}
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={`About ${title}`}
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-card border border-line bg-surface p-4 shadow-pop animate-fade-up"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-label font-semibold text-ink">{title}</p>
            <button
              type="button"
              className="rounded p-0.5 text-ink-3 hover:text-ink"
              aria-label="Close explanation"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-caption text-ink-2">{definition}</p>
          {formula && (
            <p className="mt-2 text-caption text-ink-3">
              <span className="font-medium text-ink-2">How it is calculated: </span>
              {formula}
            </p>
          )}
          {citation && (
            <p className="mt-2 text-caption text-info">
              <span className="font-medium">Source: </span>
              {/* The link goes to our own sources page, which lists the full citation. */}
              {citationHref ? (
                <a href={citationHref} className="underline underline-offset-2 hover:no-underline">
                  {citation}
                </a>
              ) : (
                citation
              )}
            </p>
          )}
          <p className="mt-2 text-caption text-ink-2">
            <span className="font-medium">Why it matters: </span>
            {whyItMatters}
          </p>
        </div>
      )}
    </span>
  );
}
