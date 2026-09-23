/**
 * The nine validation rules from docs/05_DEMO_DATA.md §5. These run on every build and
 * FAIL the build. Rule 1 is the one that saves the presentation: someone will add up the
 * districts.
 */
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildBundle, SEED } from '../scripts/lib/build-bundle';
import { isStale } from '../src/lib/metrics';
import { buildTimeline } from '../src/lib/timeline';
import { REAL_NAME_BLOCKLIST } from '../scripts/lib/reference';
import {
  packRows,
  PACKED_REFERRAL_KEYS,
  PACKED_SERVICE_KEYS,
  PACKED_STUDENT_KEYS,
} from '../src/data/packed';
import {
  DIPLOMA_TRACKS,
  PLAN_TYPES,
  PRE_ETS_ACTIVITIES,
} from '../src/data/types';
import { appRoutes, loadBundle } from './helpers/bundle';

const bundle = loadBundle();
const periods = bundle.periods;

const ADDITIVE = [
  'referralsSubmitted',
  'referralsAccepted',
  'referralsAssigned',
  'referralsInService',
  'referralsCompleted',
  'referralsClosedNotServed',
] as const;

describe('rule 1 — district totals reconcile to the state total', () => {
  for (const period of periods) {
    it(`reconciles ${period}`, () => {
      const districts = bundle.districtMetrics.filter((d) => d.period === period);
      const state = bundle.stateMetrics.find((s) => s.period === period)!;

      for (const measure of ADDITIVE) {
        const summed = districts.reduce((total, d) => total + d[measure], 0);
        expect(summed, `${measure} in ${period}`).toBe(state.totals[measure]);
      }

      expect(districts.reduce((n, d) => n + d.unassignedOver14Days, 0)).toBe(
        state.totals.unassignedOver14Days,
      );

      // The composition mixes are stored as counts, so they add up too.
      for (const key of PLAN_TYPES) {
        const summed = districts.reduce((n, d) => n + d.planTypeMix[key], 0);
        expect(summed, `planTypeMix.${key}`).toBe(state.totals.planTypeMix[key]);
      }
      for (const key of DIPLOMA_TRACKS) {
        const summed = districts.reduce((n, d) => n + d.diplomaTrackMix[key], 0);
        expect(summed, `diplomaTrackMix.${key}`).toBe(state.totals.diplomaTrackMix[key]);
      }
      for (const key of PRE_ETS_ACTIVITIES) {
        const summed = districts.reduce((n, d) => n + d.activityMix[key], 0);
        expect(summed, `activityMix.${key}`).toBe(state.totals.activityMix[key]);
      }
    });
  }
});

describe('rule 2 — division totals reconcile to their district', () => {
  const districtOf = new Map(bundle.divisions.map((d) => [d.id, d.darsDistrictId]));

  for (const period of periods) {
    it(`reconciles ${period}`, () => {
      for (const district of bundle.districtMetrics.filter((d) => d.period === period)) {
        const members = bundle.divisionMetrics.filter(
          (d) => d.period === period && districtOf.get(d.divisionId) === district.darsDistrictId,
        );

        for (const measure of ADDITIVE) {
          const summed = members.reduce((total, d) => total + d[measure], 0);
          expect(summed, `${measure} in ${district.darsDistrictId} ${period}`).toBe(
            district[measure],
          );
        }
        expect(members.length).toBe(district.divisionCount);
      }
    });
  }
});

