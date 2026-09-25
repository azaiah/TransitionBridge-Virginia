/**
 * First-run coaching. Three steps per role — where you are, the one number that matters,
 * and the one thing you would do — and never more. docs/11_USABILITY.md "First-run".
 *
 * Steps point at elements marked with `data-coach`. A step whose target is missing still
 * shows its card, so a coach mark can never block somebody on a screen that changed.
 */
import type { Role } from '@/data/types';

export interface CoachStep {
  /** `data-coach` value of the element to ring. */
  target: string;
  title: string;
  body: string;
  /** Short tag on the card, e.g. "New" for a feature added since the last demonstration. */
  badge?: string;
}

/** A run of steps that is seen once, then replayable from the "?" button. */
export interface CoachTour {
  /** Remembered in this browser once finished or skipped. */
  key: string;
  steps: CoachStep[];
}

export const COACH_STEPS: Record<Role, CoachStep[]> = {
  state_leadership: [
    {
      target: 'nav',
      title: 'You are looking at the whole Commonwealth',
      body: 'Every district, division, and provider in Virginia is in this view. Use the menu on the left to move between the four points of view.',
    },
    {
      target: 'metric',
      title: 'Start with the top row',
      body: 'These are the numbers a Commissioner asks for first. Referrals waiting more than 14 days is the one that usually needs an answer today.',
    },
    {
      target: 'action',
      title: 'Anything needing attention is listed here',
      body: 'Each alert names the district, says how long it has been true, and links straight to the records behind it. Nothing here is a dead end.',
    },
  ],
  dars_counselor: [
    {
      target: 'nav',
      title: 'This is your district, not the whole state',
      body: 'Everything you see is scoped to your district and your caseload. The menu on the left switches between views.',
    },
    {
      target: 'metric',
      title: 'The number that matters is the wait',
      body: 'Referrals unassigned more than 14 days are the ones at risk. Selecting that tile opens exactly those referrals, oldest first.',
    },
    {
      target: 'action',
      title: 'Work the queue from the top',
      body: 'Your queue is sorted oldest first on purpose. Open a referral, compare providers, and assign — the reasons behind each provider ranking are shown, never hidden.',
    },
  ],
  school_coordinator: [
    {
      target: 'nav',
      title: 'This is your division',
      body: 'You see the students and referrals for your division only. The menu on the left moves between your referrals, students, and compliance.',
    },
    {
      target: 'metric',
      title: 'Watch consent and anything stuck',
      body: 'Referrals waiting on a consent form, and referrals sitting more than 14 days without a provider, are the two things that hold a student up.',
    },
    {
      target: 'action',
      title: 'Referring a student takes about 90 seconds',
      body: 'Anything already on the student record is filled in for you. You will never be asked twice for something the system already knows.',
    },
  ],
  vendor: [
    {
      target: 'nav',
      title: 'This is your organization',
      body: 'Offers, capacity, and the students you serve — nothing from other providers. The menu on the left moves between them.',
    },
    {
      target: 'metric',
      title: 'Capacity drives what you are offered',
      body: 'How full you are is visible to the counselor making the assignment, so keeping it current means fewer offers you have to turn down.',
    },
    {
      target: 'action',
      title: 'Accept or decline, with a reason',
      body: 'A decline is not a failure. The reason you give rolls up statewide, and that is how transportation and capacity gaps become budget conversations.',
    },
  ],
};

export function storageKeyFor(role: Role): string {
  return `tb-coach-${role}`;
}

/* ==========================================================================
   What's new — shown once on each home screen, after the three-step tour.
   Covers the IEP Partners feedback round (docs/12_IEP_FEEDBACK_UPGRADES.md).
   ========================================================================== */

const NEW = 'New';

