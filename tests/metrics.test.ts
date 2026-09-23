/**
 * Unit tests for the derived metrics. Every expected value here is hand-checked, not
 * copied from a run — a test that agrees with whatever the code did proves nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  ageDays,
  completionRate,
  coverageGap,
  daysToAssignment,
  daysToFirstService,
  fillRate,
  isOpen,
  isStale,
  median,
  medianDays,
  projectYearEnd,
  reportableRate,
  reserveShortfall,
  reserveUtilization,
  round,
  toShares,
} from '../src/lib/metrics';
import { buildTimeline, offerLeadHours } from '../src/lib/timeline';
import { DEMO_NOW_MS } from '../src/lib/demo-clock';
import type { StoredReferral } from '../src/data/types';

/** A referral submitted 20 days before the fixed demonstration "now". */
function referral(overrides: Partial<StoredReferral> = {}): StoredReferral {
  return {
    id: 'DEMO-REF-TEST-000001',
    studentId: 'DEMO-STU-000001',
    divisionId: 'test-public-schools',
    schoolId: 'DEMO-SCH-00001',
    darsDistrictId: 'capital',
    localityFips: '51760',
    submittedAt: '2026-06-10T12:00:00.000Z',
    submittedByPersonaId: 'DEMO-PER-SCHOOL-001',
    requestedActivities: ['job_exploration_counseling'],
    planType: 'IEP',
    gradeLevel: 11,
    diplomaTrack: 'STANDARD',
    transportationBarrier: false,
    status: 'READY_TO_ASSIGN',
    statusChangedAt: '2026-06-13T12:00:00.000Z',
    reviewedAt: '2026-06-13T12:00:00.000Z',
    reviewedByPersonaId: 'DEMO-PER-DARS-001',
    offeredVendorIds: [],
    assignedVendorId: null,
    assignedAt: null,
    firstServiceAt: null,
    completedAt: null,
    closedAt: null,
    declineReason: null,
    ...overrides,
  };
}

describe('ageDays', () => {
  it('counts whole days from submission to the fixed reference date', () => {
    // Reference date is 2026-06-30T17:00Z; submitted 2026-06-10T12:00Z.
    // That is 20 days and 5 hours = 20.208333 days.
    expect(round(ageDays(referral()), 4)).toBe(20.2083);
  });

  it('accepts an explicit instant', () => {
    const at = Date.parse('2026-06-17T12:00:00.000Z');
    expect(ageDays(referral(), at)).toBe(7);
  });
});

describe('daysToAssignment', () => {
  it('is null while the referral is still waiting', () => {
    expect(daysToAssignment(referral())).toBeNull();
  });

  it('measures submission to assignment, not review to assignment', () => {
    const r = referral({ assignedAt: '2026-06-19T12:00:00.000Z' });
    expect(daysToAssignment(r)).toBe(9);
  });
});

describe('daysToFirstService', () => {
  it('measures submission to the first delivered service', () => {
    const r = referral({ firstServiceAt: '2026-06-25T00:00:00.000Z' });
    expect(daysToFirstService(r)).toBe(14.5);
  });
});

describe('isStale', () => {
  it('flags a referral waiting more than 14 days', () => {
    expect(isStale(referral())).toBe(true);
  });

  it('does not flag one that is only 10 days old', () => {
    expect(isStale(referral({ submittedAt: '2026-06-21T12:00:00.000Z' }))).toBe(false);
  });

  it('does not flag an assigned referral, however old', () => {
    expect(isStale(referral({ status: 'ASSIGNED', submittedAt: '2025-01-01T00:00:00.000Z' }))).toBe(
      false,
    );
  });

  it('does not flag one awaiting consent, because nobody is blocking it', () => {
    expect(isStale(referral({ status: 'AWAITING_CONSENT' }))).toBe(false);
  });

  it('treats exactly 14 days as not yet stale', () => {
    const at = DEMO_NOW_MS;
    const submittedAt = new Date(at - 14 * 86_400_000).toISOString();
    expect(isStale(referral({ submittedAt }), at)).toBe(false);
  });
});

describe('isOpen', () => {
  it('closes only on completion or closure', () => {
    expect(isOpen('NEW')).toBe(true);
    expect(isOpen('IN_SERVICE')).toBe(true);
    expect(isOpen('COMPLETED')).toBe(false);
    expect(isOpen('CLOSED_NOT_SERVED')).toBe(false);
  });
});

describe('fillRate and completionRate', () => {
  it('divides, and returns null rather than dividing by zero', () => {
    expect(fillRate(180, 240)).toBe(0.75);
    expect(fillRate(0, 0)).toBeNull();
    expect(completionRate(45, 180)).toBe(0.25);
    expect(completionRate(3, 0)).toBeNull();
  });
});

describe('reportableRate', () => {
  it('passes a rate through once enough cases sit behind it', () => {
    // 10 is the minimum sample, so a rate measured over exactly 10 cases is reportable.
    expect(reportableRate(0.34, 10)).toBe(0.34);
    expect(reportableRate(0.34, 4200)).toBe(0.34);
  });

  it('withholds a rate built on too few cases', () => {
    // 1 of 1 employed is arithmetically 100% and substantively meaningless.
    expect(reportableRate(1, 1)).toBeNull();
    expect(reportableRate(0, 9)).toBeNull();
  });

  it('stays null when there was no rate to begin with', () => {
    expect(reportableRate(null, 5000)).toBeNull();
  });

  it('withholds a genuine zero measured over too few cases', () => {
    // The distinction that matters: "nobody of 3 found work" is not "a 0% employment rate".
    expect(reportableRate(0, 3)).toBeNull();
    expect(reportableRate(0, 40)).toBe(0);
  });
});

