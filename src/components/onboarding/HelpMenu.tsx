'use client';

import { useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { useCoach } from './CoachMarks';

/**
 * The "?" in the top bar. Replays this screen's coach marks (on a home screen, the
 * three-step tour plus "What's new") and lists the two shortcuts, because a
 * dismissed-forever tour still has to be findable again.
 */
export function HelpMenu() {
  const coach = useCoach();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const available = coach?.available ?? false;

  return (
    <details className="relative" ref={detailsRef}>
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-line text-ink-2 hover:bg-surface-sunken">
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Help and a quick tour of this screen</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-[260px] rounded-card border border-line bg-surface p-3 shadow-pop">
        {available ? (
          <button
            type="button"
            onClick={() => {
              if (detailsRef.current) detailsRef.current.open = false;
              coach?.replay();
            }}
            className="w-full rounded-control bg-orange-deep px-3 py-2 text-label font-semibold text-white hover:bg-orange"
          >
            Show me around this screen
          </button>
        ) : (
          <p className="text-caption text-ink-2">
            This screen has no guided tour. Each portal’s home screen has one, including what is new.
          </p>
        )}
        <dl className="mt-3 space-y-1 text-caption text-ink-2">
          <div className="flex items-center justify-between gap-2">
            <dt>Jump to search</dt>
            <dd className="font-mono text-ink-3">/</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>Presenter mode</dt>
            <dd className="font-mono text-ink-3">Shift + P</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