export const WHATS_NEW_STEPS: Record<Role, CoachStep[]> = {
  state_leadership: [
    {
      target: 'early-warnings',
      badge: NEW,
      title: 'Early warnings at 14, 30, and 90 days',
      body: 'A referral that stalls climbs a ladder: flagged to the counselor at 14 days, the district manager at 30, and this office at 90. Select any number to see which districts it is in.',
    },
    {
      target: 'funding-summary',
      badge: NEW,
      title: 'Who is paying, and what is left',
      body: 'Every service now names its funder — DARS, DMAS, Virginia Works, a school division, a grant, or the workforce board. Authorized, utilized, and remaining, statewide.',
    },
    {
      target: 'state-tools',
      badge: NEW,
      title: 'Three new screens',
      body: 'Who is paying, Early warnings, and the Access and audit log — which records who opened what, whose name was shown, and every download, with the reason given.',
    },
  ],
  dars_counselor: [
    {
      target: 'early-warnings',
      badge: NEW,
      title: 'Early warnings at 14, 30, and 90 days',
      body: 'Past-due referrals climb a ladder: flagged to you at 14 days, your district manager at 30, the state office at 90. Select any number to open exactly those referrals.',
    },
    {
      target: 'funding-snapshot',
      badge: NEW,
      title: 'Funding and hours',
      body: 'See who is paying for each student and how many authorized hours are left. Anything near or over its limit is flagged here before it can become over-billing.',
    },
    {
      target: 'counselor-tools',
      badge: NEW,
      title: 'Records, funding, and jobs',
      body: 'Open a student’s secure transition record, review every authorization, or match students on your caseload to open jobs from employer partners.',
    },
  ],
  school_coordinator: [
    {
      target: 'early-warnings',
      badge: NEW,
      title: 'Early warnings for your referrals',
      body: 'Anything past due at 14, 30, or 90 days shows here. Consent forms are yours to chase; the rest are DARS and the provider — and you can watch them move.',
    },
    {
      target: 'nav',
      badge: NEW,
      title: 'Students now appear by Transition ID',
      body: 'Names are replaced with IDs like AN-VA-000412 everywhere. On a student’s record, choose “Show name” when you need it — you are asked why, and it is recorded.',
    },
  ],
  vendor: [
    {
      target: 'hours',
      badge: NEW,
      title: 'Authorized hours, checked for you',
      body: 'When you log a session, each student’s remaining hours are checked first. A session that would go over is refused, so nothing is billed that DARS did not authorize.',
    },
    {
      target: 'early-warnings',
      badge: NEW,
      title: 'Students waiting for a first session',
      body: 'Students you accepted with no service logged yet. At 30 days the district manager is told, at 90 the state office — so the first session is the one to book.',
    },
    {
      target: 'jobs',
      badge: NEW,
      title: 'The job board',
      body: 'Open jobs and work-based learning sites from employer partners near you, each showing which students on your roster it fits — by ID, never by name.',
    },
  ],
};

export function whatsNewKey(role: Role): string {
  return `tb-coach-new-${role}-2026-09`;
}

/* ==========================================================================
   Screen tours — the first time someone opens one of these screens.
   Keyed by path, without the trailing slash.
   ========================================================================== */

function recordSteps(role: Role): CoachStep[] {
  const canReveal = role === 'school_coordinator' || role === 'dars_counselor';
  const header: CoachStep = {
    target: 'record-header',
    badge: NEW,
    title: 'One secure record, one ID',
    body: canReveal
      ? 'This student appears by Transition ID. Choose “Show name” when you need it — you pick a reason, and who, when, and why go into the audit trail.'
      : 'This student appears by Transition ID. Your account never sees the name — everything you need to do works from the ID.',
  };
  const readiness: CoachStep = {
    target: 'readiness',
    badge: NEW,
    title: 'The standardized readiness profile',
    body: 'The same areas and statuses for every student. Accommodations and the support level must have documentation attached — when it is missing, the profile says so.',
  };
  const documents: CoachStep = {
    target: 'documents',
    badge: NEW,
    title: 'The secure document folder',
    body: 'Each document shows its owner, date, expiry, and who can open it. Every open is recorded — and a document you cannot open is not even named.',
  };
  const funding: CoachStep = {
    target: 'funding',
    badge: NEW,
    title: role === 'vendor' ? 'Hours you can still deliver' : 'Who is paying, and what is left',
    body:
      role === 'dars_counselor'
        ? 'Every authorization with its funder and hours authorized, used, and remaining. Extending one takes a reason, and it is recorded.'
        : role === 'vendor'
          ? 'The Pre-ETS hours still authorized for this student. Sessions past this are refused until DARS extends it.'
          : 'Authorized, used, and remaining for each funder on this record.',
  };
  const audit: CoachStep = {
    target: 'audit',
    badge: NEW,
    title: 'The audit trail',
    body: 'Who did what on this record: every view, upload, name shown, and change, newest first. Actions from this session are marked at the top.',
  };
  const access: CoachStep = {
    target: 'access',
    badge: NEW,
    title: 'Every agency sees what it needs',
    body: 'This table is the rule for the whole record: what the school, DARS, the provider, and the state can each see — and why.',
  };

  switch (role) {
    case 'dars_counselor':
      return [header, documents, funding, audit];
    case 'school_coordinator':
      return [header, readiness, documents, access];
    case 'vendor':
      return [header, funding, documents, access];
    case 'state_leadership':
      return [header, { ...readiness, target: 'journey', body: 'The journey from need to outcome, by Transition ID. The detail behind each area stays with the student’s team.', title: 'What the state sees' }, audit, access];
  }
}

