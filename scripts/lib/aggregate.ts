/**
 * Every KPI, chart, and table in the product reads from here.
 *
 * Aggregates are COMPUTED from records and never authored. District rows are rolled up
 * from division rows and state rows from district rows, so the additive measures cannot
 * disagree — which is the one thing that would end a presentation
 * (docs/05_DEMO_DATA.md §5.1).
 */
import type {
  DiplomaTrack,
  DistrictMetrics,
  DivisionMetrics,
  OutcomeRecord,
  PlanType,
  PreEtsActivity,
  ServiceRecord,
  StateMetrics,
  StoredReferral,
  Student,
  WioaIndicators,
} from '../../src/data/types';
import { DIPLOMA_TRACKS, PLAN_TYPES, PRE_ETS_ACTIVITIES } from '../../src/data/types';
import { daysToAssignment, daysToFirstService, isStale, medianDays } from '../../src/lib/metrics';
import {
  FEDERAL_FY_START,
  PERIODS,
  REFERENCE_DATE,
  periodOf,
  periodRange,
} from './calendar';
import { serviceCost } from './services';

/** Illustrative federal VR award used only to frame the 15% reserve. Never sourced. */
export const FEDERAL_AWARD_ILLUSTRATIVE = 70_000_000;
export const RESERVE_RATE = 0.15;

type Zeroed<K extends string> = Record<K, number>;

function zeros<K extends string>(keys: readonly K[]): Zeroed<K> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Zeroed<K>;
}

function emptyDivisionRow(divisionId: string, period: string): DivisionMetrics {
  return {
    divisionId,
    period,
    referralsSubmitted: 0,
    referralsAccepted: 0,
    referralsAssigned: 0,
    referralsInService: 0,
    referralsCompleted: 0,
    referralsClosedNotServed: 0,
    medianDaysToAssignment: null,
    medianDaysToFirstService: null,
    planTypeMix: zeros(PLAN_TYPES),
    diplomaTrackMix: zeros(DIPLOMA_TRACKS),
    activityMix: zeros(PRE_ETS_ACTIVITIES),
    employmentOutcomeRate: null,
    zeroReferralQuarter: true,
    wioaIndicators: emptyWioa(),
  };
}

function emptyWioa(): WioaIndicators {
  return {
    employmentRateQ2: 0,
    employmentRateQ4: 0,
    medianEarningsQ2: 0,
    credentialAttainmentRate: 0,
    measurableSkillGains: 0,
    effectivenessServingEmployers: 0,
  };
}

/**
 * Records sliced to one geography, so the same WIOA function can be run statewide, for a
 * district, or for a division without any of them disagreeing about the definition.
 */
type ScopedRecords = {
  referrals: StoredReferral[];
  services: ServiceRecord[];
  outcomes: OutcomeRecord[];
};

function emptyScope(): ScopedRecords {
  return { referrals: [], services: [], outcomes: [] };
}

/** Groups every record under the geography key its referral belongs to. One pass each. */
function scopeRecords(
  input: AggregateInput,
  keyOf: (referral: StoredReferral) => string,
): Map<string, ScopedRecords> {
  const referralById = new Map(input.referrals.map((r) => [r.id, r]));
  const byKey = new Map<string, ScopedRecords>();

  const bucket = (key: string) => {
    const existing = byKey.get(key);
    if (existing) return existing;
    const created = emptyScope();
    byKey.set(key, created);
    return created;
  };

  for (const referral of input.referrals) bucket(keyOf(referral)).referrals.push(referral);
  for (const service of input.services) {
    const referral = referralById.get(service.referralId);
    if (referral) bucket(keyOf(referral)).services.push(service);
  }
  for (const outcome of input.outcomes) {
    const referral = referralById.get(outcome.referralId);
    if (referral) bucket(keyOf(referral)).outcomes.push(outcome);
  }

  return byKey;
}

export type AggregateInput = {
  divisionIds: string[];
  districtIds: string[];
  divisionDistrict: Map<string, string>;
  vendorCountByDistrict: Map<string, number>;
  localitiesWithoutCoverage: number;
  referrals: StoredReferral[];
  services: ServiceRecord[];
  outcomes: OutcomeRecord[];
  studentById: Map<string, Student>;
};

export type AggregateResult = {
  divisionMetrics: DivisionMetrics[];
  districtMetrics: DistrictMetrics[];
  stateMetrics: StateMetrics[];
};

