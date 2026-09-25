/**
 * The funding layer — who is paying for each service, and how much is left.
 *
 * Deliberately not a billing system. It does three things:
 *   1. names the funder on every authorization (DARS, DMAS, Virginia Works, ...),
 *   2. shows authorized vs. used vs. remaining hours, per student,
 *   3. refuses to log a service that would take an authorization past its limit.
 *
 * The third is what stops over-billing: the check happens at the moment a service is
 * logged, not months later in a reconciliation.
 *
 * Pure functions only; the unit tests carry hand-checked values.
 */
import type {
  Authorization,
  FundingSource,
  FundingTotals,
  StoredAuthorization,
} from '@/data/types';

/** What each funder typically pays for in this model. Illustrative, not a contract. */
export const FUNDING_SOURCE_DESCRIPTIONS: Record<FundingSource, string> = {
  DARS: 'The 15% Pre-ETS reserve — the five required Pre-ETS activities.',
  DMAS: 'Medicaid waiver supports, such as job coaching.',
  VIRGINIA_WORKS: 'State workforce programs, such as paid work experience.',
  SCHOOL_DIVISION: 'Supports the school provides, such as a job coach during the school day.',
  GRANT: 'Time-limited grant programs, such as a summer work program.',
  LOCAL_WORKFORCE_BOARD: 'WIOA Youth work experience through the local workforce board.',
  OTHER_AGENCY: 'Other partner agencies, such as benefits counseling.',
};

/** Why an authorization is extended. The reason is recorded with the extension. */
export const EXTEND_REASONS = [
  'Plan updated at the IEP meeting',
  'Additional work-based learning approved',
  'Correcting an authorization entered too low',
] as const;

/** At or above this share of hours used, an authorization is flagged as near its limit. */
export const NEAR_LIMIT_SHARE = 0.9;

export type AuthorizationStatus = 'OK' | 'NEAR_LIMIT' | 'OVER';

export const AUTHORIZATION_STATUS_LABELS: Record<AuthorizationStatus, string> = {
  OK: 'Hours available',
  NEAR_LIMIT: 'Near its limit',
  OVER: 'Over authorization',
};

type Usage = Pick<StoredAuthorization, 'hoursAuthorized' | 'minutesUsed'>;

export function hoursUsed(auth: Pick<StoredAuthorization, 'minutesUsed'>): number {
  return auth.minutesUsed / 60;
}

/** Can be negative: a negative number is hours already logged past the authorization. */
export function hoursRemaining(auth: Usage): number {
  return auth.hoursAuthorized - hoursUsed(auth);
}

/** Share of authorized hours used, 0–1+ (above 1 means over). Zero hours authorized → 1. */
export function hoursUtilization(auth: Usage): number {
  if (auth.hoursAuthorized <= 0) return 1;
  return hoursUsed(auth) / auth.hoursAuthorized;
}

export function authorizationStatus(auth: Usage): AuthorizationStatus {
  const used = hoursUsed(auth);
  if (used > auth.hoursAuthorized + 1e-9) return 'OVER';
  if (hoursUtilization(auth) >= NEAR_LIMIT_SHARE) return 'NEAR_LIMIT';
  return 'OK';
}

export function dollarsRemaining(
  auth: Pick<StoredAuthorization, 'dollarsAuthorized' | 'dollarsUsed'>,
): number {
  return auth.dollarsAuthorized - auth.dollarsUsed;
}

export interface ServiceCheck {
  allowed: boolean;
  /** Hours left after this session, if it were logged. */
  remainingAfter: number;
  /** How far past the authorization this session would go, in hours. Zero when allowed. */
  overBy: number;
}

/**
 * Would logging `minutes` more keep the authorization inside its limit? This is the
 * over-billing guard the provider's service log calls before anything is saved.
 */
export function checkNewService(auth: Usage, minutes: number): ServiceCheck {
  const remainingAfter = hoursRemaining(auth) - minutes / 60;
  const overBy = remainingAfter < -1e-9 ? -remainingAfter : 0;
  return { allowed: overBy === 0, remainingAfter, overBy };
}

/** A blank totals row. */
export function emptyTotals(): FundingTotals {
  return {
    authorizations: 0,
    hoursAuthorized: 0,
    hoursUsed: 0,
    dollarsAuthorized: 0,
    dollarsUsed: 0,
    nearLimit: 0,
    overAuthorized: 0,
  };
}

/** Adds authorizations into a totals row. Hours are rounded to one decimal at the end. */
export function sumAuthorizations(auths: StoredAuthorization[] | Authorization[]): FundingTotals {
  const totals = emptyTotals();
  let minutes = 0;
  for (const auth of auths) {
    totals.authorizations++;
    totals.hoursAuthorized += auth.hoursAuthorized;
    minutes += auth.minutesUsed;
    totals.dollarsAuthorized += auth.dollarsAuthorized;
    totals.dollarsUsed += auth.dollarsUsed;
    const status = authorizationStatus(auth);
    if (status === 'NEAR_LIMIT') totals.nearLimit++;
    if (status === 'OVER') totals.overAuthorized++;
  }
  totals.hoursUsed = Math.round((minutes / 60) * 10) / 10;
  totals.dollarsAuthorized = Math.round(totals.dollarsAuthorized);
  totals.dollarsUsed = Math.round(totals.dollarsUsed);
  return totals;
}

/** "12.5 hrs" / "1 hr" — hours are always shown with their unit. */
export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  const text = rounded.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: 1,
  });
  return `${text} ${Math.abs(rounded) === 1 ? 'hr' : 'hrs'}`;
}
