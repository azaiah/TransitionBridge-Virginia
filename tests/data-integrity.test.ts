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
  PACKED_AUTHORIZATION_KEYS,
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
import { buildTransitionId, looksLikeTransitionId } from '../src/lib/identity';
import { sumAuthorizations } from '../src/lib/funding';
import { recordScope } from '../src/lib/access';
import { DEMO_NOW_MS } from '../src/lib/demo-clock';
import {
  ESCALATION_TIERS,
  STALL_STAGES,
  countEscalations,
  tierTotal,
} from '../src/lib/escalation';

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
      ...bundle.employers.map((e) => e.name),
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
      ...bundle.authorizations.map((a) => a.id),
      ...bundle.employers.map((e) => e.id),
      ...bundle.postings.map((p) => p.id),
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
    expect(of(packRows(rebuilt.authorizations, PACKED_AUTHORIZATION_KEYS))).toBe(
      committed('authorizations.json'),
    );
    expect(of({ employers: rebuilt.employers, postings: rebuilt.postings })).toBe(
      committed('employers.json'),
    );
    expect(of(rebuilt.auditHistory)).toBe(committed('audit-history.json'));
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

/* ==========================================================================
   The IEP Partners feedback layer (docs/12_IEP_FEEDBACK_UPGRADES.md):
   Transition IDs, funding, early warnings, employers.
   ========================================================================== */