describe('rule 3 — status is consistent with the event timeline', () => {
  it('never shows COMPLETED without a logged service', () => {
    const studentById = new Map(bundle.students.map((s) => [s.id, s]));

    for (const referral of bundle.referrals) {
      const types = new Set(buildTimeline(referral, studentById.get(referral.studentId)).map((e) => e.type));

      if (referral.status === 'COMPLETED') {
        expect(types.has('SERVICE_LOGGED'), referral.id).toBe(true);
        expect(types.has('COMPLETED'), referral.id).toBe(true);
      }
      if (referral.status === 'ASSIGNED' || referral.status === 'IN_SERVICE') {
        expect(types.has('VENDOR_ACCEPTED'), referral.id).toBe(true);
        expect(referral.assignedVendorId, referral.id).not.toBeNull();
      }
      if (referral.status === 'IN_SERVICE') {
        expect(types.has('SERVICE_LOGGED'), referral.id).toBe(true);
      }
      // Nothing is assigned before it has been reviewed.
      if (referral.assignedAt) {
        expect(referral.reviewedAt, referral.id).not.toBeNull();
        expect(Date.parse(referral.assignedAt)).toBeGreaterThan(Date.parse(referral.reviewedAt!));
      }
    }
  });

  it('orders every timeline chronologically', () => {
    for (const referral of bundle.referrals.slice(0, 2000)) {
      const events = buildTimeline(referral);
      for (let i = 1; i < events.length; i++) {
        expect(Date.parse(events[i]!.at)).toBeGreaterThanOrEqual(Date.parse(events[i - 1]!.at));
      }
    }
  });
});

describe('rule 4 — services fall after their referral was assigned', () => {
  it('logs nothing before assignment', () => {
    const referralById = new Map(bundle.referrals.map((r) => [r.id, r]));

    for (const service of bundle.serviceRecords) {
      const referral = referralById.get(service.referralId);
      expect(referral, service.id).toBeDefined();
      expect(referral!.assignedAt, `${service.id} has no assignment`).not.toBeNull();

      // Services are logged against a day, so compare at day granularity.
      const serviceDay = service.serviceDate.slice(0, 10);
      const assignedDay = referral!.assignedAt!.slice(0, 10);
      expect(serviceDay >= assignedDay, `${service.id} on ${serviceDay} vs ${assignedDay}`).toBe(
        true,
      );
    }
  });
});

describe('rule 5 — every student is 14 or older with a valid plan', () => {
  it('respects the statutory age floor', () => {
    for (const student of bundle.students) {
      expect(student.age, student.id).toBeGreaterThanOrEqual(14);
      expect(PLAN_TYPES).toContain(student.planType);
      expect(DIPLOMA_TRACKS).toContain(student.diplomaTrack);
      expect(student.gradeLevel).toBeGreaterThanOrEqual(9);
      expect(student.gradeLevel).toBeLessThanOrEqual(12);
    }
  });
});

describe('rule 6 — every alert links to records that really are in that state', () => {
  const routes = appRoutes();

  it('produces at least one alert', () => {
    expect(bundle.alerts.length).toBeGreaterThan(0);
  });

  for (const alert of bundle.alerts) {
    it(`resolves: ${alert.message}`, () => {
      const url = new URL(alert.linkTo, 'https://demo.invalid');
      expect(routes.has(url.pathname), `${url.pathname} is not a route`).toBe(true);
      expect(alert.ownerPersonaId, 'no alert may sit unowned').not.toBeNull();
      expect(matchingRecordCount(alert.linkTo)).toBeGreaterThan(0);
    });
  }
});

describe('rule 7 — no name collides with a real organisation or official', () => {
  it('keeps every generated name synthetic', () => {
    const names = [
      ...bundle.students.map((s) => s.displayName),
      ...bundle.vendors.map((v) => v.name),
      ...bundle.personas.map((p) => p.displayName),
      ...bundle.outcomes.map((o) => o.employerNameSynthetic ?? ''),
    ];

    for (const blocked of REAL_NAME_BLOCKLIST) {
      const needle = blocked.toLowerCase();
      const hit = names.find((name) => name.toLowerCase().includes(needle));
      expect(hit, `"${hit}" collides with the blocked name "${blocked}"`).toBeUndefined();
    }
  });
});

