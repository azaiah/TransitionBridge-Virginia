'use client';

/**
 * What people DO during a demonstration: names shown, documents opened or added, lists
 * downloaded, authorizations extended. Kept in this browser only (localStorage), so a
 * presenter can take an action and then open the audit log to show it recorded — with no
 * server and nothing leaving the laptop (CLAUDE.md §1.7).
 *
 * Every accessor is wrapped: in a locked-down browser storage can throw, and the demo must
 * still work, just without remembering.
 */
import { useSyncExternalStore } from 'react';
import type { SecureDocument } from './transition-record';

export type { AuditAction, AuditEvent } from '@/data/types';
import type { AuditEvent } from '@/data/types';

export { AUDIT_ACTION_LABELS, REFUSAL_ACTIONS } from './audit';

const KEYS = {
  audit: 'tb-audit-log',
  docs: 'tb-added-documents',
  extensions: 'tb-auth-extensions',
  minutes: 'tb-auth-logged-minutes',
} as const;

const CHANGE_EVENT = 'tb-session-store-change';
const MAX_EVENTS = 500;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: the action still happened on screen, it just is not kept.
  }
  cacheVersion++;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// useSyncExternalStore needs a stable snapshot between changes, so reads are cached per
// version and re-read only after a write (or a change in another tab).
let cacheVersion = 0;
const snapshots = new Map<string, { version: number; value: unknown }>();

function snapshot<T>(key: string, fallback: T): T {
  const hit = snapshots.get(key);
  if (hit && hit.version === cacheVersion) return hit.value as T;
  const value = read(key, fallback);
  snapshots.set(key, { version: cacheVersion, value });
  return value;
}

function subscribe(onChange: () => void) {
  const onStorage = () => {
    cacheVersion++;
    onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const EMPTY_EVENTS: AuditEvent[] = [];
const EMPTY_DOCS: Record<string, SecureDocument[]> = {};
const EMPTY_NUMBERS: Record<string, number> = {};

/* ---------------- Audit log ---------------- */

export function recordAudit(event: Omit<AuditEvent, 'id' | 'at'>) {
  if (typeof window === 'undefined') return;
  const events = read<AuditEvent[]>(KEYS.audit, []);
  const next: AuditEvent = {
    ...event,
    // Unique within this browser: the time plus the number of entries already kept.
    id: `LIVE-${Date.now().toString(36)}-${events.length.toString(36)}`,
    at: new Date().toISOString(),
  };
  write(KEYS.audit, [next, ...events].slice(0, MAX_EVENTS));
}

export function useAuditLog(): AuditEvent[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot<AuditEvent[]>(KEYS.audit, EMPTY_EVENTS),
    () => EMPTY_EVENTS,
  );
}

/* ---------------- Documents added this session ---------------- */

export function addSessionDocument(doc: SecureDocument) {
  const all = read<Record<string, SecureDocument[]>>(KEYS.docs, {});
  all[doc.studentId] = [doc, ...(all[doc.studentId] ?? [])];
  write(KEYS.docs, all);
}

export function useSessionDocuments(studentId: string): SecureDocument[] {
  const all = useSyncExternalStore(
    subscribe,
    () => snapshot<Record<string, SecureDocument[]>>(KEYS.docs, EMPTY_DOCS),
    () => EMPTY_DOCS,
  );
  return all[studentId] ?? [];
}

/* ---------------- Authorization changes this session ---------------- */

/** Extra hours granted in this session, by authorization id. */
export function extendAuthorization(authId: string, extraHours: number) {
  const all = read<Record<string, number>>(KEYS.extensions, {});
  all[authId] = (all[authId] ?? 0) + extraHours;
  write(KEYS.extensions, all);
}

/** Minutes logged in this session, by authorization id. */
export function addLoggedMinutes(authId: string, minutes: number) {
  const all = read<Record<string, number>>(KEYS.minutes, {});
  all[authId] = (all[authId] ?? 0) + minutes;
  write(KEYS.minutes, all);
}

export function useAuthorizationAdjustments(): {
  extraHours: Record<string, number>;
  extraMinutes: Record<string, number>;
} {
  const extraHours = useSyncExternalStore(
    subscribe,
    () => snapshot<Record<string, number>>(KEYS.extensions, EMPTY_NUMBERS),
    () => EMPTY_NUMBERS,
  );
  const extraMinutes = useSyncExternalStore(
    subscribe,
    () => snapshot<Record<string, number>>(KEYS.minutes, EMPTY_NUMBERS),
    () => EMPTY_NUMBERS,
  );
  return { extraHours, extraMinutes };
}

/** Applies this session's extensions and logged minutes to an authorization. */
export function adjustAuthorization<T extends { id: string; hoursAuthorized: number; minutesUsed: number }>(
  auth: T,
  adjustments: { extraHours: Record<string, number>; extraMinutes: Record<string, number> },
): T {
  const extraHours = adjustments.extraHours[auth.id] ?? 0;
  const extraMinutes = adjustments.extraMinutes[auth.id] ?? 0;
  if (extraHours === 0 && extraMinutes === 0) return auth;
  return {
    ...auth,
    hoursAuthorized: auth.hoursAuthorized + extraHours,
    minutesUsed: auth.minutesUsed + extraMinutes,
  };
}

/* ---------------- Reset ---------------- */

/** Clears everything this demonstration session recorded. */
export function resetSessionActivity() {
  try {
    for (const key of Object.values(KEYS)) window.localStorage.removeItem(key);
  } catch {
    // Nothing stored, nothing to clear.
  }
  cacheVersion++;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** "Just now", "4 minutes ago", "2 hours ago" — for real session times, not the demo clock. */
export function formatSessionTime(iso: string, nowMs = Date.now()): string {
  const minutes = Math.round((nowMs - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
