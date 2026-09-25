'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { CoachOverlay } from './CoachOverlay';
import {
  COACH_STEPS,
  WHATS_NEW_STEPS,
  screenTourFor,
  storageKeyFor,
  whatsNewKey,
  type CoachStep,
  type CoachTour,
} from '@/lib/coach';
import { useViewer } from '@/context/useViewer';
import { PORTAL_HOME } from '@/lib/portal';
import type { Role } from '@/data/types';

const CoachContext = createContext<{ replay: () => void; available: boolean } | null>(null);

/** Lets the "?" button in the top bar run the coach marks again. */
export function useCoach() {
  return useContext(CoachContext);
}

function isDone(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'done';
  } catch {
    return false;
  }
}

function markDone(key: string) {
  try {
    window.localStorage.setItem(key, 'done');
  } catch {
    // Storage blocked: the tour simply shows again next time.
  }
}

function onPath(pathname: string, home: string): boolean {
  const clean = pathname.replace(/\/+$/, '');
  return clean === home.replace(/\/+$/, '');
}

/**
 * Every tour that belongs to this screen, in the order it should be seen:
 * on a home screen, the three-step role tour and then "What's new"; elsewhere, the
 * screen's own tour, if it has one.
 */
function toursFor(role: Role | null, pathname: string): CoachTour[] {
  if (role && onPath(pathname, PORTAL_HOME[role])) {
    return [
      { key: storageKeyFor(role), steps: COACH_STEPS[role] },
      { key: whatsNewKey(role), steps: WHATS_NEW_STEPS[role] },
    ].filter((t) => t.steps.length > 0);
  }
  const screen = screenTourFor(pathname);
  return screen ? [screen] : [];
}

interface Running {
  steps: CoachStep[];
  /** Tour keys covered by this run, marked done when it ends. */
  keys: string[];
  /** Where each tour starts, so finishing one marks it seen even if the next is skipped. */
  boundaries: { key: string; end: number }[];
  index: number;
}

function runOf(tours: CoachTour[]): Running | null {
  if (tours.length === 0) return null;
  const steps: CoachStep[] = [];
  const boundaries: { key: string; end: number }[] = [];
  for (const tour of tours) {
    steps.push(...tour.steps);
    boundaries.push({ key: tour.key, end: steps.length });
  }
  return { steps, keys: tours.map((t) => t.key), boundaries, index: 0 };
}

export function CoachProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role } = useViewer();
  const [run, setRun] = useState<Running | null>(null);

  const tours = useMemo(() => toursFor(role, pathname), [role, pathname]);

  // A new screen closes whatever was open, then opens that screen's unseen tours once.
  useEffect(() => {
    setRun(null);
    const unseen = tours.filter((t) => !isDone(t.key));
    if (unseen.length === 0) return;
    // A short beat so the page has painted before anything is pointed at.
    const timer = window.setTimeout(() => setRun(runOf(unseen)), 700);
    return () => window.clearTimeout(timer);
  }, [tours]);

  const dismiss = useCallback(() => {
    setRun((current) => {
      current?.keys.forEach(markDone);
      return null;
    });
  }, []);

  const next = useCallback(() => {
    setRun((current) => {
      if (!current) return null;
      const nextIndex = current.index + 1;
      // Finishing the last step of a tour marks that tour as seen.
      const finished = current.boundaries.find((b) => b.end === nextIndex);
      if (finished) markDone(finished.key);
      if (nextIndex >= current.steps.length) return null;
      return { ...current, index: nextIndex };
    });
  }, []);

  const value = useMemo(
    () => ({ replay: () => setRun(runOf(tours)), available: tours.length > 0 }),
    [tours],
  );
  const active = run ? run.steps[run.index] : undefined;

  return (
    <CoachContext.Provider value={value}>
      {children}
      {run && active && (
        <CoachOverlay
          step={active}
          index={run.index}
          total={run.steps.length}
          onNext={next}
          onSkip={dismiss}
        />
      )}
    </CoachContext.Provider>
  );
}
