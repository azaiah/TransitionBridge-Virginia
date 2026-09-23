'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { TourBeat } from '@/lib/tour';

/**
 * The presenter's card during the guided tour. Deliberately unobtrusive: bottom-left,
 * out of the way of the data, and never covering the number the room is looking at.
 */
export function TourPanel({
  beat,
  index,
  total,
  onPrevious,
  onNext,
  onExit,
}: {
  beat: TourBeat;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  return (
    <section
      aria-label="Guided tour"
      className="fixed bottom-4 left-4 z-[70] w-[min(420px,calc(100vw-2rem))] rounded-card border border-line bg-surface p-4 shadow-pop print:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="meta-label">
            Beat {beat.number} of {total} · about {beat.seconds} seconds
          </p>
          <h2 className="mt-1 text-h3 text-ink">{beat.title}</h2>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-control p-1 text-ink-3 hover:bg-surface-sunken hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">End the guided tour</span>
        </button>
      </div>

      {/* Announced on every step change so a screen reader follows the tour too. */}
      <div aria-live="polite">
        <p className="mt-3 text-body text-ink">{beat.say}</p>
        <p className="mt-2 text-caption text-ink-2">
          <span className="font-semibold">On screen:</span> {beat.show}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-control border border-line px-3 py-1.5 text-caption text-ink-2 hover:bg-surface-sunken disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous beat
        </button>
        <p className="text-caption text-ink-3">Arrow keys move · Esc ends</p>
        <button
          type="button"
          onClick={onNext}
          disabled={index === total - 1}
          className="inline-flex items-center gap-1 rounded-control bg-orange-deep px-3 py-1.5 text-caption font-semibold text-white hover:bg-orange disabled:opacity-40"
        >
          Next beat
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