export function aggregate(input: AggregateInput): AggregateResult {
  const referralById = new Map(input.referrals.map((r) => [r.id, r]));
  const cieReferralIds = new Set(
    input.outcomes
      .filter((o) => o.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT')
      .map((o) => o.referralId),
  );

  // ---- Division level, computed straight off the records ---------------------------
  const rows = new Map<string, DivisionMetrics>();
  const key = (divisionId: string, period: string) => `${divisionId}|${period}`;

  for (const divisionId of input.divisionIds) {
    for (const period of PERIODS) {
      rows.set(key(divisionId, period), emptyDivisionRow(divisionId, period));
    }
  }

  const assignDays = new Map<string, number[]>();
  const serviceDays = new Map<string, number[]>();
  const completedCount = new Map<string, number>();
  const employedCount = new Map<string, number>();

  for (const referral of input.referrals) {
    const period = periodOf(referral.submittedAt);
    if (!period) continue;
    const row = rows.get(key(referral.divisionId, period));
    if (!row) continue;

    row.referralsSubmitted++;
    row.zeroReferralQuarter = false;
    if (referral.reviewedAt) row.referralsAccepted++;
    if (referral.assignedAt) row.referralsAssigned++;
    if (referral.firstServiceAt) row.referralsInService++;
    if (referral.status === 'COMPLETED') row.referralsCompleted++;
    if (referral.status === 'CLOSED_NOT_SERVED') row.referralsClosedNotServed++;

    row.planTypeMix[referral.planType]++;
    row.diplomaTrackMix[referral.diplomaTrack]++;

    const k = key(referral.divisionId, period);
    const toAssign = daysToAssignment(referral);
    if (toAssign !== null) push(assignDays, k, toAssign);
    const toService = daysToFirstService(referral);
    if (toService !== null) push(serviceDays, k, toService);

    if (referral.status === 'COMPLETED') {
      completedCount.set(k, (completedCount.get(k) ?? 0) + 1);
      if (cieReferralIds.has(referral.id)) {
        employedCount.set(k, (employedCount.get(k) ?? 0) + 1);
      }
    }
  }

  // Services are counted in the period they were DELIVERED, which is what a user means
  // by "activity mix this quarter", and they still roll up by division.
  const spendByDivisionPeriod = new Map<string, number>();
  for (const service of input.services) {
    const referral = referralById.get(service.referralId);
    if (!referral) continue;
    const period = periodOf(service.serviceDate);
    if (!period) continue;
    const k = key(referral.divisionId, period);
    const row = rows.get(k);
    if (!row) continue;
    row.activityMix[service.activity]++;
    spendByDivisionPeriod.set(k, (spendByDivisionPeriod.get(k) ?? 0) + serviceCost(service));
  }

  // WIOA indicators per division, computed from that division's own records.
  const byDivision = scopeRecords(input, (r) => r.divisionId);

  for (const [k, row] of rows) {
    row.medianDaysToAssignment = medianDays(assignDays.get(k) ?? []);
    row.medianDaysToFirstService = medianDays(serviceDays.get(k) ?? []);
    const completed = completedCount.get(k) ?? 0;
    row.employmentOutcomeRate = completed === 0 ? null : (employedCount.get(k) ?? 0) / completed;

    const scope = byDivision.get(row.divisionId) ?? emptyScope();
    row.wioaIndicators = wioaFor(row.period, scope.outcomes, scope.referrals, scope.services);
  }

  const divisionMetrics = [...rows.values()];

  // ---- District level, rolled up from divisions ------------------------------------
  const staleByDistrictPeriod = new Map<string, number>();
  for (const referral of input.referrals) {
    if (!isStale(referral)) continue;
    const period = periodOf(referral.submittedAt);
    if (!period) continue;
    const k = `${referral.darsDistrictId}|${period}`;
    staleByDistrictPeriod.set(k, (staleByDistrictPeriod.get(k) ?? 0) + 1);
  }

  const byDistrict = scopeRecords(input, (r) => r.darsDistrictId);

  const districtMetrics: DistrictMetrics[] = [];
  for (const districtId of input.districtIds) {
    const divisionsHere = input.divisionIds.filter(
      (id) => input.divisionDistrict.get(id) === districtId,
    );

    for (const period of PERIODS) {
      const memberRows = divisionsHere
        .map((id) => rows.get(key(id, period)))
        .filter((r): r is DivisionMetrics => Boolean(r));

      const summed = sumRows(memberRows);
      const districtReferrals = input.referrals.filter(
        (r) => r.darsDistrictId === districtId && periodOf(r.submittedAt) === period,
      );

      const spend = divisionsHere.reduce(
        (total, id) => total + (spendByDivisionPeriod.get(key(id, period)) ?? 0),
        0,
      );

      const districtScope = byDistrict.get(districtId) ?? emptyScope();

      districtMetrics.push({
        darsDistrictId: districtId,
        period,
        ...summed,
        // Medians come from the records, never from a median of medians.
        medianDaysToAssignment: medianDays(
          districtReferrals.map(daysToAssignment).filter((n): n is number => n !== null),
        ),
        medianDaysToFirstService: medianDays(
          districtReferrals.map(daysToFirstService).filter((n): n is number => n !== null),
        ),
        employmentOutcomeRate: rateFrom(districtReferrals, cieReferralIds),
        zeroReferralQuarter: summed.referralsSubmitted === 0,
        divisionCount: divisionsHere.length,
        vendorCount: input.vendorCountByDistrict.get(districtId) ?? 0,
        unassignedOver14Days: staleByDistrictPeriod.get(`${districtId}|${period}`) ?? 0,
        preEtsSpend: spend,
        wioaIndicators: wioaFor(
          period,
          districtScope.outcomes,
          districtScope.referrals,
          districtScope.services,
        ),
      });
    }
  }

  // ---- State level, rolled up from districts ---------------------------------------
  const stateMetrics: StateMetrics[] = PERIODS.map((period) => {
    const districtRows = districtMetrics.filter((d) => d.period === period);
    const summed = sumRows(districtRows);
    const periodReferrals = input.referrals.filter((r) => periodOf(r.submittedAt) === period);

    return {
      period,
      totals: {
        period,
        ...summed,
        medianDaysToAssignment: medianDays(
          periodReferrals.map(daysToAssignment).filter((n): n is number => n !== null),
        ),
        medianDaysToFirstService: medianDays(
          periodReferrals.map(daysToFirstService).filter((n): n is number => n !== null),
        ),
        employmentOutcomeRate: rateFrom(periodReferrals, cieReferralIds),
        zeroReferralQuarter: false,
        unassignedOver14Days: districtRows.reduce((n, d) => n + d.unassignedOver14Days, 0),
      },
      divisionsWithZeroReferrals: divisionMetrics.filter(
        (d) => d.period === period && d.zeroReferralQuarter,
      ).length,
      localitiesWithoutVendorCoverage: input.localitiesWithoutCoverage,
      unassignedOver14Days: districtRows.reduce((n, d) => n + d.unassignedOver14Days, 0),
      federalAwardIllustrative: FEDERAL_AWARD_ILLUSTRATIVE,
      reserveRequirement: Math.round(FEDERAL_AWARD_ILLUSTRATIVE * RESERVE_RATE),
      ...reserveFor(period, input.services),
      wioaIndicators: wioaFor(period, input.outcomes, input.referrals, input.services),
    };
  });

  return { divisionMetrics, districtMetrics, stateMetrics };
}

function push(map: Map<string, number[]>, key: string, value: number): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

type Additive = Pick<
  DivisionMetrics,
  | 'referralsSubmitted'
  | 'referralsAccepted'
  | 'referralsAssigned'
  | 'referralsInService'
  | 'referralsCompleted'
  | 'referralsClosedNotServed'
  | 'planTypeMix'
  | 'diplomaTrackMix'
  | 'activityMix'
>;

/** Adds the additive measures across rows. Mixes are counts, so they add too. */
function sumRows(rows: Additive[]): Additive {
  const out: Additive = {
    referralsSubmitted: 0,
    referralsAccepted: 0,
    referralsAssigned: 0,
    referralsInService: 0,
    referralsCompleted: 0,
    referralsClosedNotServed: 0,
    planTypeMix: zeros(PLAN_TYPES),
    diplomaTrackMix: zeros(DIPLOMA_TRACKS),
    activityMix: zeros(PRE_ETS_ACTIVITIES),
  };

  for (const row of rows) {
    out.referralsSubmitted += row.referralsSubmitted;
    out.referralsAccepted += row.referralsAccepted;
    out.referralsAssigned += row.referralsAssigned;
    out.referralsInService += row.referralsInService;
    out.referralsCompleted += row.referralsCompleted;
    out.referralsClosedNotServed += row.referralsClosedNotServed;
    for (const k of PLAN_TYPES) out.planTypeMix[k as PlanType] += row.planTypeMix[k as PlanType];
    for (const k of DIPLOMA_TRACKS) {
      out.diplomaTrackMix[k as DiplomaTrack] += row.diplomaTrackMix[k as DiplomaTrack];
    }
    for (const k of PRE_ETS_ACTIVITIES) {
      out.activityMix[k as PreEtsActivity] += row.activityMix[k as PreEtsActivity];
    }
  }

  return out;
}

function rateFrom(referrals: StoredReferral[], employedIds: Set<string>): number | null {
  const completed = referrals.filter((r) => r.status === 'COMPLETED');
  if (completed.length === 0) return null;
  return completed.filter((r) => employedIds.has(r.id)).length / completed.length;
}

/**
 * Reserve spend for a period, measured against the federal fiscal year (Oct 1 – Sep 30)
 * that the period ends in, and straight-lined to a year-end projection.
 */
function reserveFor(
  period: string,
  services: ServiceRecord[],
): { reserveSpentToDate: number; reserveProjectedYearEnd: number } {
  const { end } = periodRange(period);
  const asOf = Math.min(end.getTime(), REFERENCE_DATE.getTime());

  const fyStartYear = new Date(asOf).getUTCMonth() >= 9
    ? new Date(asOf).getUTCFullYear()
    : new Date(asOf).getUTCFullYear() - 1;
  const fyStart = Date.UTC(fyStartYear, 9, 1);
  const fyEnd = Date.UTC(fyStartYear + 1, 8, 30, 23, 59, 59);

  let spent = 0;
  for (const service of services) {
    const t = Date.parse(service.serviceDate);
    if (t >= fyStart && t <= asOf) spent += serviceCost(service);
  }

  const elapsed = Math.max(0.08, (asOf - fyStart) / (fyEnd - fyStart));
  return {
    reserveSpentToDate: Math.round(spent),
    reserveProjectedYearEnd: Math.round(spent / elapsed),
  };
}

/**
 * WIOA §116 primary indicators, computed on a trailing four-quarter window so small
 * quarterly counts do not make the trend line jump around.
 *
 * Two indicators use documented proxies because the demonstration dataset has no exit
 * quarters: measurable skill gains is "students with three or more distinct Pre-ETS
 * activities delivered", and effectiveness in serving employers is the federal repeat-
 * business-customer definition applied to synthetic employers.
 */
function wioaFor(
  period: string,
  outcomes: OutcomeRecord[],
  referrals: StoredReferral[],
  services: ServiceRecord[],
): WioaIndicators {
  const index = PERIODS.indexOf(period as (typeof PERIODS)[number]);
  const window = new Set(PERIODS.slice(Math.max(0, index - 3), index + 1) as string[]);

  const inWindow = outcomes.filter((o) => {
    const p = periodOf(o.recordedAt);
    return p !== null && window.has(p);
  });

  const total = inWindow.length;
  const employed = inWindow.filter((o) => o.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT');
  const retained = employed.filter((o) => o.retained90Days === true);
  const credential = inWindow.filter((o) => o.type === 'CREDENTIAL_ATTAINED');

  const quarterlyEarnings = employed
    .map((o) => (o.hourlyWage ?? 0) * (o.hoursPerWeek ?? 0) * 13)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  const completedInWindow = new Set(
    referrals
      .filter((r) => {
        const p = r.completedAt ? periodOf(r.completedAt) : null;
        return p !== null && window.has(p);
      })
      .map((r) => r.id),
  );
  const distinctActivities = new Map<string, Set<string>>();
  for (const service of services) {
    if (!completedInWindow.has(service.referralId)) continue;
    const set = distinctActivities.get(service.referralId) ?? new Set<string>();
    set.add(service.activity);
    distinctActivities.set(service.referralId, set);
  }
  const withGains = [...distinctActivities.values()].filter((s) => s.size >= 3).length;

  const employersSeen = new Map<string, number>();
  for (const outcome of employed) {
    if (!outcome.employerNameSynthetic) continue;
    employersSeen.set(
      outcome.employerNameSynthetic,
      (employersSeen.get(outcome.employerNameSynthetic) ?? 0) + 1,
    );
  }
  const repeatEmployers = [...employersSeen.values()].filter((n) => n >= 2).length;

  const safeRate = (numerator: number, denominator: number) =>
    denominator === 0 ? 0 : numerator / denominator;

  return {
    employmentRateQ2: safeRate(employed.length, total),
    employmentRateQ4: safeRate(retained.length, total),
    medianEarningsQ2:
      quarterlyEarnings.length === 0
        ? 0
        : Math.round(quarterlyEarnings[Math.floor(quarterlyEarnings.length / 2)] as number),
    credentialAttainmentRate: safeRate(credential.length, total),
    measurableSkillGains: safeRate(withGains, completedInWindow.size),
    effectivenessServingEmployers: safeRate(repeatEmployers, employersSeen.size),
  };
}

export { FEDERAL_FY_START };
