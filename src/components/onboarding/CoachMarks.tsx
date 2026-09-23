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
import { COACH_STEPS, storageKeyFor } from '@/lib/coach';
import { useRoleOptional } from '@/context/RoleContext';
import type { Role } from '@/data/types';

/** Role home pages — the only screens that open coach marks on their own. */
const HOME_PATHS: Record<Role, string> = {
  state_leadership: '/state',
  dars_counselor: '/dars',
  school_coordinator: '/school',
  vendor: '/vendor',
};

const CoachContext = createContext<{ replay: () => void } | null>(null);

/** Lets the "?" button in the top bar run the coach marks again. */
export function useCoach() {
  return useContext(CoachContext);
}

export function CoachProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const roleCtx = useRoleOptional();
  const role = roleCtx?.role ?? null;
  const [step, setStep] = useState<number | null>(null);

  const steps = role ? COACH_STEPS[role] : [];

  // Opens once per role, on that role's home screen, and only if never dismissed.
  useEffect(() => {
    if (!role) return;
    const home = HOME_PATHS[role];
    const onHome = pathname === home || pathname === `${home}/`;
    if (!onHome) return;
    if (localStorage.getItem(storageKeyFor(role)) === 'done') return;

    // A short beat so the page has painted before anything is pointed at.
    const timer = window.setTimeout(() => setStep(0), 600);
    return () => window.clearTimeout(timer);
  }, [role, pathname]);

  const dismiss = useCallback(() => {
    if (role) localStorage.setItem(storageKeyFor(role), 'done');
    setStep(null);
  }, [role]);

  const next = useCallback(() => {
    setStep((current) => {
      if (current === null) return null;
      if (current + 1 >= steps.length) {
        if (role) localStorage.setItem(storageKeyFor(role), 'done');
        return null;
      }
      return current + 1;
    });
  }, [steps.length, role]);

  const value = useMemo(() => ({ replay: () => setStep(0) }), []);
  const active = step !== null ? steps[step] : undefined;

  return (
    <CoachContext.Provider value={value}>
      {children}
      {active && step !== null && (
        <CoachOverlay
          step={active}
          index={step}
          total={steps.length}
          onNext={next}
          onSkip={dismiss}
        />
      )}
    </CoachContext.Provider>
  );
}
