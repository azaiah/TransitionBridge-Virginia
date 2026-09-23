/**
 * The referral pipeline simulation. Statuses are not sampled from a table — they EMERGE
 * from simulated timing, which is why the dataset survives being clicked into.
 *
 * Every deliberate finding in docs/05_DEMO_DATA.md §3.5–§3.6 is produced here:
 *   - rural median days-to-assignment materially worse than urban
 *   - a real ASSIGNED → IN_SERVICE drop-off
 *   - referrals stalled past 14 days, concentrated in the rural districts
 *   - decline reasons, including transportation, captured on the record
 */
import type {
  DeclineReason,
  PreEtsActivity,
  SchoolDivision,
  StoredReferral,
  Student,
  Vendor,
} from '../../src/data/types';
import { PRE_ETS_ACTIVITIES } from '../../src/data/types';
import { addDays, daysSince, isoOf, periodRange, PERIODS, CURRENT_PERIOD } from './calendar';
import type { Geography } from './geography';
import { milesBetween } from './geography';
import type { Rng } from './prng';
import {
  chance,
  lognormalClamped,
  poisson,
  randFloat,
  shuffle,
  subRng,
  weightedPick,
} from './prng';
import type { StudentPool } from './students';
import { DIVISION_ENROLLMENT } from './reference';

/** Divisions forced to zero referrals in the current quarter. docs §3.1. */
export const ZERO_REFERRAL_DIVISIONS = 11;

/**
 * Referrals that must be sitting unassigned past 14 days right now, by district.
 * Deliberately concentrated in Southwest and New River — the rural Pre-ETS gap the 2025
 * CSNA describes, made countable. Total: 118, inside the 90–140 target in docs §3.5.
 */
export const STALE_TARGETS: Record<string, number> = {
  southwest: 44,
  'new-river': 34,
  skyline: 16,
  capital: 10,
  'hampton-roads': 8,
  northern: 6,
};

/** Districts where assignment genuinely takes longer. Produces the rural/urban gap. */
const DISTRICT_DELAY: Record<string, number> = {
  southwest: 1.55,
  'new-river': 1.28,
  skyline: 1.05,
  capital: 0.95,
  'hampton-roads': 0.92,
  northern: 0.9,
};

const DECLINE_WEIGHTS = [
  ['NO_CAPACITY', 0.34],
  ['OUTSIDE_SERVICE_AREA', 0.27],
  ['TRANSPORTATION_NOT_FEASIBLE', 0.18],
  ['CANNOT_DELIVER_ACTIVITY', 0.12],
  ['SCHEDULING_CONFLICT', 0.06],
  ['OTHER', 0.03],
] as const satisfies readonly (readonly [DeclineReason, number])[];

const ACTIVITY_REQUEST_WEIGHTS = [
  ['workplace_readiness_training', 0.31],
  ['job_exploration_counseling', 0.28],
  ['self_advocacy_instruction', 0.19],
  ['postsecondary_counseling', 0.14],
  ['work_based_learning', 0.08],
] as const satisfies readonly (readonly [PreEtsActivity, number])[];

export type ReferralContext = {
  geo: Geography;
  vendors: Vendor[];
  vendorById: Map<string, Vendor>;
  coverageByFips: Map<string, string[]>;
  divisionPersona: (divisionId: string) => string;
  districtPersona: (districtId: string) => string;
  seed: number;
};

type Seed = {
  id: string;
  student: Student;
  division: SchoolDivision;
  submittedAt: Date;
};

type SimFlags = {
  /** Never reaches assignment inside the demo window. */
  forceStall?: boolean;
  /** Pull assignment forward so the referral is no longer waiting. */
  forceAssign?: boolean;
};

/** Expected referrals per quarter for a division — log-normal, correlated with size. */
function expectedQuarterly(rng: Rng, division: SchoolDivision): number {
  const enrollment = DIVISION_ENROLLMENT[division.id] ?? division.estimatedSwdEnrollment;
  const base = Math.max(2.7, (enrollment / 1000) * 1.07);
  return base * lognormalClamped(rng, 1, 0.32, 0.45, 2.4);
}

