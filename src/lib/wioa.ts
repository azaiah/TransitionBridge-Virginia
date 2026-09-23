/**
 * The six WIOA §116 primary indicators as a list, in statutory order, with the formatting
 * each one needs. Statutory order matters: a compliance officer reads them in this sequence
 * and reorders nothing.
 *
 * Definitions and citations for these live in src/lib/definitions/wioa.ts.
 */
import type { WioaIndicators } from '@/data/types';

export type WioaKey = keyof WioaIndicators;

export interface WioaIndicatorSpec {
  key: WioaKey;
  /** The statutory name. Do not shorten it on screen. */
  label: string;
  /** Short label for chart axes and narrow table headers. */
  shortLabel: string;
  /** Rates render as percentages; earnings render as dollars. */
  kind: 'rate' | 'currency';
}

export const WIOA_INDICATOR_SPECS: readonly WioaIndicatorSpec[] = [
  {
    key: 'employmentRateQ2',
    label: 'Employment rate — 2nd quarter after exit',
    shortLabel: 'Employment Q2',
    kind: 'rate',
  },
  {
    key: 'employmentRateQ4',
    label: 'Employment rate — 4th quarter after exit',
    shortLabel: 'Employment Q4',
    kind: 'rate',
  },
  {
    key: 'medianEarningsQ2',
    label: 'Median earnings — 2nd quarter after exit',
    shortLabel: 'Median earnings',
    kind: 'currency',
  },
  {
    key: 'credentialAttainmentRate',
    label: 'Credential attainment rate',
    shortLabel: 'Credentials',
    kind: 'rate',
  },
  {
    key: 'measurableSkillGains',
    label: 'Measurable skill gains',
    shortLabel: 'Skill gains',
    kind: 'rate',
  },
  {
    key: 'effectivenessServingEmployers',
    label: 'Effectiveness in serving employers',
    shortLabel: 'Employers',
    kind: 'rate',
  },
] as const;

/** Formats one indicator value for display. Rates are whole percents; earnings whole dollars. */
export function formatIndicator(kind: WioaIndicatorSpec['kind'], value: number): string {
  if (kind === 'currency') return `$${Math.round(value).toLocaleString()}`;
  return `${Math.round(value * 100)}%`;
}

/** Percentage-point (or dollar) change between two periods, already rounded for display. */
export function indicatorDelta(
  kind: WioaIndicatorSpec['kind'],
  current: number,
  previous: number,
): number {
  if (kind === 'currency') return Math.round(current - previous);
  return Math.round((current - previous) * 100);
}

/** The words that go next to a delta, so direction is never carried by color alone. */
export function deltaLabel(delta: number): string {
  if (delta > 0) return 'higher than last quarter';
  if (delta < 0) return 'lower than last quarter';
  return 'unchanged from last quarter';
}
