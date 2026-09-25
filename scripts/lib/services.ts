/**
 * Delivered Pre-ETS services. The activity mix is deliberately uneven and varies widely
 * by district, which is what makes "work-based learning is 8% of services delivered"
 * a finding rather than a chart (docs/05_DEMO_DATA.md §3.7).
 */
import type {
  PreEtsActivity,
  ServiceRecord,
  ServiceSetting,
  StoredReferral,
  Student,
  Vendor,
} from '../../src/data/types';
import { REFERENCE_DATE, daysBetween, isoOf } from './calendar';
import { chance, randFloat, randInt, subRng, weightedPick } from './prng';

/** Statewide baseline shares before the district bias is applied. */
const ACTIVITY_BASE = [
  ['workplace_readiness_training', 0.31],
  ['job_exploration_counseling', 0.28],
  ['self_advocacy_instruction', 0.19],
  ['postsecondary_counseling', 0.14],
  ['work_based_learning', 0.08],
] as const satisfies readonly (readonly [PreEtsActivity, number])[];

/**
 * Work-based learning is the expensive, outcome-driving activity. Where a district has
 * employer relationships and provider depth it happens; where it does not, it does not.
 */
const WBL_DISTRICT_BIAS: Record<string, number> = {
  northern: 1.5,
  'hampton-roads': 1.05,
  capital: 0.78,
  skyline: 0.6,
  'new-river': 0.45,
  southwest: 0.26,
};

const SETTING_BY_ACTIVITY: Record<
  PreEtsActivity,
  readonly (readonly [ServiceSetting, number])[]
> = {
  work_based_learning: [
    ['WORKSITE', 0.66],
    ['COMMUNITY', 0.2],
    ['SCHOOL', 0.1],
    ['VIRTUAL', 0.04],
  ],
  job_exploration_counseling: [
    ['SCHOOL', 0.52],
    ['COMMUNITY', 0.16],
    ['VIRTUAL', 0.18],
    ['DARS_OFFICE', 0.14],
  ],
  workplace_readiness_training: [
    ['SCHOOL', 0.58],
    ['COMMUNITY', 0.18],
    ['VIRTUAL', 0.14],
    ['DARS_OFFICE', 0.1],
  ],
  postsecondary_counseling: [
    ['SCHOOL', 0.5],
    ['VIRTUAL', 0.26],
    ['DARS_OFFICE', 0.18],
    ['COMMUNITY', 0.06],
  ],
  self_advocacy_instruction: [
    ['SCHOOL', 0.62],
    ['VIRTUAL', 0.16],
    ['COMMUNITY', 0.12],
    ['DARS_OFFICE', 0.1],
  ],
};

/**
 * Illustrative unit rates, shaped like a Pre-ETS fee schedule. Used only to derive
 * reserve spend from real service records — never displayed as a published DARS rate.
 */
export const UNIT_RATE: Record<PreEtsActivity, number> = {
  work_based_learning: 780,
  workplace_readiness_training: 260,
  postsecondary_counseling: 240,
  job_exploration_counseling: 220,
  self_advocacy_instruction: 210,
};

/** Group delivery costs materially less per student. */
export function serviceCost(record: ServiceRecord): number {
  const base = UNIT_RATE[record.activity];
  return Math.round(record.groupSession ? base * 0.45 : base);
}

export function buildServiceRecords(
  ctx: { seed: number; vendorById: Map<string, Vendor> },
  referrals: StoredReferral[],
  studentById: Map<string, Student>,
): ServiceRecord[] {
  const records: ServiceRecord[] = [];

  for (const referral of referrals) {
    if (!referral.firstServiceAt) continue;

    const rng = subRng(ctx.seed, `svc:${referral.id}`);
    const start = new Date(referral.firstServiceAt);
    const finish = referral.completedAt ? new Date(referral.completedAt) : REFERENCE_DATE;
    const windowDays = Math.max(1, daysBetween(isoOf(start), isoOf(finish)));

    // Roughly one contact a month while a student is engaged. Completed engagements
    // carry a fuller course of services than ones still under way.
    const expected = referral.completedAt
      ? randInt(rng, 3, 8)
      : Math.max(1, Math.min(7, Math.round(windowDays / 38) + randInt(rng, 0, 1)));

    const activityWeights = biasedActivityWeights(referral.darsDistrictId);
    const vendor = referral.assignedVendorId
      ? ctx.vendorById.get(referral.assignedVendorId)
      : undefined;

    for (let i = 0; i < expected; i++) {
      const activity = weightedPick(rng, activityWeights);
      const offsetDays = i === 0 ? 0 : randFloat(rng, 0, windowDays);
      const serviceDate = new Date(start.getTime() + offsetDays * 86_400_000);
      if (serviceDate.getTime() > REFERENCE_DATE.getTime()) continue;

      // If the assigned provider is not approved for this activity, DARS staff deliver it.
      // That mismatch is where the in-house / vendor split genuinely comes from.
      const vendorCanDeliver = vendor ? vendor.activitiesOffered.includes(activity) : false;
      const deliveredInHouse = !vendorCanDeliver || chance(rng, 0.1);
      const groupSession = activity === 'work_based_learning' ? chance(rng, 0.12) : chance(rng, 0.34);

      records.push({
        id: `DEMO-SVC-${String(records.length + 1).padStart(6, '0')}`,
        referralId: referral.id,
        studentId: referral.studentId,
        vendorId: deliveredInHouse ? null : (vendor?.id ?? null),
        deliveredInHouse,
        activity,
        // Date only. A Pre-ETS service is logged against a day, not a timestamp, and
        // dropping the time of day takes ~1.2 MB off the shipped payload.
        serviceDate: isoOf(serviceDate).slice(0, 10),
        durationMinutes: groupSession
          ? weightedPick(rng, [[90, 0.4], [120, 0.4], [180, 0.2]] as const)
          : weightedPick(rng, [[45, 0.25], [60, 0.45], [90, 0.2], [120, 0.1]] as const),
        setting: weightedPick(rng, SETTING_BY_ACTIVITY[activity]),
        groupSession,
        notes: null,
      });
    }
  }

  records.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));

  // The DE 96 analogue: a student's Pre-ETS start date is their first delivered service.
  for (const record of records) {
    const student = studentById.get(record.studentId);
    if (student && student.preEtsStartDate === null) {
      student.preEtsStartDate = record.serviceDate;
    }
  }

  return records;
}

function biasedActivityWeights(
  districtId: string,
): readonly (readonly [PreEtsActivity, number])[] {
  const bias = WBL_DISTRICT_BIAS[districtId] ?? 1;
  return ACTIVITY_BASE.map(([activity, weight]) =>
    activity === 'work_based_learning'
      ? ([activity, weight * bias] as const)
      : ([activity, weight] as const),
  );
}
