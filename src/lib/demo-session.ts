'use client';

/**
 * The demonstration "session".
 *
 * This is NOT authentication. There are no passwords, no tokens, and no server.
 * Choosing an account on /sign-in/ writes one word (the role) into this browser's
 * localStorage. The portal pages check for that word; if it is missing, they send the
 * visitor to the sign-in screen first. That is all it does.
 *
 * Why localStorage (not sessionStorage)?
 * A presenter often opens a portal link in a new tab. localStorage is shared across
 * tabs, so they stay "signed in" — just like a real product would feel.
 */
import { useSyncExternalStore } from 'react';
import type { Role } from '@/data/types';
import { ROLES } from '@/data/types';

/** The one key we store. Removing it is "signing out". */
const SESSION_KEY = 'tb-demo-session';

/** The role key RoleContext already uses. Cleared on sign-out so the header resets. */
const ROLE_KEY = 'tb-demo-role';

/** Fired in this tab when the session changes. ('storage' only fires in OTHER tabs.) */
const CHANGE_EVENT = 'tb-demo-session-change';

/**
 * What a component sees:
 * - a Role: someone is signed in
 * - 'none': nobody is signed in
 * - 'unknown': we are on the server / first paint and cannot read storage yet
 */
export type SessionState = Role | 'none' | 'unknown';

function isRole(value: string | null): value is Role {
  return value !== null && (ROLES as readonly string[]).includes(value);
}

/** Reads the signed-in role, or null. Safe to call only in the browser. */
export function readSessionRole(): Role | null {
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    return isRole(stored) ? stored : null;
  } catch {
    // Some locked-down browsers block storage. Treat that as "signed out".
    return null;
  }
}

/** Marks this browser as signed in with the given role. */
export function startSession(role: Role) {
  try {
    window.localStorage.setItem(SESSION_KEY, role);
  } catch {
    // Storage blocked: the portal still opens, the visitor just gets asked again later.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Signs out: forgets the role everywhere. The caller must navigate away (to the home page).
 *
 * We deliberately do NOT fire CHANGE_EVENT in this tab. If we did, the portal's
 * SessionGate would see "signed out" and race the caller to /sign-in/ before the
 * trip home finished. Other open tabs still hear about it through the 'storage' event.
 */
export function endSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(ROLE_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * React hook for the current session.
 * The server snapshot is 'unknown', so the static HTML never guesses — the real
 * answer arrives right after the page hydrates, with no hydration mismatch.
 */
export function useDemoSession(): SessionState {
  return useSyncExternalStore(
    subscribe,
    () => readSessionRole() ?? 'none',
    () => 'unknown' as const,
  );
}

/**
 * Only allow "come back to where you were" links inside this site.
 * Anything else (another domain, a protocol trick) falls back to the role's home.
 */
export function safeReturnPath(next: string | null, allowedPrefix: string): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next.startsWith(allowedPrefix) ? next : null;
}