describe('rule 8 — every generated id is marked as demonstration data', () => {
  it('prefixes ids with DEMO-', () => {
    const ids = [
      ...bundle.students.map((s) => s.id),
      ...bundle.referrals.map((r) => r.id),
      ...bundle.serviceRecords.map((s) => s.id),
      ...bundle.outcomes.map((o) => o.id),
      ...bundle.vendors.map((v) => v.id),
      ...bundle.personas.map((p) => p.id),
      ...bundle.schools.map((s) => s.id),
      ...bundle.alerts.map((a) => a.id),
    ];
    const offender = ids.find((id) => !id.startsWith('DEMO-'));
    expect(offender).toBeUndefined();
  });
});

describe('rule 9 — the same seed produces an identical dataset', () => {
  it('regenerates the committed files byte for byte', { timeout: 60_000 }, () => {
    const rebuilt = buildBundle(SEED);

    const committed = (name: string) =>
      createHash('sha256')
        .update(readFileSync(path.resolve(process.cwd(), `src/data/generated/${name}`), 'utf8'))
        .digest('hex');

    const of = (data: unknown) =>
      createHash('sha256').update(JSON.stringify(data)).digest('hex');

    // Students and referrals are stored packed, so they are packed the same way here
    // before hashing — which also proves the encoder is deterministic.
    expect(of(packRows(rebuilt.students, PACKED_STUDENT_KEYS))).toBe(
      committed('students.json'),
    );
    expect(of(packRows(rebuilt.referrals, PACKED_REFERRAL_KEYS))).toBe(
      committed('referrals.json'),
    );
    expect(of(rebuilt.outcomes)).toBe(committed('outcomes.json'));
    expect(of(packRows(rebuilt.serviceRecords, PACKED_SERVICE_KEYS))).toBe(
      committed('services.json'),
    );
  });
});

