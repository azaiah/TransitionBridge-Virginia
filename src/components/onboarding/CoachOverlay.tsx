'use client';

import { useEffect, useRef, useState } from 'react';
import type { CoachStep } from '@/lib/coach';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Where the target element sits right now, or null if it is not on this screen. */
function useTargetRect(target: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    function measure() {
      const el = document.querySelector<HTMLElement>(`[data-coach="${target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [target]);

  return rect;
}

/**
 * One coach mark: a ring around the thing being explained and a card next to it.
 * Escape closes it, and so does the "Skip" button — nobody is ever trapped here.
 */
export function CoachOverlay({
  step,
  index,
  total,
  onNext,
  onSkip,
}: {
  step: CoachStep;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const rect = useTargetRect(step.target);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Focus moves to the card so a keyboard user is taken along, not left behind.
  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onSkip();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onSkip]);

  // Card sits under the target when there is room, otherwise above it, otherwise centred.
  const cardStyle: React.CSSProperties = rect
    ? {
        top: Math.min(rect.top + rect.height + 12, window.innerHeight - 220),
        left: Math.min(Math.max(rect.left, 16), Math.max(16, window.innerWidth - 380)),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed inset-0 z-[80] print:hidden">
      <div className="absolute inset-0 bg-navy/30" onClick={onSkip} aria-hidden="true" />

      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-card border-2 border-orange bg-surface/5"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(16, 33, 60, 0.28)',
          }}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-title"
        className="absolute w-[min(360px,calc(100vw-2rem))] rounded-card border border-line bg-surface p-4 shadow-pop"
        style={cardStyle}
      >
        <p className="meta-label">
          Step {index + 1} of {total}
        </p>
        <h2 id="coach-title" className="mt-1 text-h3 text-ink">
          {step.title}
        </h2>
        <p className="mt-2 text-body text-ink-2">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-control px-2 py-1 text-caption text-ink-2 underline hover:text-ink"
          >
            Skip these
          </button>
          <button
            ref={nextRef}
            type="button"
            onClick={onNext}
            className="rounded-control bg-orange-deep px-4 py-2 text-label font-semibold text-white hover:bg-orange"
          >
            {index === total - 1 ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
