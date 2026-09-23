/**
 * Fixed demonstration calendar. Everything is measured against REFERENCE_DATE, never
 * against the wall clock — a demo whose numbers drift between builds is not deterministic
 * and would break the identical-bundle-hash guarantee (docs/05_DEMO_DATA.md §5.9).
 */

import { DEMO_REFERENCE_DATE } from '../../src/lib/demo-clock';

/**
 * "Now" for the entire demonstration dataset: the close of the current quarter.
 * Defined once in src/lib/demo-clock.ts so the generator and the app cannot disagree.
 */
export const REFERENCE_DATE = new Date(DEMO_REFERENCE_DATE);

/** Eight quarters, oldest first. docs/05_DEMO_DATA.md §2. */
export const PERIODS = [
  '2024-Q3',
  '2024-Q4',
  '2025-Q1',
  '2025-Q2',
  '2025-Q3',
  '2025-Q4',
  '2026-Q1',
  '2026-Q2',
] as const;

export type Period = (typeof PERIODS)[number];

export const CURRENT_PERIOD: Period = '2026-Q2';

const MS_PER_DAY = 86_400_000;

/** Calendar quarter boundaries. Q1 = Jan–Mar. */
export function periodRange(period: string): { start: Date; end: Date } {
  const [yearText, quarterText] = period.split('-Q');
  const year = Number(yearText);
  const quarter = Number(quarterText);
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, startMonth + 3, 1, 0, 0, 0) - 1);
  return { start, end };
}

/** Which period an instant belongs to. Returns null for dates outside the demo window. */
export function periodOf(iso: string): string | null {
  const d = new Date(iso);
  const year = d.getUTCFullYear();
  const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
  const key = `${year}-Q${quarter}`;
  return (PERIODS as readonly string[]).includes(key) ? key : null;
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY;
}

/** Days from an instant to the fixed reference "now". */
export function daysSince(iso: string): number {
  return (REFERENCE_DATE.getTime() - new Date(iso).getTime()) / MS_PER_DAY;
}

export function isoOf(date: Date): string {
  return date.toISOString();
}

/**
 * The federal fiscal year runs October 1 – September 30. The 15% Pre-ETS reserve is
 * measured against it, so reserve spend has to be filtered on this window and not on
 * the state fiscal year (docs/02_RESEARCH_AND_SOURCES.md A3).
 */
export const FEDERAL_FY_START = new Date('2025-10-01T00:00:00.000Z');
export const FEDERAL_FY_END = new Date('2026-09-30T23:59:59.999Z');

export function inCurrentFederalFy(iso: string): boolean {
  const t = new Date(iso).getTime();
  return t >= FEDERAL_FY_START.getTime() && t <= FEDERAL_FY_END.getTime();
}

/** Share of the current federal fiscal year elapsed at the reference date, 0–1. */
export function federalFyElapsedShare(): number {
  const total = FEDERAL_FY_END.getTime() - FEDERAL_FY_START.getTime();
  const done = REFERENCE_DATE.getTime() - FEDERAL_FY_START.getTime();
  return Math.min(1, Math.max(0, done / total));
}