describe('deliberate findings hold their target ranges', () => {
  const current = bundle.stateMetrics.find((s) => s.period === bundle.currentPeriod)!;
  const headline = bundle.headlines.find((h) => h.period === bundle.currentPeriod)!;

  it('has 9 to 12 divisions with zero referrals this quarter', () => {
    expect(current.divisionsWithZeroReferrals).toBeGreaterThanOrEqual(9);
    expect(current.divisionsWithZeroReferrals).toBeLessThanOrEqual(12);
  });

  it('has 8 to 12 localities with no approved provider', () => {
    const uncovered = bundle.coverage.filter((c) => c.vendorCount === 0).length;
    expect(uncovered).toBeGreaterThanOrEqual(8);
    expect(uncovered).toBeLessThanOrEqual(12);
    expect(current.localitiesWithoutVendorCoverage).toBe(uncovered);
  });

  it('has 90 to 140 referrals unassigned past 14 days', () => {
    const stale = bundle.referrals.filter((r) => isStale(r)).length;
    expect(stale).toBeGreaterThanOrEqual(90);
    expect(stale).toBeLessThanOrEqual(140);
  });

  it('shows work-based learning well below the other four activities', () => {
    expect(headline.activityMix.work_based_learning).toBeLessThan(0.12);
    expect(headline.activityMix.work_based_learning).toBeGreaterThan(0.05);
  });

  it('shows rural assignment waits materially worse than urban', () => {
    const rural = new Set(bundle.localities.filter((l) => l.isRural).map((l) => l.fips));
    const days = (isRural: boolean) =>
      bundle.referrals
        .filter((r) => rural.has(r.localityFips) === isRural && r.assignedAt)
        .map((r) => (Date.parse(r.assignedAt!) - Date.parse(r.submittedAt)) / 86_400_000)
        .sort((a, b) => a - b);

    const ruralDays = days(true);
    const urbanDays = days(false);
    const medianOf = (list: number[]) => list[Math.floor(list.length / 2)] as number;

    expect(medianOf(ruralDays)).toBeGreaterThan(medianOf(urbanDays) * 1.6);
  });

  it('keeps the transportation barrier measurable rather than anecdotal', () => {
    const { withBarrier, withoutBarrier } = headline.transportBarrierDaysToService;
    expect(withBarrier - withoutBarrier).toBeGreaterThan(5);
  });

  it('distributes decline reasons close to the target mix', () => {
    const declined = bundle.referrals.filter((r) => r.declineReason);
    const share = (reason: string) =>
      declined.filter((r) => r.declineReason === reason).length / declined.length;

    // Transportation at roughly a fifth is the point: it makes the CSNA's transportation
    // finding countable rather than anecdotal.
    expect(share('TRANSPORTATION_NOT_FEASIBLE')).toBeGreaterThan(0.14);
    expect(share('TRANSPORTATION_NOT_FEASIBLE')).toBeLessThan(0.22);
    expect(share('NO_CAPACITY')).toBeGreaterThan(0.3);
    expect(share('OUTSIDE_SERVICE_AREA')).toBeGreaterThan(0.22);
  });

  it('has at least 15 providers carrying more than 85% of stated capacity', () => {
    const strained = bundle.vendors.filter(
      (v) => v.capacityTotal > 0 && v.capacityUsed / v.capacityTotal > 0.85,
    );
    expect(strained.length).toBeGreaterThanOrEqual(15);
  });

  it('keeps mean provider utilization near two thirds', () => {
    const used = bundle.vendors
      .filter((v) => v.capacityTotal > 0)
      .map((v) => v.capacityUsed / v.capacityTotal);
    const mean = used.reduce((a, b) => a + b, 0) / used.length;
    expect(mean).toBeGreaterThan(0.6);
    expect(mean).toBeLessThan(0.76);
  });

  it('records placement quality, not just placement count', () => {
    const placements = bundle.outcomes.filter(
      (o) => o.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT',
    );
    expect(placements.length).toBeGreaterThan(200);
    for (const placement of placements) {
      expect(placement.hourlyWage).not.toBeNull();
      expect(placement.hoursPerWeek).not.toBeNull();
      expect(placement.retained90Days).not.toBeNull();
      expect(placement.employerNameSynthetic).not.toBeNull();
    }
  });

  it('shows Applied Studies outcomes below Standard', () => {
    const rates = headline.outcomeRateByDiplomaTrack;
    expect(rates.APPLIED_STUDIES).not.toBeNull();
    expect(rates.STANDARD).not.toBeNull();
    expect(rates.APPLIED_STUDIES!).toBeLessThan(rates.STANDARD!);
  });
});

/** Counts the records an alert's destination filter actually matches. */
function matchingRecordCount(linkTo: string): number {
  const url = new URL(linkTo, 'https://demo.invalid');
  const q = url.searchParams;

  if (url.pathname === '/dars/queue/') {
    if (q.get('waiting') === 'over14') {
      return bundle.referrals.filter(
        (r) => r.darsDistrictId === q.get('district') && isStale(r),
      ).length;
    }
    if (q.get('filter') === 'transportation-barrier') {
      return bundle.referrals.filter((r) => r.transportationBarrier).length;
    }
    return bundle.referrals.length;
  }

  if (url.pathname === '/state/divisions/') {
    return bundle.divisionMetrics.filter(
      (d) => d.period === q.get('period') && d.zeroReferralQuarter,
    ).length;
  }

  if (url.pathname === '/state/map/') {
    return q.get('filter') === 'no-coverage'
      ? bundle.coverage.filter((c) => c.vendorCount === 0).length
      : bundle.coverage.length;
  }

  if (url.pathname === '/state/vendors/') {
    const vendorId = q.get('vendor');
    return bundle.vendorScorecards.filter((v) => v.vendorId === vendorId).length;
  }

  if (url.pathname === '/state/reserve/') {
    return bundle.reserveRows.filter((r) => r.spend > 0).length;
  }

  if (url.pathname === '/state/') {
    return q.get('metric') === 'activity-mix'
      ? bundle.serviceRecords.filter((s) => s.activity === 'work_based_learning').length
      : bundle.stateMetrics.length;
  }

  return 0;
}
