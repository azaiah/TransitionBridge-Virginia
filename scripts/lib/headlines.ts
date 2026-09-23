/**
 * Ready-to-render statewide headlines, funnels, cross-tabs, and reserve rows.
 *
 * Trend points are genuine point-in-time snapshots reconstructed from each referral's
 * timestamps, not the current number repeated — a sparkline that is not really a time
 * series is the kind of thing an analyst catches.
 */
import type {
  DeclineReason,
  DiplomaTrack,
  FunnelStage,
  OutcomeRecord,
  PreEtsActivity,
  ReserveRow,
  ServiceRecord,
  StateHeadline,
  StateMetrics,
  StoredReferral,
  TrendPoint,
} from '../../src/data/types';
import {
  DECLINE_REASONS,
  DIPLOMA_TRACKS,
  PRE_ETS_ACTIVITIES,
} from '../../src/data/types';
import { daysToFirstService, medianDays, round, toShares } from '../../src/lib/metrics';
import { PERIODS, periodOf, periodRange } from './calendar';
import { serviceCost } from './services';

const MS_PER_DAY = 86_400_000;

/** Was this referral submitted, and still open, at instant `t`? */
function openAt(referral: StoredReferral, t: number): boolean {
  if (Date.parse(referral.submittedAt) > t) return false;
  if (referral.completedAt && Date.parse(referral.completedAt) <= t) return false;
  if (referral.closedAt && Date.parse(referral.closedAt) <= t) return false;
  return true;
}

/** Was this referral waiting, unassigned, more than 14 days at instant `t`? */
function staleAt(referral: StoredReferral, t: number): boolean {
  if (!openAt(referral, t)) return false;
  if (referral.assignedAt && Date.parse(referral.assignedAt) <= t) return false;
  return (t - Date.parse(referral.submittedAt)) / MS_PER_DAY > 14;
}

export type HeadlineInput = {
  referrals: StoredReferral[];
  services: ServiceRecord[];
  outcomes: OutcomeRecord[];
  stateMetrics: StateMetrics[];
};