describe('coverageGap', () => {
  it('is 0 when capacity matches or exceeds demand', () => {
    expect(coverageGap(50, 50)).toBe(0);
    expect(coverageGap(50, 90)).toBe(0);
  });

  it('is 100 when there is demand and no capacity at all', () => {
    expect(coverageGap(50, 0)).toBe(100);
  });

  it('is 0 when there is no demand to meet', () => {
    expect(coverageGap(0, 0)).toBe(0);
  });

  it('scales linearly in between', () => {
    // capacity is a quarter of demand, so three quarters of the need is unmet.
    expect(coverageGap(100, 25)).toBe(75);
    expect(coverageGap(80, 60)).toBe(25);
  });
});

describe('reserve tracking', () => {
  it('measures spend against the requirement, not the whole award', () => {
    // $7.5M spent against a $10M requirement is three quarters of the way there.
    expect(reserveUtilization(7_500_000, 10_000_000)).toBe(0.75);
    expect(reserveUtilization(10_000_000, 10_000_000)).toBe(1);
  });

  it('returns null rather than dividing by a zero requirement', () => {
    expect(reserveUtilization(500, 0)).toBeNull();
  });

  it('projects year end by straight-lining the pace so far', () => {
    // Three quarters of the year gone with $6M spent projects to $8M.
    expect(projectYearEnd(6_000_000, 0.75)).toBe(8_000_000);
    // A full year elapsed projects to exactly what was spent.
    expect(projectYearEnd(6_000_000, 1)).toBe(6_000_000);
  });

  it('never projects from a year that has not started', () => {
    expect(projectYearEnd(1_000, 0)).toBe(0);
  });

  it('reports the gap only when the projection falls short', () => {
    expect(reserveShortfall(9_200_000, 10_500_000)).toBe(1_300_000);
    expect(reserveShortfall(11_000_000, 10_500_000)).toBe(0);
  });
});

describe('median and medianDays', () => {
  it('averages the middle pair for an even count', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('takes the middle value for an odd count', () => {
    expect(median([9, 1, 5])).toBe(5);
  });

  it('returns null for an empty list', () => {
    expect(median([])).toBeNull();
    expect(medianDays([])).toBeNull();
  });

  it('rounds days to whole numbers', () => {
    expect(medianDays([10.4, 10.4, 21.9])).toBe(10);
    expect(medianDays([2, 3])).toBe(3); // 2.5 rounds to 3
  });
});

describe('toShares', () => {
  it('normalises counts to shares that sum to one', () => {
    expect(toShares({ a: 3, b: 1 })).toEqual({ a: 0.75, b: 0.25 });
  });

  it('returns zeros rather than NaN for an all-zero input', () => {
    expect(toShares({ a: 0, b: 0 })).toEqual({ a: 0, b: 0 });
  });
});

describe('offerLeadHours', () => {
  it('is stable for a given referral id', () => {
    expect(offerLeadHours('DEMO-REF-2026-000123')).toBe(
      offerLeadHours('DEMO-REF-2026-000123'),
    );
  });

  it('always falls inside a plausible response window', () => {
    for (let i = 0; i < 500; i++) {
      const hours = offerLeadHours(`DEMO-REF-2026-${String(i).padStart(6, '0')}`);
      expect(hours).toBeGreaterThanOrEqual(3);
      expect(hours).toBeLessThanOrEqual(96);
    }
  });
});

describe('buildTimeline', () => {
  it('starts every case with a submission', () => {
    const events = buildTimeline(referral());
    expect(events[0]?.type).toBe('SUBMITTED');
  });

  it('records the offer before the acceptance', () => {
    const events = buildTimeline(
      referral({
        status: 'IN_SERVICE',
        assignedAt: '2026-06-19T12:00:00.000Z',
        assignedVendorId: 'DEMO-VND-0001',
        offeredVendorIds: ['DEMO-VND-0001'],
        firstServiceAt: '2026-06-26T12:00:00.000Z',
      }),
    );
    const types = events.map((e) => e.type);
    expect(types).toEqual([
      'SUBMITTED',
      'REVIEW_STARTED',
      'MARKED_READY',
      'OFFERED_TO_VENDOR',
      'VENDOR_ACCEPTED',
      'SERVICE_LOGGED',
    ]);
  });

  it('records a decline ahead of the successful offer', () => {
    const events = buildTimeline(
      referral({
        status: 'ASSIGNED',
        assignedAt: '2026-06-25T12:00:00.000Z',
        assignedVendorId: 'DEMO-VND-0002',
        offeredVendorIds: ['DEMO-VND-0001', 'DEMO-VND-0002'],
        declineReason: 'TRANSPORTATION_NOT_FEASIBLE',
      }),
    );
    const types = events.map((e) => e.type);
    expect(types.indexOf('VENDOR_DECLINED')).toBeLessThan(types.indexOf('VENDOR_ACCEPTED'));
    expect(events.find((e) => e.type === 'VENDOR_DECLINED')?.note).toContain(
      'transportation not feasible',
    );
  });

  it('gives every event a unique id', () => {
    const events = buildTimeline(
      referral({
        status: 'COMPLETED',
        assignedAt: '2026-01-19T12:00:00.000Z',
        assignedVendorId: 'DEMO-VND-0001',
        offeredVendorIds: ['DEMO-VND-0001'],
        firstServiceAt: '2026-02-01T12:00:00.000Z',
        completedAt: '2026-06-01T12:00:00.000Z',
      }),
    );
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  });
});
