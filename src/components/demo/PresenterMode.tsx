'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Presentation } from 'lucide-react';
import { TourPanel } from './TourPanel';
import { TOUR_BEATS } from '@/lib/tour';

const STORAGE_KEY = 'tb-presenter';

/** True when the keystroke happened while the user was typing somewhere. */
function isTyping(event: KeyboardEvent): boolean {
  const el = event.target as HTMLElement | null;
  const tag = el?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!el?.isContentEditable;
}

/**
 * Presenter mode. Shift+P enlarges type one step for projection and offers the guided tour
 * of the eight demo beats. docs/01_PRODUCT_SPEC.md §8.5.
 *
 * Kept out of the way: nothing shows until a presenter asks for it, and it never appears
 * in print or in a screenshot of a normal session.
 */
export function PresenterMode() {
  const router = useRouter();
  const [presenting, setPresenting] = useState(false);
  const [beatIndex, setBeatIndex] = useState<number | null>(null);

  // Survives navigation within a session, but never leaks into the next one.
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'on') setPresenting(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.presentation = presenting ? 'on' : 'off';
    sessionStorage.setItem(STORAGE_KEY, presenting ? 'on' : 'off');
    if (!presenting) setBeatIndex(null);
  }, [presenting]);

  const goToBeat = useCallback(
    (index: number) => {
      const beat = TOUR_BEATS[index];
      if (!beat) return;
      setBeatIndex(index);
      router.push(beat.href);
    },
    [router],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event)) return;

      // Shift+P toggles. Plain "p" is left alone so it can still be typed anywhere.
      // Some keyboards report the shifted key as "P" without setting shiftKey, so accept both.
      const shiftP = event.key === 'P' || (event.shiftKey && event.key === 'p');
      if (shiftP && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setPresenting((on) => !on);
        return;
      }

      if (beatIndex === null) return;
      if (event.key === 'Escape') {
        setBeatIndex(null);
      } else if (event.key === 'ArrowRight' && beatIndex < TOUR_BEATS.length - 1) {
        goToBeat(beatIndex + 1);
      } else if (event.key === 'ArrowLeft' && beatIndex > 0) {
        goToBeat(beatIndex - 1);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [beatIndex, goToBeat]);

  if (!presenting) return null;

  const beat = beatIndex === null ? null : TOUR_BEATS[beatIndex];

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[70] flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 shadow-pop print:hidden">
        <Presentation className="h-4 w-4 text-orange-deep" aria-hidden="true" />
        <span className="text-caption text-ink">Presenter mode</span>
        {beat === null ? (
          <button
            type="button"
            onClick={() => goToBeat(0)}
            className="rounded-full bg-orange-deep px-3 py-1 text-caption font-semibold text-white hover:bg-orange"
          >
            Start the tour
          </button>
        ) : (
          <span className="text-caption text-ink-3">Beat {beat.number} of {TOUR_BEATS.length}</span>
        )}
        <button
          type="button"
          onClick={() => setPresenting(false)}
          className="rounded-full border border-line px-3 py-1 text-caption text-ink-2 hover:bg-surface-sunken"
        >
          Turn off
        </button>
      </div>

      {beat && (
        <TourPanel
          beat={beat}
          index={beatIndex ?? 0}
          total={TOUR_BEATS.length}
          onPrevious={() => goToBeat((beatIndex ?? 0) - 1)}
          onNext={() => goToBeat((beatIndex ?? 0) + 1)}
          onExit={() => setBeatIndex(null)}
        />
      )}
    </>
  );
}
