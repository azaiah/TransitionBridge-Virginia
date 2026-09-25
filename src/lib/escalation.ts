/**
 * The early warning system for past-due referrals — 14, 30, and 90 days.
 *
 * A referral can stall in three places, and each has a different person who can move it:
 *
 *   - waiting for a provider   (DARS has it, nobody has been assigned)    measured from submission
 *   - waiting on consent       (the family has not returned the form)     measured from submission
 *   - waiting to start         (a provider accepted, no service logged)   measured from assignment
 *
 * Each stall climbs the same ladder. At 14 days it is flagged to the counselor, at 30 it is
 * escalated to the district manager, at 90 to the state office. The 14-day rung for
 * "waiting for a provider" is exactly the long-standing "unassigned more than 14 days"
 * number, so the two can never disagree.
 *
 * Pure functions only. Pass records in, get answers out.
 */
import { DEMO_NOW_MS, MS_PER_DAY } from './demo-clock';
import type { StoredReferral } from '@/data/types';

export type StallStage = 'WAITING_FOR_PROVIDER' | 'WAITING_ON_CONSENT' | 'WAITING_TO_START';

export const STALL_STAGES: readonly StallStage[] = [
  'WAITING_FOR_PROVIDER',
  'WAITING_ON_CONSENT',
  'WAITING_TO_START',
] as const;

export const STALL_STAGE_LABELS: Record<StallStage, string> = {
  WAITING_FOR_PROVIDER: 'Waiting for a provider',
  WAITING_ON_CONSENT: 'Waiting on a consent form',
  WAITING_TO_START: 'Waiting for a first service',
};

/** Who can move a referral out of each stage — shown so an escalation is never ownerless. */
export const STALL_STAGE_OWNERS: Record<StallStage, string> = {
  WAITING_FOR_PROVIDER: 'DARS counselor',
  WAITING_ON_CONSENT: 'School coordinator',
  WAITING_TO_START: 'Assigned provider',
};

export type EscalationTier = 14 | 30 | 90;

export const ESCALATION_TIERS: readonly EscalationTier[] = [14, 30, 90] as const;

export const TIER_LABELS: Record<EscalationTier, string> = {
  14: '14+ days',
  30: '30+ days',
  90: '90+ days',
};

/** What happens at each rung, in plain words. */
export const TIER_ACTIONS: Record<EscalationTier, string> = {
  14: 'Flagged to the counselor',
  30: 'Escalated to the district manager',
  90: 'Escalated to the state office',
};

/**
 * A referral waiting for a provider always escalates, however long it has waited — DARS
 * owns it, and "unassigned more than 14 days" has to equal the early-warning count.
 * A wait on a family's consent form or on a provider's first session that began more than
 * a year ago is dormant instead: it needs a decision to close or re-open it, not another
 * reminder, and is counted separately so it is never silently dropped.
 */
export const ESCALATION_WINDOW_DAYS = 365;

const UNASSIGNED = new Set(['NEW', 'UNDER_REVIEW', 'READY_TO_ASSIGN']);

type StallFields = Pick<StoredReferral, 'status' | 'submittedAt' | 'assignedAt'>;

export interface Stall {
  stage: StallStage;
  /** When the current wait began. */
  since: string;
  /** Whole days waited so far, measured against the fixed demonstration "now". */
  days: number;
}

/** Where a referral is stuck, if anywhere. Referrals in service or closed are not stalled. */
export function stallFor(referral: StallFields, nowMs = DEMO_NOW_MS): Stall | null {
  let stage: StallStage | null = null;
  let since: string | null = null;

  if (UNASSIGNED.has(referral.status)) {
    stage = 'WAITING_FOR_PROVIDER';
    since = referral.submittedAt;
  } else if (referral.status === 'AWAITING_CONSENT') {
    stage = 'WAITING_ON_CONSENT';
    since = referral.submittedAt;
  } else if (referral.status === 'ASSIGNED' && referral.assignedAt) {
    stage = 'WAITING_TO_START';
    since = referral.assignedAt;
  }

  if (!stage || !since) return null;
  return { stage, since, days: (nowMs - Date.parse(since)) / MS_PER_DAY };
}

/**
 * The rung a wait has reached. Past 14 days (strictly, matching isStale), then 30 and 90.
 * Null below the first rung.
 */
export function tierForDays(days: number): EscalationTier | null {
  if (days >= 90) return 90;
  if (days >= 30) return 30;
  if (days > 14) return 14;
  return null;
}

export interface Escalation extends Stall {
  tier: EscalationTier;
}

/** A referral's escalation, or null when it is on time, moving, or dormant. */
function dormantStall(stall: Stall): boolean {
  return stall.stage !== 'WAITING_FOR_PROVIDER' && stall.days > ESCALATION_WINDOW_DAYS;
}

export function escalationFor(referral: StallFields, nowMs = DEMO_NOW_MS): Escalation | null {
  const stall = stallFor(referral, nowMs);
  if (!stall || dormantStall(stall)) return null;
  const tier = tierForDays(stall.days);
  return tier ? { ...stall, tier } : null;
}

/** Open, stalled for more than a year: needs a close-or-reopen decision. */
export function isDormant(referral: StallFields, nowMs = DEMO_NOW_MS): boolean {
  const stall = stallFor(referral, nowMs);
  return stall !== null && dormantStall(stall);
}

/** Counts by stage and tier. Every tier count is "at this rung", not cumulative. */
export type TierCounts = Record<StallStage, Record<EscalationTier, number>>;

export function emptyTierCounts(): TierCounts {
  const blank = (): Record<EscalationTier, number> => ({ 14: 0, 30: 0, 90: 0 });
  return {
    WAITING_FOR_PROVIDER: blank(),
    WAITING_ON_CONSENT: blank(),
    WAITING_TO_START: blank(),
  };
}

export function countEscalations(referrals: StallFields[], nowMs = DEMO_NOW_MS): TierCounts {
  const counts = emptyTierCounts();
  for (const referral of referrals) {
    const escalation = escalationFor(referral, nowMs);
    if (escalation) counts[escalation.stage][escalation.tier]++;
  }
  return counts;
}

/** All stages added together at one rung. */
export function tierTotal(counts: TierCounts, tier: EscalationTier): number {
  return STALL_STAGES.reduce((sum, stage) => sum + counts[stage][tier], 0);
}

/** Every escalated referral, all rungs, all stages. */
export function escalatedTotal(counts: TierCounts): number {
  return ESCALATION_TIERS.reduce((sum, tier) => sum + tierTotal(counts, tier), 0);
}