export function buildReferrals(
  rng: Rng,
  ctx: ReferralContext,
  pool: StudentPool,
): { referrals: StoredReferral[]; zeroReferralDivisionIds: string[] } {
  const { geo } = ctx;
  const divisions = geo.divisions;

  const isRural = (division: SchoolDivision) =>
    geo.byFips.get(division.localityFips)?.isRural ?? true;

  // The zero-referral divisions are chosen up front, weighted toward small and rural.
  const smallRuralFirst = [...divisions]
    .filter((d) => isRural(d))
    .sort(
      (a, b) =>
        (DIVISION_ENROLLMENT[a.id] ?? 1200) - (DIVISION_ENROLLMENT[b.id] ?? 1200),
    );
  const zeroReferralDivisionIds = shuffle(rng, smallRuralFirst.slice(0, 34))
    .slice(0, ZERO_REFERRAL_DIVISIONS)
    .map((d) => d.id);
  const zeroSet = new Set(zeroReferralDivisionIds);

  // Each division keeps a stable volume across quarters so trends read as trends.
  const rates = new Map(divisions.map((d) => [d.id, expectedQuarterly(rng, d)]));

  const referrals: StoredReferral[] = [];
  let counter = 0;

  for (const period of PERIODS) {
    const { start, end } = periodRange(period);
    const spanDays = (end.getTime() - start.getTime()) / 86_400_000;

    for (const division of divisions) {
      const isCurrent = period === CURRENT_PERIOD;
      if (isCurrent && zeroSet.has(division.id)) continue;

      let count = poisson(rng, rates.get(division.id) ?? 3);
      // Outside the zero set, every division shows at least one referral this quarter,
      // so the "zero referral" count is exactly the deliberate one and not noise.
      if (isCurrent && count === 0) count = 1;
      if (count === 0) continue;

      for (let i = 0; i < count; i++) {
        counter++;
        const student = pool.obtain(division.id);
        const id = `DEMO-REF-${period.slice(0, 4)}-${String(counter).padStart(6, '0')}`;
        const submittedAt = addDays(start, randFloat(rng, 0, spanDays));
        referrals.push(simulateReferral(ctx, { id, student, division, submittedAt }, {}));
      }
    }
  }

  calibrateStalled(ctx, referrals, pool);

  return { referrals, zeroReferralDivisionIds };
}

/** status ∈ {NEW, UNDER_REVIEW, READY_TO_ASSIGN} and waiting more than 14 days. */
function isStale(referral: StoredReferral): boolean {
  const open = ['NEW', 'UNDER_REVIEW', 'READY_TO_ASSIGN'];
  return open.includes(referral.status) && daysSince(referral.submittedAt) > 14;
}

/**
 * Brings the "unassigned over 14 days" number onto its per-district target.
 *
 * The simulation produces stalled referrals naturally; this pass only decides HOW MANY
 * and WHERE, so the KPI tile is exact and the queue behind it really does contain that
 * many records. Referrals are re-simulated through the same function with one changed
 * input, so timelines stay internally consistent.
 */
function calibrateStalled(
  ctx: ReferralContext,
  referrals: StoredReferral[],
  pool: StudentPool,
): void {
  const studentById = new Map(pool.students.map((s) => [s.id, s]));
  const divisionById = new Map(ctx.geo.divisions.map((d) => [d.id, d]));

  const resim = (index: number, flags: SimFlags) => {
    const current = referrals[index]!;
    const student = studentById.get(current.studentId)!;
    const division = divisionById.get(current.divisionId)!;
    referrals[index] = simulateReferral(
      ctx,
      { id: current.id, student, division, submittedAt: new Date(current.submittedAt) },
      flags,
    );
  };

  for (const [districtId, target] of Object.entries(STALE_TARGETS)) {
    const inDistrict = referrals
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.darsDistrictId === districtId);

    const staleHere = () => inDistrict.filter(({ i }) => isStale(referrals[i]!)).map(({ i }) => i);

    // Too many waiting: place the oldest ones, which are the least believable.
    const excess = [...staleHere()].sort(
      (a, b) => daysSince(referrals[b]!.submittedAt) - daysSince(referrals[a]!.submittedAt),
    );
    for (const index of excess) {
      if (staleHere().length <= target) break;
      resim(index, { forceAssign: true });
    }

    // Too few: stall recent referrals, newest first so nothing looks abandoned for a year.
    const candidates = inDistrict
      .filter(({ i }) => {
        const age = daysSince(referrals[i]!.submittedAt);
        return age > 16 && age < 85 && !isStale(referrals[i]!) &&
          referrals[i]!.status !== 'CLOSED_NOT_SERVED';
      })
      .sort((a, b) => daysSince(referrals[a.i]!.submittedAt) - daysSince(referrals[b.i]!.submittedAt));

    for (const { i } of candidates) {
      if (staleHere().length >= target) break;
      resim(i, { forceStall: true });
    }
  }
}

