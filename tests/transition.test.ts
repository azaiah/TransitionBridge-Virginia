/**
 * Unit tests for the IEP Partners feedback layer: Transition IDs, the 14/30/90-day early
 * warnings, the funding guard, the access rules, the derived record, and the coach marks
 * that explain it. Expected values are worked out by hand in the comments beside them.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  buildTransitionId,
  looksLikeTransitionId,
  roleMayRevealNames,
  schoolCode,
  studentNumber,
} from '../src/lib/identity';
import {
  escalatedTotal,
  escalationFor,
  countEscalations,
  isDormant,
  stallFor,
  tierForDays,
  tierTotal,
} from '../src/lib/escalation';
import {
  authorizationStatus,
  checkNewService,
  formatHours,
  hoursRemaining,
  hoursUtilization,
  sumAuthorizations,
} from '../src/lib/funding';
import {
  canAddDocuments,
  canDownloadDocument,
  canOpenDocument,
  canRevealName,
  exportPolicy,
  recordScope,
  sectionAccess,
} from '../src/lib/access';
import {
  buildDocuments,
  buildReadinessProfile,
  careerInterestFor,
  documentStatus,
  matchEmployers,
  interventionWaiting,
} from '../src/lib/transition-record';
import { buildRecordAuditTrail } from '../src/lib/record-audit';
import {
  COACH_STEPS,
  SCREEN_TOUR_PATHS,
  WHATS_NEW_STEPS,
  screenTourFor,
  whatsNewKey,
} from '../src/lib/coach';
import { DEMO_NOW_MS, MS_PER_DAY } from '../src/lib/demo-clock';
import type { Role, StoredAuthorization } from '../src/data/types';
import { appRoutes, loadBundle } from './helpers/bundle';

const ROLES: Role[] = ['state_leadership', 'dars_counselor', 'school_coordinator', 'vendor'];

function daysAgo(days: number): string {
  return new Date(DEMO_NOW_MS - days * MS_PER_DAY).toISOString();
}

/* ------------------------------------------------------------------ */