export function buildHeadlines(input: HeadlineInput): StateHeadline[] {
  const { referrals, services, outcomes, stateMetrics } = input;

  const employedReferralIds = new Set(
    outcomes
      .filter((o) => o.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT')
      .map((o) => o.referralId),
  );

  // Build every trend series once, then hand each headline row the same series.
  const activeTrend: TrendPoint[] = [];
  const staleTrend: TrendPoint[] = [];
  const firstServiceTrend: TrendPoint[] = [];
  const zeroDivisionTrend: TrendPoint[] = [];
  const coverageTrend: TrendPoint[] = [];
  const reserveTrend: TrendPoint[] = [];

  for (const period of PERIODS) {
    const asOf = periodRange(period).end.getTime();
    activeTrend.push({ period, value: referrals.filter((r) => openAt(r, asOf)).length });
    staleTrend.push({ period, value: referrals.filter((r) => staleAt(r, asOf)).length });

    const startedThisPeriod = referrals.filter(
      (r) => r.firstServiceAt && periodOf(r.firstServiceAt) === period,
    );
    firstServiceTrend.push({
      period,
      value:
        medianDays(
          startedThisPeriod.map(daysToFirstService).filter((n): n is number => n !== null),
        ) ?? 0,
    });

    const state = stateMetrics.find((s) => s.period === period);
    zeroDivisionTrend.push({ period, value: state?.divisionsWithZeroReferrals ?? 0 });
    coverageTrend.push({ period, value: state?.localitiesWithoutVendorCoverage ?? 0 });
    reserveTrend.push({
      period,
      value: state
        ? round((state.reserveProjectedYearEnd / state.reserveRequirement) * 100, 1)
        : 0,
    });
  }

  return PERIODS.map((period, i) => {
    const cohort = referrals.filter((r) => periodOf(r.submittedAt) === period);
    const state = stateMetrics.find((s) => s.period === period)!;
    const periodServices = services.filter((s) => periodOf(s.serviceDate) === period);

    const declineCounts = Object.fromEntries(
      DECLINE_REASONS.map((r) => [r, 0]),
    ) as Record<DeclineReason, number>;
    for (const referral of cohort) {
      if (referral.declineReason) declineCounts[referral.declineReason]++;
    }

    const withBarrier = cohort.filter((r) => r.transportationBarrier);
    const withoutBarrier = cohort.filter((r) => !r.transportationBarrier);

    const trackRates = Object.fromEntries(
      DIPLOMA_TRACKS.map((track) => {
        const completed = cohort.filter(
          (r) => r.status === 'COMPLETED' && r.diplomaTrack === track,
        );
        const rate =
          completed.length === 0
            ? null
            : completed.filter((r) => employedReferralIds.has(r.id)).length / completed.length;
        return [track, rate];
      }),
    ) as Record<DiplomaTrack, number | null>;

    return {
      period,
      activeReferrals: activeTrend[i]!.value,
      activeReferralsTrend: activeTrend,
      unassignedOver14Days: staleTrend[i]!.value,
      unassignedOver14DaysTrend: staleTrend,
      medianDaysToFirstService: firstServiceTrend[i]!.value,
      medianDaysToFirstServiceTrend: firstServiceTrend,
      divisionsWithZeroReferrals: state.divisionsWithZeroReferrals,
      divisionsWithZeroReferralsTrend: zeroDivisionTrend,
      localitiesWithoutVendorCoverage: state.localitiesWithoutVendorCoverage,
      localitiesWithoutVendorCoverageTrend: coverageTrend,
      reserveUtilizedPct: reserveTrend[i]!.value,
      reserveUtilizedPctTrend: reserveTrend,
      funnel: buildFunnel(period, cohort, employedReferralIds),
      activityMix: toShares(state.totals.activityMix),
      declineReasonMix: toShares(declineCounts),
      planTypeMix: toShares(state.totals.planTypeMix),
      transportBarrierDaysToService: {
        withBarrier: medianOfService(withBarrier),
        withoutBarrier: medianOfService(withoutBarrier),
      },
      outcomeRateByDiplomaTrack: trackRates,
      inHouseVsVendorServices: {
        inHouse: periodServices.filter((s) => s.deliveredInHouse).length,
        vendor: periodServices.filter((s) => !s.deliveredInHouse).length,
      },
    } satisfies StateHeadline;
  });

  function medianOfService(rows: StoredReferral[]): number {
    return medianDays(rows.map(daysToFirstService).filter((n): n is number => n !== null)) ?? 0;
  }
}

/** The six-stage funnel for one submission cohort. Every stage links to its records. */
function buildFunnel(
  period: string,
  cohort: StoredReferral[],
  employedReferralIds: Set<string>,
): FunnelStage[] {
  const accepted = cohort.filter((r) => r.reviewedAt);
  const assigned = cohort.filter((r) => r.assignedAt);
  const started = cohort.filter((r) => r.firstServiceAt);
  const completed = cohort.filter((r) => r.status === 'COMPLETED');
  const employed = completed.filter((r) => employedReferralIds.has(r.id));

  const gap = (rows: StoredReferral[], from: keyof StoredReferral, to: keyof StoredReferral) =>
    medianDays(
      rows
        .map((r) => {
          const a = r[from];
          const b = r[to];
          if (typeof a !== 'string' || typeof b !== 'string') return null;
          return (Date.parse(b) - Date.parse(a)) / MS_PER_DAY;
        })
        .filter((n): n is number => n !== null),
    );

  const stages: FunnelStage[] = [
    {
      key: 'submitted',
      label: 'Referrals submitted',
      count: cohort.length,
      shareOfPrevious: null,
      medianDaysInStage: gap(accepted, 'submittedAt', 'reviewedAt'),
      linkTo: `/dars/queue/?period=${period}`,
    },
    {
      key: 'accepted',
      label: 'Accepted for service',
      count: accepted.length,
      shareOfPrevious: share(accepted.length, cohort.length),
      medianDaysInStage: gap(assigned, 'reviewedAt', 'assignedAt'),
      linkTo: `/dars/queue/?period=${period}&stage=accepted`,
    },
    {
      key: 'assigned',
      label: 'Assigned to a provider',
      count: assigned.length,
      shareOfPrevious: share(assigned.length, accepted.length),
      medianDaysInStage: gap(started, 'assignedAt', 'firstServiceAt'),
      linkTo: `/dars/queue/?period=${period}&stage=assigned`,
    },
    {
      key: 'started',
      label: 'Services started',
      count: started.length,
      shareOfPrevious: share(started.length, assigned.length),
      medianDaysInStage: gap(completed, 'firstServiceAt', 'completedAt'),
      linkTo: `/dars/queue/?period=${period}&stage=in-service`,
    },
    {
      key: 'completed',
      label: 'Services completed',
      count: completed.length,
      shareOfPrevious: share(completed.length, started.length),
      medianDaysInStage: null,
      linkTo: `/dars/queue/?period=${period}&stage=completed`,
    },
    {
      key: 'employed',
      label: 'Working in a competitive, integrated job',
      count: employed.length,
      shareOfPrevious: share(employed.length, completed.length),
      medianDaysInStage: null,
      linkTo: `/state/outcomes/?period=${period}`,
    },
  ];

  return stages;
}

function share(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

/** Reserve spend, one row per district per period, derived from delivered services. */
export function buildReserveRows(
  districtIds: string[],
  referrals: StoredReferral[],
  services: ServiceRecord[],
): ReserveRow[] {
  const districtByReferral = new Map(referrals.map((r) => [r.id, r.darsDistrictId]));
  const rows: ReserveRow[] = [];

  for (const period of PERIODS) {
    for (const districtId of districtIds) {
      const spendByActivity = Object.fromEntries(
        PRE_ETS_ACTIVITIES.map((a) => [a, 0]),
      ) as Record<PreEtsActivity, number>;
      let spend = 0;

      for (const service of services) {
        if (periodOf(service.serviceDate) !== period) continue;
        if (districtByReferral.get(service.referralId) !== districtId) continue;
        const cost = serviceCost(service);
        spend += cost;
        spendByActivity[service.activity] += cost;
      }

      rows.push({ period, darsDistrictId: districtId, spend, spendByActivity });
    }
  }

  return rows;
}