/** Simulate one referral end to end and read off its status at the reference date. */
export function simulateReferral(
  ctx: ReferralContext,
  seed: Seed,
  flags: SimFlags,
): StoredReferral {
  const { id, student, division, submittedAt } = seed;
  const rng = subRng(ctx.seed, id);
  const locality = ctx.geo.byFips.get(division.localityFips);
  const rural = locality?.isRural ?? true;
  const districtId = division.darsDistrictId;
  const age = daysSince(isoOf(submittedAt));

  const requestedActivities = pickRequestedActivities(rng);
  const { candidates, outsideArea } = selectVendors(ctx, division.localityFips, requestedActivities, rng);

  // Most referrals are placed on the first offer. Where coverage is thin, providers
  // decline and the referral goes back out — which is where the waiting time comes from.
  const declineCount = weightedPick(
    rng,
    outsideArea
      ? ([[1, 0.42], [2, 0.34], [0, 0.24]] as const)
      : ([[0, 0.82], [1, 0.13], [2, 0.05]] as const),
  );
  const offeredVendorIds = candidates.slice(0, Math.min(candidates.length, declineCount + 1));
  const vendorId = offeredVendorIds[offeredVendorIds.length - 1] ?? candidates[0]!;

  // ---- Stage durations, in days from submission -----------------------------------
  const tReviewStart = lognormalClamped(rng, 3, 0.85, 0.3, 32);
  const tReviewEnd = tReviewStart + lognormalClamped(rng, 2, 0.6, 0.4, 14);

  const needsConsent = !student.consentOnFile && chance(rng, 0.3);
  const consentDays = needsConsent ? lognormalClamped(rng, 8, 0.7, 1, 55) : 0;
  const tConsentDone = tReviewEnd + consentDays;

  const districtMultiplier = DISTRICT_DELAY[districtId] ?? 1;
  const barrierDelay = student.transportationBarrier ? lognormalClamped(rng, 4, 0.6, 0.5, 22) : 0;
  const outsideAreaDelay = outsideArea ? lognormalClamped(rng, 11, 0.6, 2, 60) : 0;

  // Days-to-assignment is drawn as a TOTAL from submission, because that is how the
  // metric is defined and reported. Review and consent sit inside it, not on top of it.
  const assignmentTarget =
    lognormalClamped(rng, rural ? 14 : 6.5, rural ? 0.72 : 0.62, 1, 220) * districtMultiplier +
    barrierDelay +
    outsideAreaDelay;
  let tAssigned = Math.max(tConsentDone + 0.4, assignmentTarget);

  if (flags.forceStall) tAssigned = 9_999;
  if (flags.forceAssign) tAssigned = Math.min(tAssigned, Math.max(tConsentDone + 0.5, age * 0.55));

  // A referral nobody can place does not wait forever — it gets closed. That converts the
  // long tail into recorded closures with reasons, which is where the decline story lives.
  const abandonAfter = 75 + lognormalClamped(rng, 14, 0.5, 2, 60);
  const closesUnplaced = !flags.forceStall && tAssigned > abandonAfter;
  const closesEarly = chance(rng, 0.03);

  const declined = offeredVendorIds.length > 1 || closesUnplaced;
  const declineReason = declined
    ? drawDeclineReason(rng, { outsideArea, barrier: student.transportationBarrier })
    : null;

  // The funnel drop-off between ASSIGNED and IN_SERVICE — the most interesting number
  // on the funnel chart, and it has to be real (docs §3.6).
  const stallsAfterAssignment = chance(rng, 0.12);
  const tFirstService =
    tAssigned +
    lognormalClamped(rng, 12, 0.7, 1, 110) +
    (student.transportationBarrier ? lognormalClamped(rng, 8, 0.5, 1, 30) : 0);

  // Most students stay engaged across school years; a minority formally complete inside
  // the demonstration window. That is what keeps the outcomes cohort a realistic size.
  const willComplete = chance(rng, 0.29);
  const tCompleted = tFirstService + lognormalClamped(rng, 130, 0.5, 30, 430);

  const tClosed = closesUnplaced
    ? Math.min(abandonAfter, tAssigned)
    : closesEarly
      ? tReviewEnd + lognormalClamped(rng, 18, 0.6, 2, 70)
      : Infinity;

  // ---- Read the status at the reference date --------------------------------------
  let status: StoredReferral['status'];
  let assignedAt: string | null = null;
  let firstServiceAt: string | null = null;
  let completedAt: string | null = null;
  let closedAt: string | null = null;

  const at = (days: number) => isoOf(addDays(submittedAt, days));

  if (age >= tClosed) {
    status = 'CLOSED_NOT_SERVED';
    closedAt = at(tClosed);
  } else if (age < tReviewStart) {
    status = 'NEW';
  } else if (age < tReviewEnd) {
    status = 'UNDER_REVIEW';
  } else if (needsConsent && age < tConsentDone) {
    status = 'AWAITING_CONSENT';
  } else if (age < tAssigned) {
    status = 'READY_TO_ASSIGN';
  } else if (stallsAfterAssignment || age < tFirstService) {
    status = 'ASSIGNED';
    assignedAt = at(tAssigned);
  } else if (willComplete && age >= tCompleted) {
    status = 'COMPLETED';
    assignedAt = at(tAssigned);
    firstServiceAt = at(tFirstService);
    completedAt = at(tCompleted);
  } else {
    status = 'IN_SERVICE';
    assignedAt = at(tAssigned);
    firstServiceAt = at(tFirstService);
  }

  const reviewed = age >= tReviewStart;
  const consentReceived = reviewed && (!needsConsent || age >= tConsentDone);
  if (consentReceived && !student.consentOnFile) {
    student.consentOnFile = true;
    student.consentDate = at(Math.min(tConsentDone, age));
  }

  const statusChangedAt =
    closedAt ??
    completedAt ??
    firstServiceAt ??
    assignedAt ??
    (reviewed ? at(Math.min(tReviewStart, age)) : isoOf(submittedAt));

  return {
    id,
    studentId: student.id,
    divisionId: division.id,
    schoolId: student.schoolId,
    darsDistrictId: districtId,
    localityFips: division.localityFips,
    submittedAt: isoOf(submittedAt),
    submittedByPersonaId: ctx.divisionPersona(division.id),
    requestedActivities,
    planType: student.planType,
    gradeLevel: student.gradeLevel,
    diplomaTrack: student.diplomaTrack,
    transportationBarrier: student.transportationBarrier,
    status,
    statusChangedAt,
    reviewedAt: reviewed ? at(tReviewStart) : null,
    reviewedByPersonaId: reviewed ? ctx.districtPersona(districtId) : null,
    // Offers are only on the record once the referral actually went out to a provider.
    offeredVendorIds: assignedAt || closedAt ? offeredVendorIds : [],
    assignedVendorId: assignedAt ? vendorId : null,
    assignedAt,
    firstServiceAt,
    completedAt,
    closedAt,
    declineReason: status === 'CLOSED_NOT_SERVED' || declined ? declineReason : null,
  };
}

