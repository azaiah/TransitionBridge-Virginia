/**
 * The federal fiscal year, which is what the 15% Pre-ETS reserve is measured against.
 *
 * It runs October 1 through September 30, so it does not line up with either the calendar
 * year or Virginia's state fiscal year. Filtering reserve spend on the wrong window is an
 * easy mistake to make and an expensive one to make in front of a CFO.
 */
import { DEMO_NOW_MS } from './demo-clock';

export const FEDERAL_FY_START_MS = Date.UTC(2025, 9, 1);
export const FEDERAL_FY_END_MS = Date.UTC(2026, 8, 30, 23, 59, 59, 999);

/** How the year is named on screen. Federal fiscal years are named for the ending year. */
export const FEDERAL_FY_LABEL = 'federal fiscal year 2026';

/** First instant of a quarter label like "2026-Q2". */
export function periodStartMs(period: string): number {
  const [yearText, quarterText] = period.split('-Q');
  const year = Number(yearText);
  const quarter = Number(quarterText);
  return Date.UTC(year, (quarter - 1) * 3, 1);
}

/** The quarters that fall inside the current federal fiscal year, oldest first. */
export function periodsInCurrentFederalFy(periods: readonly string[]): string[] {
  return periods.filter((period) => {
    const start = periodStartMs(period);
    return start >= FEDERAL_FY_START_MS && start <= FEDERAL_FY_END_MS;
  });
}

/** Share of the fiscal year elapsed at the fixed demonstration "now", between 0 and 1. */
export function federalFyElapsedShare(nowMs = DEMO_NOW_MS): number {
  const total = FEDERAL_FY_END_MS - FEDERAL_FY_START_MS;
  const done = nowMs - FEDERAL_FY_START_MS;
  return Math.min(1, Math.max(0, done / total));
}

/** Short money format for KPI tiles: $10.5M. Full precision stays in the tables. */
export function formatMillions(value: number): string {
  return `$${(value / 1_000_000).toFixed(2)}M`;
}

/** Full money format for tables and exports: $10,500,000. */
export function formatDollars(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}