describe('Transition IDs', () => {
  it('codes a school by the initials of the words that name it', () => {
    expect(schoolCode('Accomack North Senior High School')).toBe('AN');
    expect(schoolCode('Norfolk High School')).toBe('NO'); // one naming word → first two letters
    expect(schoolCode('High School')).toBe('HS'); // nothing left → a safe fallback
    expect(schoolCode('Blue Ridge Technical Center')).toBe('BR');
  });

  it('carries the six-digit student number from the record id', () => {
    expect(studentNumber('DEMO-STU-004661')).toBe('004661');
    expect(studentNumber('DEMO-STU-12')).toBe('000012');
  });

  it('assembles school, state, and number', () => {
    expect(buildTransitionId('Accomack North Senior High School', 'DEMO-STU-004661')).toBe('AN-VA-004661');
  });

  it('recognises an ID typed into search, and nothing else', () => {
    expect(looksLikeTransitionId('AN-VA-004661')).toBe(true);
    expect(looksLikeTransitionId(' an-va-004661 ')).toBe(true);
    expect(looksLikeTransitionId('AN-MD-004661')).toBe(false);
    expect(looksLikeTransitionId('AN-VA-4661')).toBe(false);
    expect(looksLikeTransitionId('Jordan Smith')).toBe(false);
  });

  it('lets only the school and the DARS counselor ask for a name', () => {
    expect(roleMayRevealNames('school_coordinator')).toBe(true);
    expect(roleMayRevealNames('dars_counselor')).toBe(true);
    expect(roleMayRevealNames('vendor')).toBe(false);
    expect(roleMayRevealNames('state_leadership')).toBe(false);
    expect(roleMayRevealNames(null)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */

describe('early warnings — 14, 30, 90 days', () => {
  it('climbs the ladder strictly past 14, then at 30 and 90', () => {
    expect(tierForDays(14)).toBeNull(); // exactly 14 is not yet late (matches isStale)
    expect(tierForDays(14.01)).toBe(14);
    expect(tierForDays(29.99)).toBe(14);
    expect(tierForDays(30)).toBe(30);
    expect(tierForDays(89.99)).toBe(30);
    expect(tierForDays(90)).toBe(90);
    expect(tierForDays(365)).toBe(90);
  });

  it('measures each stall from the moment its wait began', () => {
    const unassigned = { status: 'NEW' as const, submittedAt: daysAgo(20), assignedAt: null };
    expect(stallFor(unassigned)).toMatchObject({ stage: 'WAITING_FOR_PROVIDER', days: 20 });

    const consent = { status: 'AWAITING_CONSENT' as const, submittedAt: daysAgo(100), assignedAt: null };
    expect(escalationFor(consent)).toMatchObject({ stage: 'WAITING_ON_CONSENT', tier: 90 });

    // Submitted long ago, assigned 40 days ago: the clock runs from assignment → 30-day rung.
    const notStarted = { status: 'ASSIGNED' as const, submittedAt: daysAgo(200), assignedAt: daysAgo(40) };
    expect(escalationFor(notStarted)).toMatchObject({ stage: 'WAITING_TO_START', tier: 30, days: 40 });
  });

  it('does not escalate referrals that are moving or closed', () => {
    for (const status of ['IN_SERVICE', 'COMPLETED', 'CLOSED_NOT_SERVED'] as const) {
      expect(stallFor({ status, submittedAt: daysAgo(200), assignedAt: daysAgo(150) })).toBeNull();
    }
  });

  it('counts a consent or first-session wait of more than a year as dormant', () => {
    const oldConsent = { status: 'AWAITING_CONSENT' as const, submittedAt: daysAgo(400), assignedAt: null };
    expect(escalationFor(oldConsent)).toBeNull();
    expect(isDormant(oldConsent)).toBe(true);
    const oldStart = { status: 'ASSIGNED' as const, submittedAt: daysAgo(600), assignedAt: daysAgo(400) };
    expect(isDormant(oldStart)).toBe(true);
  });

  it('always escalates a referral waiting for a provider, however old', () => {
    const old = { status: 'NEW' as const, submittedAt: daysAgo(400), assignedAt: null };
    expect(escalationFor(old)).toMatchObject({ stage: 'WAITING_FOR_PROVIDER', tier: 90 });
    expect(isDormant(old)).toBe(false);
  });

  it('adds stages at a rung and rungs into a total', () => {
    const counts = countEscalations([
      { status: 'NEW', submittedAt: daysAgo(20), assignedAt: null }, // provider · 14
      { status: 'READY_TO_ASSIGN', submittedAt: daysAgo(45), assignedAt: null }, // provider · 30
      { status: 'AWAITING_CONSENT', submittedAt: daysAgo(16), assignedAt: null }, // consent · 14
      { status: 'ASSIGNED', submittedAt: daysAgo(300), assignedAt: daysAgo(120) }, // start · 90
      { status: 'NEW', submittedAt: daysAgo(3), assignedAt: null }, // on time
      { status: 'AWAITING_CONSENT', submittedAt: daysAgo(500), assignedAt: null }, // dormant
    ]);
    expect(counts.WAITING_FOR_PROVIDER).toEqual({ 14: 1, 30: 1, 90: 0 });
    expect(counts.WAITING_ON_CONSENT).toEqual({ 14: 1, 30: 0, 90: 0 });
    expect(counts.WAITING_TO_START).toEqual({ 14: 0, 30: 0, 90: 1 });
    expect(tierTotal(counts, 14)).toBe(2);
    expect(escalatedTotal(counts)).toBe(4);
  });
});

/* ------------------------------------------------------------------ */

describe('funding — hours, limits, and the over-billing guard', () => {
  // 10 hours authorized, 540 minutes (9 hours) used.
  const nearly = { hoursAuthorized: 10, minutesUsed: 540 };

  it('reports hours used, remaining, and share used', () => {
    expect(hoursRemaining(nearly)).toBe(1);
    expect(hoursUtilization(nearly)).toBeCloseTo(0.9, 10);
    expect(hoursRemaining({ hoursAuthorized: 10, minutesUsed: 660 })).toBe(-1); // 1 hour over
  });

  it('flags near the limit at 90% and over only past 100%', () => {
    expect(authorizationStatus({ hoursAuthorized: 10, minutesUsed: 530 })).toBe('OK'); // 88%
    expect(authorizationStatus(nearly)).toBe('NEAR_LIMIT'); // 90%
    expect(authorizationStatus({ hoursAuthorized: 10, minutesUsed: 600 })).toBe('NEAR_LIMIT'); // exactly 100%
    expect(authorizationStatus({ hoursAuthorized: 10, minutesUsed: 601 })).toBe('OVER');
  });

  it('allows a session that lands exactly on the limit and refuses one past it', () => {
    expect(checkNewService(nearly, 60)).toEqual({ allowed: true, remainingAfter: 0, overBy: 0 });
    // 1 hour left, 90 minutes asked → half an hour over.
    expect(checkNewService(nearly, 90)).toEqual({ allowed: false, remainingAfter: -0.5, overBy: 0.5 });
  });

  it('sums authorizations into a totals row', () => {
    const base = { referralId: 'R', source: 'DARS', service: 'Pre-ETS', startDate: '2025-10-01', endDate: '2026-09-30' } as const;
    const auths: StoredAuthorization[] = [
      { ...base, hoursAuthorized: 10, minutesUsed: 540, dollarsAuthorized: 1000, dollarsUsed: 900 }, // near
      { ...base, hoursAuthorized: 20, minutesUsed: 300, dollarsAuthorized: 2000, dollarsUsed: 500.4 }, // 25%
      { ...base, hoursAuthorized: 4, minutesUsed: 300, dollarsAuthorized: 400, dollarsUsed: 500 }, // over
    ];
    expect(sumAuthorizations(auths)).toEqual({
      authorizations: 3,
      hoursAuthorized: 34,
      hoursUsed: 19, // 540 + 300 + 300 = 1140 minutes
      dollarsAuthorized: 3400,
      dollarsUsed: 1900, // 1900.4 rounded
      nearLimit: 1,
      overAuthorized: 1,
    });
  });

  it('always writes hours with their unit', () => {
    expect(formatHours(1)).toBe('1 hr');
    expect(formatHours(12.46)).toBe('12.5 hrs');
    expect(formatHours(0)).toBe('0 hrs');
    expect(formatHours(-1)).toBe('-1 hr');
  });
});

/* ------------------------------------------------------------------ */

describe('access — each agency sees what its job needs', () => {
  it('keeps funding from the school and the audit trail from school and provider', () => {
    expect(sectionAccess('school_coordinator', 'funding')).toBe('none');
    expect(sectionAccess('school_coordinator', 'audit')).toBe('none');
    expect(sectionAccess('vendor', 'audit')).toBe('none');
    expect(sectionAccess('dars_counselor', 'audit')).toBe('full');
    expect(sectionAccess('state_leadership', 'profile')).toBe('summary');
  });

  it('opens documents only for the roles on their access level', () => {
    expect(canOpenDocument('state_leadership', 'ALL_TEAM')).toBe(false); // state never opens content
    expect(canOpenDocument('vendor', 'SCHOOL_DARS')).toBe(false);
    expect(canOpenDocument('school_coordinator', 'DARS_PROVIDER')).toBe(false);
    expect(canOpenDocument('dars_counselor', 'DARS_ONLY')).toBe(true);
    for (const role of ROLES) {
      if (role !== 'state_leadership') expect(canOpenDocument(role, 'ALL_TEAM')).toBe(true);
    }
  });

  it('lets only DARS keep a downloaded copy, and only of what it may open', () => {
    expect(canDownloadDocument('dars_counselor', 'DARS_ONLY')).toBe(true);
    expect(canDownloadDocument('school_coordinator', 'ALL_TEAM')).toBe(false);
    expect(canDownloadDocument('vendor', 'DARS_PROVIDER')).toBe(false);
    expect(canAddDocuments('state_leadership')).toBe(false);
    expect(canAddDocuments('vendor')).toBe(true);
  });

  it('refuses student-list downloads to providers but never totals', () => {
    expect(exportPolicy('vendor', 'records').allowed).toBe(false);
    expect(exportPolicy('vendor', 'aggregate').allowed).toBe(true);
    expect(exportPolicy('state_leadership', 'records').allowed).toBe(true);
    expect(exportPolicy(null, 'aggregate').allowed).toBe(false);
  });

  it('opens a record only inside the viewer’s own caseload', () => {
    const student = { divisionId: 'div-a' };
    const refs = [{ darsDistrictId: 'capital', assignedVendorId: 'DEMO-VEN-0001', offeredVendorIds: ['DEMO-VEN-0002'] }];
    expect(recordScope('school_coordinator', { scopeId: 'div-a' }, student, refs).inScope).toBe(true);
    expect(recordScope('school_coordinator', { scopeId: 'div-b' }, student, refs).inScope).toBe(false);
    expect(recordScope('dars_counselor', { scopeId: 'capital' }, student, refs).inScope).toBe(true);
    expect(recordScope('dars_counselor', { scopeId: 'valley' }, student, refs).inScope).toBe(false);
    expect(recordScope('vendor', { scopeId: 'DEMO-VEN-0002' }, student, refs).inScope).toBe(true); // offered
    expect(recordScope('vendor', { scopeId: 'DEMO-VEN-0009' }, student, refs).inScope).toBe(false);
    expect(recordScope('vendor', undefined, student, refs).inScope).toBe(false);
    expect(recordScope('state_leadership', undefined, student, refs).inScope).toBe(true);
  });

  it('shows a name only to the student’s own school or counselor', () => {
    expect(canRevealName('dars_counselor', true)).toBe(true);
    expect(canRevealName('dars_counselor', false)).toBe(false);
    expect(canRevealName('vendor', true)).toBe(false);
    expect(canRevealName('state_leadership', true)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */

describe('the derived transition record', () => {
  const bundle = loadBundle();
  const servicesByStudent = new Map<string, typeof bundle.serviceRecords>();
  for (const s of bundle.serviceRecords) {
    const list = servicesByStudent.get(s.studentId) ?? [];
    list.push(s);
    servicesByStudent.set(s.studentId, list);
  }
  const referralsByStudent = new Map<string, typeof bundle.referrals>();
  for (const r of bundle.referrals) {
    const list = referralsByStudent.get(r.studentId) ?? [];
    list.push(r);
    referralsByStudent.set(r.studentId, list);
  }
  const sample = bundle.students.filter((_, i) => i % 97 === 0);

  it('is identical every time it is derived', () => {
    for (const student of sample) {
      const services = servicesByStudent.get(student.id) ?? [];
      const outcomes = bundle.outcomes.filter((o) => o.studentId === student.id);
      const refs0 = referralsByStudent.get(student.id) ?? [];
      const a = buildReadinessProfile(student, services, outcomes, refs0);
      const b = buildReadinessProfile(student, services, outcomes, refs0);
      expect(a).toEqual(b);
      expect(a.careerInterest).toBe(careerInterestFor(student.id));
      const refs = referralsByStudent.get(student.id) ?? [];
      expect(buildDocuments(student, refs, services, a)).toEqual(buildDocuments(student, refs, services, a));
    }
  });

  it('covers all five readiness areas for every student', () => {
    for (const student of sample) {
      const profile = buildReadinessProfile(student, servicesByStudent.get(student.id) ?? [], [], referralsByStudent.get(student.id) ?? []);
      expect(profile.items.map((i) => i.area)).toEqual([
        'WORKPLACE_READINESS',
        'TRANSPORTATION',
        'COMMUNICATION',
        'INDEPENDENT_LIVING',
        'POSTSECONDARY',
      ]);
    }
  });

  it('never dates a document or audit entry after the demonstration “now”', () => {
    for (const student of sample) {
      const services = servicesByStudent.get(student.id) ?? [];
      const refs = referralsByStudent.get(student.id) ?? [];
      const profile = buildReadinessProfile(student, services, [], refs);
      const docs = buildDocuments(student, refs, services, profile);
      for (const doc of docs) {
        expect(Date.parse(doc.uploadedAt)).toBeLessThanOrEqual(DEMO_NOW_MS);
        for (const h of doc.history) expect(Date.parse(h.at)).toBeLessThanOrEqual(DEMO_NOW_MS);
      }
      // A payroll form only follows paid work-based learning.
      if (docs.some((d) => d.type === 'PAYROLL_FORM')) {
        expect(services.some((s) => s.activity === 'work_based_learning')).toBe(true);
      }
      const trail = buildRecordAuditTrail({ studentId: student.id, referrals: [], documents: docs, authorizations: [] });
      expect(trail.every((e) => Date.parse(e.at) <= DEMO_NOW_MS)).toBe(true);
      // Newest first.
      for (let i = 1; i < trail.length; i++) expect(trail[i - 1]!.at >= trail[i]!.at).toBe(true);
    }
  });

  it('keeps the profile, the document folder, and the compliance list in agreement', () => {
    const unreferred = bundle.students.filter((st) => !referralsByStudent.has(st.id));
    expect(unreferred.length).toBeGreaterThan(0);
    for (const student of [...sample, ...unreferred]) {
      const services = servicesByStudent.get(student.id) ?? [];
      const refs = referralsByStudent.get(student.id) ?? [];
      const profile = buildReadinessProfile(student, services, [], refs);
      const school = bundle.personas.find(
        (p) => p.role === 'school_coordinator' && p.scopeId === student.divisionId,
      )?.id;
      const docs = buildDocuments(student, refs, services, profile, school);
      const has = (type: string) => docs.some((d) => d.type === type);
      expect(has('ACCOMMODATION_PLAN'), student.id).toBe(profile.accommodationsDocumented);
      expect(has('SUPPORT_LEVEL_ASSESSMENT'), student.id).toBe(profile.supportLevelDocumented);
      // A student on the "missing disability documentation" list never shows it as attached.
      if (!student.disabilityDocumented) expect(profile.accommodationsDocumented, student.id).toBe(false);
      if (refs.length === 0) {
        expect(profile.supportLevelDocumented, student.id).toBe(false);
        expect(docs.every((d) => d.ownerPersonaId === school), student.id).toBe(true);
      }
    }
  });

  it('ages documents into expiring and expired against the fixed “now”', () => {
    expect(documentStatus({ expiresAt: null })).toBe('CURRENT');
    expect(documentStatus({ expiresAt: new Date(DEMO_NOW_MS - MS_PER_DAY).toISOString() })).toBe('EXPIRED');
    expect(documentStatus({ expiresAt: new Date(DEMO_NOW_MS + 30 * MS_PER_DAY).toISOString() })).toBe('EXPIRING');
    expect(documentStatus({ expiresAt: new Date(DEMO_NOW_MS + 90 * MS_PER_DAY).toISOString() })).toBe('CURRENT');
  });

  it('matches employers on career interest and district, transit-friendly first', () => {
    const employerById = new Map(bundle.employers.map((e) => [e.id, e]));
    const posting = bundle.postings[0]!;
    const employer = employerById.get(posting.employerId)!;
    const matches = matchEmployers(
      { careerInterest: posting.field },
      { transportationBarrier: true },
      employer.darsDistrictId,
      bundle.postings,
      employerById,
    );
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(m.posting.field).toBe(posting.field);
      expect(m.employer.darsDistrictId).toBe(employer.darsDistrictId);
      expect(m.reasons.length).toBeGreaterThanOrEqual(2);
    }
    const firstCarFree = matches.findIndex((m) => !m.posting.transitAccessible);
    if (firstCarFree >= 0) {
      expect(matches.slice(firstCarFree).every((m) => !m.posting.transitAccessible)).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */

describe('coach marks for the new features', () => {
  /** Every data-coach value (and RecordCard coach prop) in the application source. */
  function coachTargetsInSource(): Set<string> {
    const found = new Set<string>();
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.tsx')) {
          const text = readFileSync(full, 'utf8');
          for (const m of text.matchAll(/(?:data-coach|\bcoach)="([a-z0-9-]+)"/g)) found.add(m[1]!);
          // data-coach={first ? 'postings' : undefined}
          for (const m of text.matchAll(/data-coach=\{[^}]*?'([a-z0-9-]+)'/g)) found.add(m[1]!);
        }
      }
    };
    walk(path.resolve(process.cwd(), 'src'));
    return found;
  }

  const targets = coachTargetsInSource();
  const routes = appRoutes();

  it('points every step at something that exists on a screen', () => {
    const steps = [
      ...ROLES.flatMap((r) => COACH_STEPS[r]),
      ...ROLES.flatMap((r) => WHATS_NEW_STEPS[r]),
      ...SCREEN_TOUR_PATHS.flatMap((p) => screenTourFor(p)!.steps),
    ];
    const missing = steps.filter((s) => !targets.has(s.target)).map((s) => s.target);
    expect(missing).toEqual([]);
  });

  it('gives each tour a real screen, a short run of steps, and its own key', () => {
    const keys = new Set<string>();
    for (const p of SCREEN_TOUR_PATHS) {
      expect(routes.has(`${p}/`), `${p} is not a route`).toBe(true);
      const tour = screenTourFor(`${p}/`)!; // trailing slash, as the static site serves it
      expect(tour.steps.length).toBeGreaterThan(0);
      expect(tour.steps.length).toBeLessThanOrEqual(5);
      expect(keys.has(tour.key)).toBe(false);
      keys.add(tour.key);
    }
    for (const role of ROLES) {
      expect(keys.has(whatsNewKey(role))).toBe(false);
      keys.add(whatsNewKey(role));
    }
    expect(screenTourFor('/about/')).toBeNull();
  });

  it('marks every "what’s new" step as new', () => {
    for (const role of ROLES) {
      expect(WHATS_NEW_STEPS[role].length).toBeGreaterThan(0);
      expect(WHATS_NEW_STEPS[role].every((s) => s.badge === 'New')).toBe(true);
    }
  });
});

describe('journey wording follows the referral status', () => {
  it('names the real wait before any service is logged', () => {
    expect(interventionWaiting(undefined)).toBe('No Pre-ETS referral yet');
    expect(interventionWaiting({ status: 'NEW', assignedAt: null })).toMatch(/DARS review/);
    expect(interventionWaiting({ status: 'UNDER_REVIEW', assignedAt: null })).toMatch(/reviewing/);
    expect(interventionWaiting({ status: 'AWAITING_CONSENT', assignedAt: null })).toMatch(/consent/);
    expect(interventionWaiting({ status: 'READY_TO_ASSIGN', assignedAt: null })).toBe('Waiting for a provider');
    expect(interventionWaiting({ status: 'ASSIGNED', assignedAt: '2026-06-01T00:00:00.000Z' })).toMatch(/Provider assigned/);
    expect(interventionWaiting({ status: 'CLOSED_NOT_SERVED', assignedAt: null })).toMatch(/Closed/);
  });
});