const SCREEN_TOURS: Record<string, CoachStep[]> = {
  '/dars/students/detail': recordSteps('dars_counselor'),
  '/school/students/detail': recordSteps('school_coordinator'),
  '/vendor/students/detail': recordSteps('vendor'),
  '/state/students/detail': recordSteps('state_leadership'),
  '/dars/students': [
    {
      target: 'student-list',
      badge: NEW,
      title: 'Students by Transition ID',
      body: 'No names in lists. Open a record to see the whole story; the name is there on request, and each request is recorded. Downloads carry IDs only.',
    },
  ],
  '/dars/queue': [
    {
      target: 'queue-views',
      badge: NEW,
      title: 'Early-warning views',
      body: 'Pick “past due 14+, 30+, or 90+ days” to see referrals by how long they have waited — including students waiting for a first service after they were placed.',
    },
    {
      target: 'download',
      badge: NEW,
      title: 'Downloads are guarded',
      body: 'Every download states what is in it, asks why you need it, removes names, stamps the file with your name, and is recorded in the audit trail.',
    },
  ],
  '/dars/funding': [
    {
      badge: NEW,
      target: 'metric',
      title: 'Who pays, and what is left',
      body: 'Authorized, utilized, and the authorizations near or over their hours, for your district this fiscal year.',
    },
    {
      badge: NEW,
      target: 'guard',
      title: 'How over-billing is stopped',
      body: 'A provider’s session is checked against the authorization before it is saved. Past the limit, it is refused until you extend it — with a reason.',
    },
    {
      badge: NEW,
      target: 'filters',
      title: 'Start with “Over authorization”',
      body: 'Those are the students whose services are blocked right now. Open one to extend the authorization or plan the last sessions.',
    },
  ],
  '/dars/jobs': [
    {
      badge: NEW,
      target: 'job-filters',
      title: 'Filter by field and by getting there',
      body: '“Reachable without a car” matters wherever a transportation barrier is flagged.',
    },
    {
      badge: NEW,
      target: 'postings',
      title: 'Every posting shows who it fits',
      body: 'Each one lists the students with active referrals in your district whose career interest matches — by Transition ID. Employers never see a student.',
    },
  ],
  '/vendor/jobs': [
    {
      badge: NEW,
      target: 'job-filters',
      title: 'Filter by field and by getting there',
      body: '“Reachable without a car” matters wherever a transportation barrier is flagged.',
    },
    {
      badge: NEW,
      target: 'postings',
      title: 'Every posting shows who it fits',
      body: 'Each one lists the students on your roster whose career interest matches — by Transition ID. Employers never see a student.',
    },
  ],
  '/vendor/log': [
    {
      target: 'select-students',
      badge: NEW,
      title: 'Hours left, per student',
      body: 'Each student shows the Pre-ETS hours still authorized. Anyone without enough for this session is marked.',
    },
    {
      target: 'session-details',
      badge: NEW,
      title: 'Checked before it is saved',
      body: 'Choose the activity and how long it ran. Before anything is saved, each student’s hours are checked: a session that would go past an authorization is refused for that student, the others are logged, and the refusal is recorded.',
    },
  ],
  '/vendor/roster': [
    {
      target: 'roster',
      badge: NEW,
      title: 'Your roster, by Transition ID',
      body: 'Providers work from IDs, never names. The hours column shows what is left on each authorization, so no one schedules a session that cannot be covered.',
    },
  ],
  '/school/referrals': [
    {
      target: 'referral-filter',
      badge: NEW,
      title: 'Show what is past due',
      body: 'Choose “Early warning: past due 14+ days” to see only the referrals that have stalled — the ones a family or a counselor is waiting on.',
    },
    {
      target: 'referral-list',
      badge: NEW,
      title: 'By Transition ID, with the full record one click away',
      body: 'Each row shows the student’s ID and, when a referral is late, how late. Open the record to see documents, readiness, and employer matches.',
    },
  ],
  '/school/refer': [
    {
      target: 'lookup',
      badge: NEW,
      title: 'Find the student by Transition ID',
      body: 'Type the ID, like AN-VA-000412. Everything already on the record fills in, and no name is typed into a search box.',
    },
  ],
  '/state/funding': [
    {
      badge: NEW,
      target: 'metric',
      title: 'Authorized, utilized, remaining',
      body: 'Every funder, statewide, for this fiscal year. Nothing on this screen identifies a student.',
    },
    {
      badge: NEW,
      target: 'tie-out',
      title: 'It checks against the reserve',
      body: 'DARS Pre-ETS utilized equals reserve spend to date on the 15% reserve screen, to the dollar.',
    },
    {
      badge: NEW,
      target: 'by-source',
      title: 'Who carries the cost',
      body: 'Utilized and remaining by funder. Select “View as table” for the numbers.',
    },
  ],
  '/state/early-warnings': [
    {
      badge: NEW,
      target: 'early-warnings',
      title: 'The ladder, statewide',
      body: 'At 90 days an escalation reaches this office. The split shows where referrals are stuck and who can move them.',
    },
    {
      badge: NEW,
      target: 'action',
      title: 'Straight to the records',
      body: 'Select a number in the district table to open that district’s queue at that rung.',
    },
  ],
  '/state/audit': [
    {
      badge: NEW,
      target: 'recorded',
      title: 'What is recorded',
      body: 'Names shown, records and documents opened, downloads, refusals, and changes — with who, when, and the reason given.',
    },
    {
      badge: NEW,
      target: 'metric',
      title: 'Try it live',
      body: 'Open any transition record, choose “Show name”, then come back here. The entry is waiting for you.',
    },
  ],
};

/** Every path with its own tour, for the test that proves each one is a real screen. */
export const SCREEN_TOUR_PATHS: readonly string[] = Object.keys(SCREEN_TOURS);

/** The screen tour for a path, if it has one. */
export function screenTourFor(pathname: string): CoachTour | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  const steps = SCREEN_TOURS[path];
  return steps ? { key: `tb-coach-screen-${path}-2026-09`, steps } : null;
}