describe('Transition IDs', () => {
  it('gives every student a unique, well-formed Transition ID', () => {
    const schoolName = new Map(bundle.schools.map((s) => [s.id, s.name]));
    const ids = bundle.students.map((s) => buildTransitionId(schoolName.get(s.schoolId) ?? '', s.id));
    expect(ids.every(looksLikeTransitionId)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('funding reconciles', () => {
  const funding = bundle.funding;
  const measures = ['authorizations', 'dollarsAuthorized', 'dollarsUsed', 'nearLimit', 'overAuthorized'] as const;

  it('adds up by funder and by district to the statewide totals', () => {
    for (const measure of measures) {
      const bySource = funding.bySource.reduce((n, s) => n + s[measure], 0);
      const byDistrict = funding.byDistrict.reduce((n, d) => n + d[measure], 0);
      // Dollars are rounded per group, so allow a dollar of rounding per group.
      const slack = measure.startsWith('dollars') ? funding.byDistrict.length : 0;
      expect(Math.abs(bySource - funding.totals[measure]), `bySource ${measure}`).toBeLessThanOrEqual(slack);
      expect(Math.abs(byDistrict - funding.totals[measure]), `byDistrict ${measure}`).toBeLessThanOrEqual(slack);
    }
  });

  it('matches the shipped authorizations', () => {
    const totals = sumAuthorizations(bundle.authorizations);
    expect(totals.authorizations).toBe(funding.totals.authorizations);
    expect(totals.nearLimit).toBe(funding.totals.nearLimit);
    expect(totals.overAuthorized).toBe(funding.totals.overAuthorized);
    expect(Math.abs(totals.dollarsUsed - funding.totals.dollarsUsed)).toBeLessThanOrEqual(1);
  });

  it('ties DARS dollars used to the 15% reserve spent to date', () => {
    const dars = funding.bySource.find((s) => s.source === 'DARS')!;
    const reserve = bundle.stateMetrics.find((s) => s.period === bundle.currentPeriod)!;
    expect(dars.dollarsUsed).toBe(reserve.reserveSpentToDate);
  });

  it('attaches every authorization to a real referral and student', () => {
    const referralIds = new Set(bundle.referrals.map((r) => r.id));
    const orphan = bundle.authorizations.find((a) => !referralIds.has(a.referralId) || a.studentId === '');
    expect(orphan).toBeUndefined();
  });

  it('never authorizes a negative amount', () => {
    const bad = bundle.authorizations.find(
      (a) => a.hoursAuthorized <= 0 || a.minutesUsed < 0 || a.dollarsAuthorized <= 0 || a.dollarsUsed < 0,
    );
    expect(bad).toBeUndefined();
  });
});

describe('early warnings agree with the referrals', () => {
  it('matches a row-by-row recount statewide', () => {
    expect(bundle.escalations.state).toEqual(countEscalations(bundle.referrals));
  });

  it('adds up by district to the statewide count', () => {
    for (const stage of STALL_STAGES) {
      for (const tier of ESCALATION_TIERS) {
        const summed = bundle.escalations.byDistrict.reduce((n, d) => n + d.counts[stage][tier], 0);
        expect(summed, `${stage} ${tier}`).toBe(bundle.escalations.state[stage][tier]);
      }
    }
  });

  it('makes "waiting for a provider" equal "unassigned more than 14 days", exactly', () => {
    const current = bundle.stateMetrics.find((s) => s.period === bundle.currentPeriod)!;
    const provider = bundle.escalations.state.WAITING_FOR_PROVIDER;
    expect(provider[14] + provider[30] + provider[90]).toBe(current.totals.unassignedOver14Days);
    for (const d of bundle.escalations.byDistrict) {
      const live = bundle.referrals.filter((r) => r.darsDistrictId === d.darsDistrictId && isStale(r)).length;
      const c = d.counts.WAITING_FOR_PROVIDER;
      expect(c[14] + c[30] + c[90], d.darsDistrictId).toBe(live);
    }
  });

  it('has something on every rung, so the demonstration has a story to tell', () => {
    for (const tier of ESCALATION_TIERS) {
      expect(tierTotal(bundle.escalations.state, tier), `tier ${tier}`).toBeGreaterThan(0);
    }
  });
});

describe('employers and postings', () => {
  it('attaches every posting to a real employer in a real district', () => {
    const employerIds = new Set(bundle.employers.map((e) => e.id));
    const districtIds = new Set(bundle.districts.map((d) => d.id));
    expect(bundle.postings.find((p) => !employerIds.has(p.employerId))).toBeUndefined();
    expect(bundle.employers.find((e) => !districtIds.has(e.darsDistrictId))).toBeUndefined();
  });

  it('gives every district employer partners to match against', () => {
    for (const district of bundle.districts) {
      expect(bundle.employers.some((e) => e.darsDistrictId === district.id), district.id).toBe(true);
    }
  });

  it('never posts a wage below the Virginia minimum wage', () => {
    // Illustrative wages must still be plausible: Virginia's minimum wage is $12.77 an
    // hour from January 1, 2026. Raise this floor if the state minimum changes.
    expect(Math.min(...bundle.postings.map((p) => p.hourlyWage))).toBeGreaterThanOrEqual(12.77);
  });
});

describe('headline numbers tie to the lists behind them', () => {
  it('makes the statewide "unassigned past 14 days" headline equal the district totals', () => {
    const current = bundle.stateMetrics.find((s) => s.period === bundle.currentPeriod)!;
    const headline = bundle.headlines.find((h) => h.period === bundle.currentPeriod)!;
    expect(headline.unassignedOver14Days).toBe(current.totals.unassignedOver14Days);
    expect(headline.unassignedOver14Days).toBe(bundle.referrals.filter((r) => isStale(r)).length);
  });
});

describe('students known to a school but not yet referred', () => {
  const referredIds = new Set(bundle.referrals.map((r) => r.studentId));
  const unreferred = bundle.students.filter((s) => !referredIds.has(s.id));

  it('gives every school division at least two, so school work lists are never empty', () => {
    for (const division of bundle.divisions) {
      const count = unreferred.filter((s) => s.divisionId === division.id).length;
      expect(count, division.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps them consistent with having no referral', () => {
    for (const s of unreferred) {
      expect(s.consentOnFile, s.id).toBe(false);
      expect(s.preEtsStartDate, s.id).toBeNull();
      expect(s.age, s.id).toBeGreaterThanOrEqual(14);
      expect(s.age, s.id).toBeLessThanOrEqual(21);
    }
  });

  it('includes some approaching age-out and some missing documentation', () => {
    expect(unreferred.some((s) => s.age >= 20)).toBe(true);
    expect(unreferred.some((s) => !s.disabilityDocumented)).toBe(true);
  });
});

describe('access log history obeys the access rules', () => {
  const history = bundle.auditHistory;
  const studentById = new Map(bundle.students.map((s) => [s.id, s]));
  const personaById = new Map(bundle.personas.map((p) => [p.id, p]));
  const referralsByStudent = new Map<string, typeof bundle.referrals>();
  for (const r of bundle.referrals) {
    const list = referralsByStudent.get(r.studentId) ?? [];
    list.push(r);
    referralsByStudent.set(r.studentId, list);
  }
  const scopeOf = (e: (typeof history)[number]) =>
    recordScope(
      e.actorRole,
      personaById.get(e.actorPersonaId),
      studentById.get(e.studentId!)!,
      referralsByStudent.get(e.studentId!) ?? [],
    ).inScope;

  it('has enough entries to demonstrate with', () => {
    expect(history.length).toBeGreaterThanOrEqual(150);
  });

  it('uses unique demonstration ids, real people, and real students', () => {
    expect(new Set(history.map((e) => e.id)).size).toBe(history.length);
    for (const e of history) {
      expect(e.id.startsWith('DEMO-'), e.id).toBe(true);
      const persona = personaById.get(e.actorPersonaId);
      expect(persona, e.id).toBeDefined();
      expect(persona!.role, e.id).toBe(e.actorRole);
      if (e.studentId) expect(studentById.has(e.studentId), e.id).toBe(true);
    }
  });

  it('never dates an entry after the demonstration date', () => {
    for (const e of history) {
      const at = Date.parse(e.at);
      expect(Number.isNaN(at), e.id).toBe(false);
      expect(at, e.id).toBeLessThanOrEqual(DEMO_NOW_MS);
    }
  });

  it('shows names only to school and DARS staff, in scope, with a reason', () => {
    const names = history.filter((e) => e.action === 'NAME_VIEWED');
    expect(names.length).toBeGreaterThan(0);
    for (const e of names) {
      expect(['school_coordinator', 'dars_counselor'], e.id).toContain(e.actorRole);
      expect(e.reason, e.id).toBeTruthy();
      expect(scopeOf(e), e.id).toBe(true);
    }
  });

  it('opens records only in scope, and refuses only out of scope', () => {
    for (const e of history) {
      if (!e.studentId) continue;
      if (e.action === 'RECORD_REFUSED') expect(scopeOf(e), e.id).toBe(false);
      if (e.action === 'RECORD_OPENED') expect(scopeOf(e), e.id).toBe(true);
    }
  });

  it('refuses student-list downloads and over-limit services only for providers', () => {
    for (const e of history) {
      if (e.action === 'EXPORT_REFUSED' || e.action === 'SERVICE_REFUSED' || e.action === 'SERVICE_LOGGED') {
        expect(e.actorRole, e.id).toBe('vendor');
      }
      if (e.action === 'AUTHORIZATION_EXTENDED') expect(e.actorRole, e.id).toBe('dars_counselor');
    }
  });
});
