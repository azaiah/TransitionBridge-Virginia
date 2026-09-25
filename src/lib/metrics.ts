/**
 * Every derived metric in the product is a small, named, pure function here, with a unit
 * test carrying hand-checked expected values (CLAUDE.md §3.2).
 *
 * Nothing in this file reads data. Pass records in; get numbers out.
 */
import { DEMO_NOW_MS, MS_PER_DAY } from './demo-clock';
import type { StoredReferral } from '@/data/types';

/**
 * Smallest denominator we will show a rate on.
 *
 * A "100% employment outcome rate" built on one completed case is arithmetically true and
 * substantively meaningless, and presenting it as a finding is exactly what gets a
 * demonstration disbelieved (CLAUDE.md §1.4). Below this, screens show no rate and say why.
 */
export const MIN_RATE_SAMPLE = 10;

/** The three statuses that mean "nobody has picked this student up yet". */
export const UNASSIGNED_STATUSES = ['NEW', 'UNDER_REVIEW', 'READY_TO_ASSIGN'] as const;

type Timestamped = Pick<
  StoredReferral,
  'submittedAt' | 'assignedAt' | 'firstServiceAt' | 'status'
>;

/** Days since the referral was submitted, measured against the fixed demonstration now. */
export function ageDays(referral: Pick<StoredReferral, 'submittedAt'>, nowMs = DEMO_NOW_MS): number {
  return (nowMs - Date.parse(referral.submittedAt)) / MS_PER_DAY;
}

/** Days from submission to vendor assignment. Null while still unassigned. */
export function daysToAssignment(referral: Pick<StoredReferral, 'submittedAt' | 'assignedAt'>): number | null {
  if (!referral.assignedAt) return null;
  return (Date.parse(referral.assignedAt) - Date.parse(referral.submittedAt)) / MS_PER_DAY;
}

/** Days from submission to the first delivered service. Null while none is logged. */
export function daysToFirstService(
  referral: Pick<StoredReferral, 'submittedAt' | 'firstServiceAt'>,
): number | null {
  if (!referral.firstServiceAt) return null;
  return (Date.parse(referral.firstServiceAt) - Date.parse(referral.submittedAt)) / MS_PER_DAY;
}

/** Waiting, unassigned, past two weeks. The number the queue exists to drive to zero. */
export function isStale(referral: Timestamped, nowMs = DEMO_NOW_MS): boolean {
  return (
    (UNASSIGNED_STATUSES as readonly string[]).includes(referral.status) &&
    ageDays(referral, nowMs) > 14
  );
}

/** A referral is "open" until it is completed or closed. */
export function isOpen(status: StoredReferral['status']): boolean {
  return status !== 'COMPLETED' && status !== 'CLOSED_NOT_SERVED';
}

/**
 * A rate, or null when too few cases sit behind it to report. Screens render null as an
 * em dash plus the reason, never as 0% — "no completed cases" and "nobody found a job"
 * are different findings and must not look the same.
 */
export function reportableRate(rate: number | null, denominator: number): number | null {
  if (rate === null || denominator < MIN_RATE_SAMPLE) return null;
  return rate;
}

/** Share of submitted referrals that reached a vendor. 0–1, null when nothing submitted. */
export function fillRate(assigned: number, submitted: number): number | null {
  return submitted === 0 ? null : assigned / submitted;
}

/** Share of assigned referrals that reached completion. 0–1. */
export function completionRate(completed: number, assigned: number): number | null {
  return assigned === 0 ? null : completed / assigned;
}

/**
 * Coverage gap, 0–100. 0 means capacity comfortably exceeds demand; 100 means demand
 * exists and there is no capacity at all to meet it.
 */
export function coverageGap(demand: number, capacity: number): number {
  if (demand <= 0) return 0;
  if (capacity <= 0) return 100;
  const ratio = capacity / demand;
  return Math.round(Math.max(0, Math.min(100, (1 - ratio) * 100)));
}

/**
 * Share of the 15% Pre-ETS reserve spent so far. 1 means the requirement is exactly met;
 * values above 1 mean it was exceeded. Null when there is no requirement to measure against.
 */
export function reserveUtilization(spent: number, requirement: number): number | null {
  return requirement <= 0 ? null : spent / requirement;
}

/**
 * Straight-line year-end projection: spend so far, scaled up by how much of the year is
 * left. Deliberately naive — it assumes no seasonality, which is the honest thing to show
 * when we cannot know what the rest of the year holds.
 */
export function projectYearEnd(spentToDate: number, elapsedShare: number): number {
  if (elapsedShare <= 0) return 0;
  return Math.round(spentToDate / Math.min(1, elapsedShare));
}

/**
 * How far the projection lands below the reserve requirement. Zero when the projection
 * meets or exceeds it, so a caller can treat any positive number as a shortfall to flag.
 */
export function reserveShortfall(projected: number, requirement: number): number {
  return Math.max(0, requirement - projected);
}

/** Median of a numeric list. Null for an empty list. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
    : (sorted[mid] as number);
}

/** Median rounded to whole days — how waiting times are always reported. */
export function medianDays(values: number[]): number | null {
  const m = median(values);
  return m === null ? null : Math.round(m);
}

/** Turn counts into shares that sum to 1. An all-zero input returns all zeros. */
export function toShares<K extends string>(counts: Record<K, number>): Record<K, number> {
  const total = Object.values(counts).reduce<number>((sum, n) => sum + (n as number), 0);
  const out = {} as Record<K, number>;
  for (const key of Object.keys(counts) as K[]) {
    out[key] = total === 0 ? 0 : (counts[key] as number) / total;
  }
  return out;
}

/** Round to a fixed number of decimals without floating-point drift in the output. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Completion and employment over every referral cohort in the dataset (two years), for one
 * district or division. A single quarter's referrals have barely had time to finish, so a
 * quarter-only completion rate reads as 0% everywhere; outcomes are judged over the longer
 * window, like the WIOA indicators. Employment is weighted by completed cases.
 */
export function outcomeRates(
  rows: { referralsAssigned: number; referralsCompleted: number; employmentOutcomeRate: number | null }[],
): { completionRate: number | null; employmentOutcomeRate: number | null; completed: number } {
  let assigned = 0;
  let completed = 0;
  let employed = 0;
  let rated = 0;
  for (const r of rows) {
    assigned += r.referralsAssigned;
    completed += r.referralsCompleted;
    if (r.employmentOutcomeRate !== null && r.referralsCompleted > 0) {
      employed += r.employmentOutcomeRate * r.referralsCompleted;
      rated += r.referralsCompleted;
    }
  }
  return {
    completionRate: assigned === 0 ? null : completed / assigned,
    employmentOutcomeRate: reportableRate(rated === 0 ? null : employed / rated, completed),
    completed,
  };
}