function pickRequestedActivities(rng: Rng): PreEtsActivity[] {
  const chosen = new Set<PreEtsActivity>();
  const wanted = weightedPick(rng, [
    [1, 0.22],
    [2, 0.38],
    [3, 0.26],
    [4, 0.14],
  ] as const);

  let guard = 0;
  while (chosen.size < wanted && guard < 40) {
    guard++;
    chosen.add(weightedPick(rng, ACTIVITY_REQUEST_WEIGHTS));
  }
  if (chosen.size === 0) chosen.add(PRE_ETS_ACTIVITIES[0]);
  return [...chosen];
}

function drawDeclineReason(
  rng: Rng,
  hints: { outsideArea: boolean; barrier: boolean },
): DeclineReason {
  const weights = DECLINE_WEIGHTS.map(([reason, weight]) => {
    let w = weight;
    if (hints.outsideArea && reason === 'OUTSIDE_SERVICE_AREA') w *= 1.6;
    if (hints.barrier && reason === 'TRANSPORTATION_NOT_FEASIBLE') w *= 1.5;
    return [reason, w] as const;
  });
  return weightedPick(rng, weights);
}

/**
 * Candidate providers are those approved for the locality who offer a requested activity,
 * in the order they would be offered the referral. Where nobody covers the locality the
 * referral has to go outside the service area — which is precisely why those localities
 * show long waits and high decline rates.
 */
function selectVendors(
  ctx: ReferralContext,
  localityFips: string,
  requested: PreEtsActivity[],
  rng: Rng,
): { candidates: string[]; outsideArea: boolean } {
  const local = ctx.coverageByFips.get(localityFips) ?? [];
  const matching = local
    .map((id) => ctx.vendorById.get(id))
    .filter((v): v is Vendor => Boolean(v))
    .filter((v) => requested.some((a) => v.activitiesOffered.includes(a)));

  if (matching.length > 0) {
    // Better activity coverage gets offered first, with a little randomness so the
    // same provider is not mechanically first every single time.
    const ranked = [...matching].sort(
      (a, b) =>
        requested.filter((x) => b.activitiesOffered.includes(x)).length +
        rng() -
        (requested.filter((x) => a.activitiesOffered.includes(x)).length + rng()),
    );
    return { candidates: ranked.map((v) => v.id), outsideArea: false };
  }

  const target = ctx.geo.byFips.get(localityFips);
  const nearest = [...ctx.vendors]
    .map((v) => ({
      id: v.id,
      miles: target
        ? milesBetween(ctx.geo.byFips.get(v.headquartersFips)!.centroid, target.centroid)
        : 0,
    }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, 6);

  return { candidates: nearest.map((n) => n.id), outsideArea: true };
}
