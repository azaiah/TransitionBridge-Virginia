/**
 * Human dates. "March 4" and "12 days ago", never a raw timestamp.
 * docs/11_USABILITY.md — "Dates are human."
 *
 * Everything is measured against the demonstration's fixed "now" and rendered in UTC, so
 * the same build shows the same words on every laptop in the room.
 */
import { DEMO_NOW_MS, MS_PER_DAY } from './demo-clock';

const LONG = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** "March 4, 2026" — used where the year matters, and on hover everywhere else. */
export function formatFullDate(iso: string): string {
  return LONG.format(new Date(iso));
}

/** "March 4" — the everyday form. */
export function formatDate(iso: string): string {
  return SHORT.format(new Date(iso));
}

/** "Today", "Yesterday", "12 days ago", "in 3 days". */
export function formatRelative(iso: string, nowMs: number = DEMO_NOW_MS): string {
  const days = Math.round((nowMs - Date.parse(iso)) / MS_PER_DAY);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1) return `${days.toLocaleString()} days ago`;
  if (days === -1) return 'Tomorrow';
  return `in ${Math.abs(days).toLocaleString()} days`;
}

/** "March 4 · 12 days ago" — the date and how long ago, which is what people ask next. */
export function formatDateWithRelative(iso: string, nowMs: number = DEMO_NOW_MS): string {
  return `${formatDate(iso)} · ${formatRelative(iso, nowMs)}`;
}

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  // Virginia time, fixed, so every laptop shows the same clock for the same entry.
  timeZone: 'America/New_York',
});

/** "June 30, 12:44 PM" — for log entries, where the time of day matters. Virginia time. */
export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
