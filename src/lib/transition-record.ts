/**
 * The standardized transition readiness profile, the secure document folder, and the
 * Need → Intervention → Progress → Outcome journey for one student.
 *
 * All of it is DERIVED from the student's own records — referrals, services, outcomes,
 * authorizations — the same way referral timelines are (src/lib/timeline.ts), so nothing
 * here adds to what the browser downloads. Where a value is not in the source records (a
 * student's career interest, the support level on their assessment), it is chosen by a
 * generator keyed on the student id, so every laptop and every build shows the same record.
 *
 * Pure functions. Pass records in; get the record out.
 */
import type {
  CareerField,
  JobPosting,
  OutcomeRecord,
  PreEtsActivity,
  ServiceRecord,
  StoredReferral,
  Student,
  Employer,
  Authorization,
} from '@/data/types';
import { ACTIVITY_SHORT_LABELS, CAREER_FIELDS, OUTCOME_LABELS } from '@/data/types';
import type { DocumentAccessLevel } from './access';
import { DEMO_NOW_MS, MS_PER_DAY } from './demo-clock';
import { keyedRandom, weightedChoice } from './hash';
import { vendorPersonaId } from './timeline';

/* ==========================================================================
   1. Readiness profile
   ========================================================================== */

export type ReadinessArea =
  | 'WORKPLACE_READINESS'
  | 'TRANSPORTATION'
  | 'COMMUNICATION'
  | 'INDEPENDENT_LIVING'
  | 'POSTSECONDARY';

export const READINESS_AREAS: readonly ReadinessArea[] = [
  'WORKPLACE_READINESS',
  'TRANSPORTATION',
  'COMMUNICATION',
  'INDEPENDENT_LIVING',
  'POSTSECONDARY',
] as const;

export const READINESS_AREA_LABELS: Record<ReadinessArea, string> = {
  WORKPLACE_READINESS: 'Workplace readiness',
  TRANSPORTATION: 'Transportation',
  COMMUNICATION: 'Communication',
  INDEPENDENT_LIVING: 'Independent living',
  POSTSECONDARY: 'Education after high school',
};

export type ReadinessStatus = 'NOT_STARTED' | 'NEEDS_SUPPORT' | 'DEVELOPING' | 'EXPLORING' | 'READY';

export const READINESS_STATUS_LABELS: Record<ReadinessStatus, string> = {
  NOT_STARTED: 'Not started',
  NEEDS_SUPPORT: 'Needs support',
  DEVELOPING: 'Developing',
  EXPLORING: 'Exploring',
  READY: 'Ready',
};

/** Tone for the status pill. Paired with the text label, never shown alone. */
export const READINESS_STATUS_TONE: Record<ReadinessStatus, 'neutral' | 'warn' | 'info' | 'ok'> = {
  NOT_STARTED: 'neutral',
  NEEDS_SUPPORT: 'warn',
  DEVELOPING: 'info',
  EXPLORING: 'info',
  READY: 'ok',
};

export type SupportLevel = 'LOW' | 'MODERATE' | 'HIGH';

export const SUPPORT_LEVEL_LABELS: Record<SupportLevel, string> = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
};

export interface ReadinessItem {
  area: ReadinessArea;
  status: ReadinessStatus;
  /** One line on why — which service or fact put the student here. */
  basis: string;
}

export interface ReadinessProfile {
  careerInterest: CareerField;
  items: ReadinessItem[];
  supportLevel: SupportLevel;
  /** The documentation behind the support level. Michelle: "Important — attach." */
  supportLevelDocumented: boolean;
  accommodationsDocumented: boolean;
}

const CAREER_WEIGHTS: readonly (readonly [CareerField, number])[] = [
  ['HEALTHCARE', 0.16],
  ['RETAIL', 0.13],
  ['HOSPITALITY', 0.13],
  ['LOGISTICS', 0.1],
  ['SKILLED_TRADES', 0.1],
  ['INFORMATION_TECHNOLOGY', 0.1],
  ['EDUCATION', 0.08],
  ['AUTOMOTIVE', 0.08],
  ['OFFICE_ADMIN', 0.07],
  ['AGRICULTURE', 0.05],
];

function countActivity(services: ServiceRecord[], activity: PreEtsActivity): number {
  return services.filter((s) => s.activity === activity).length;
}

/**
 * A student's stated career interest. Drawn from its own keyed stream so the job board can
 * match students to postings without loading anyone's service history.
 */
export function careerInterestFor(studentId: string): CareerField {
  return weightedChoice(keyedRandom(`career:${studentId}`), CAREER_WEIGHTS);
}

/**
 * A support-level assessment is written by the DARS counselor at review, so it can only be
 * on file once a referral has been reviewed. The profile and the document folder both ask
 * this one question, so they can never disagree.
 */
export function supportAssessmentOnFile(
  referrals: Pick<StoredReferral, 'reviewedAt' | 'reviewedByPersonaId'>[],
): boolean {
  const first = referrals[0];
  const latest = referrals[referrals.length - 1];
  if (!first || !latest) return false;
  return Boolean((latest.reviewedByPersonaId ?? first.reviewedByPersonaId) && latest.reviewedAt);
}

export function buildReadinessProfile(
  student: Student,
  services: ServiceRecord[],
  outcomes: OutcomeRecord[],
  referrals: Pick<StoredReferral, 'reviewedAt' | 'reviewedByPersonaId'>[],
): ReadinessProfile {
  const random = keyedRandom(`readiness:${student.id}`);
  const employed = outcomes.some((o) => o.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT');
  const enrolled = outcomes.some((o) => o.type === 'POSTSECONDARY_ENROLLED');

  const wrt = countActivity(services, 'workplace_readiness_training');
  const wbl = countActivity(services, 'work_based_learning');
  const sai = countActivity(services, 'self_advocacy_instruction');
  const psc = countActivity(services, 'postsecondary_counseling');

  const workplace: ReadinessItem = employed
    ? { area: 'WORKPLACE_READINESS', status: 'READY', basis: 'Working in a competitive, integrated job.' }
    : wrt + wbl >= 3
      ? { area: 'WORKPLACE_READINESS', status: random() < 0.55 ? 'READY' : 'DEVELOPING', basis: `${wrt + wbl} workplace readiness or work-based learning sessions so far.` }
      : wrt + wbl > 0
        ? { area: 'WORKPLACE_READINESS', status: 'DEVELOPING', basis: `${wrt + wbl} workplace readiness or work-based learning ${wrt + wbl === 1 ? 'session' : 'sessions'} so far.` }
        : { area: 'WORKPLACE_READINESS', status: 'NEEDS_SUPPORT', basis: 'No workplace readiness training delivered yet.' };

  const transportation: ReadinessItem = student.transportationBarrier
    ? random() < 0.8
      ? { area: 'TRANSPORTATION', status: 'NEEDS_SUPPORT', basis: 'Transportation barrier flagged on the referral.' }
      : { area: 'TRANSPORTATION', status: 'DEVELOPING', basis: 'Barrier flagged; learning a route with support.' }
    : random() < 0.7
      ? { area: 'TRANSPORTATION', status: 'READY', basis: 'Gets to school and work without help.' }
      : { area: 'TRANSPORTATION', status: 'DEVELOPING', basis: 'Travels with some support.' };

  const communication: ReadinessItem =
    sai > 0
      ? { area: 'COMMUNICATION', status: sai >= 2 && random() < 0.6 ? 'READY' : 'DEVELOPING', basis: `${sai} self-advocacy ${sai === 1 ? 'session' : 'sessions'} delivered.` }
      : {
          area: 'COMMUNICATION',
          status: weightedChoice(random, [
            ['NEEDS_SUPPORT', 0.3],
            ['DEVELOPING', 0.5],
            ['READY', 0.2],
          ] as const),
          basis: 'From the transition assessment on the IEP or 504 plan.',
        };

  const appliedStudies = student.diplomaTrack === 'APPLIED_STUDIES';
  const independentLiving: ReadinessItem = {
    area: 'INDEPENDENT_LIVING',
    status: weightedChoice(
      random,
      appliedStudies
        ? ([
            ['NEEDS_SUPPORT', 0.55],
            ['DEVELOPING', 0.35],
            ['READY', 0.1],
          ] as const)
        : ([
            ['NEEDS_SUPPORT', 0.2],
            ['DEVELOPING', 0.45],
            ['READY', 0.35],
          ] as const),
    ),
    basis: appliedStudies
      ? 'Applied Studies diploma track — daily-living goals are on the plan.'
      : 'From the transition assessment on the IEP or 504 plan.',
  };

  const postsecondary: ReadinessItem = enrolled
    ? { area: 'POSTSECONDARY', status: 'READY', basis: 'Enrolled in education after high school.' }
    : psc > 0
      ? { area: 'POSTSECONDARY', status: 'EXPLORING', basis: `${psc} postsecondary counseling ${psc === 1 ? 'session' : 'sessions'} delivered.` }
      : { area: 'POSTSECONDARY', status: student.gradeLevel >= 11 ? 'EXPLORING' : 'NOT_STARTED', basis: student.gradeLevel >= 11 ? 'Looking at options with the school counselor.' : 'Planned for grade 11.' };

  const heavyPlan = student.planType === 'IEP' && (appliedStudies || student.transportationBarrier);
  const supportLevel = weightedChoice(
    random,
    heavyPlan
      ? ([
          ['LOW', 0.12],
          ['MODERATE', 0.53],
          ['HIGH', 0.35],
        ] as const)
      : ([
          ['LOW', 0.4],
          ['MODERATE', 0.48],
          ['HIGH', 0.12],
        ] as const),
  );

  return {
    careerInterest: careerInterestFor(student.id),
    items: [workplace, transportation, communication, independentLiving, postsecondary],
    supportLevel,
    // Both draws always happen, so adding a condition never shifts anyone else's profile.
    supportLevelDocumented: random() < 0.8 && supportAssessmentOnFile(referrals),
    // Accommodations rest on the disability documentation: without it, nothing is attached.
    accommodationsDocumented:
      random() < (student.planType === 'DOCUMENTED_OTHER' ? 0.6 : 0.92) && student.disabilityDocumented,
  };
}

/* ==========================================================================
   2. Secure document folder
   ========================================================================== */

export type DocumentType =
  | 'IEP_PLAN'
  | 'SECTION_504_PLAN'
  | 'DISABILITY_DOCUMENTATION'
  | 'CONSENT_FORM'
  | 'VR_ELIGIBILITY'
  | 'MEDICAL_RECORDS'
  | 'ACCOMMODATION_PLAN'
  | 'SUPPORT_LEVEL_ASSESSMENT'
  | 'PAYROLL_FORM';

export const DOCUMENT_TYPES: readonly DocumentType[] = [
  'IEP_PLAN',
  'SECTION_504_PLAN',
  'DISABILITY_DOCUMENTATION',
  'CONSENT_FORM',
  'VR_ELIGIBILITY',
  'MEDICAL_RECORDS',
  'ACCOMMODATION_PLAN',
  'SUPPORT_LEVEL_ASSESSMENT',
  'PAYROLL_FORM',
] as const;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  IEP_PLAN: 'IEP plan',
  SECTION_504_PLAN: 'Section 504 plan',
  DISABILITY_DOCUMENTATION: 'Disability documentation',
  CONSENT_FORM: 'Pre-ETS consent and release form',
  VR_ELIGIBILITY: 'VR document — Pre-ETS eligibility',
  MEDICAL_RECORDS: 'Hospital or medical records',
  ACCOMMODATION_PLAN: 'Accommodation documentation',
  SUPPORT_LEVEL_ASSESSMENT: 'Support-level assessment',
  PAYROLL_FORM: 'Payroll document (W-9 / W-4)',
};

/** The access level a new document of each type starts with. */
export const DEFAULT_ACCESS: Record<DocumentType, DocumentAccessLevel> = {
  IEP_PLAN: 'SCHOOL_DARS',
  SECTION_504_PLAN: 'SCHOOL_DARS',
  DISABILITY_DOCUMENTATION: 'SCHOOL_DARS',
  CONSENT_FORM: 'ALL_TEAM',
  VR_ELIGIBILITY: 'DARS_PROVIDER',
  MEDICAL_RECORDS: 'DARS_ONLY',
  ACCOMMODATION_PLAN: 'ALL_TEAM',
  SUPPORT_LEVEL_ASSESSMENT: 'DARS_PROVIDER',
  PAYROLL_FORM: 'DARS_PROVIDER',
};

/** How long a document stays current, in days. Null = does not expire. */
const VALID_FOR_DAYS: Record<DocumentType, number | null> = {
  IEP_PLAN: 365,
  SECTION_504_PLAN: 365,
  DISABILITY_DOCUMENTATION: null,
  CONSENT_FORM: 365,
  VR_ELIGIBILITY: null,
  MEDICAL_RECORDS: null,
  ACCOMMODATION_PLAN: 365,
  SUPPORT_LEVEL_ASSESSMENT: 730,
  PAYROLL_FORM: null,
};

/** Within this many days of expiring, a document is flagged. */
export const EXPIRING_SOON_DAYS = 45;

export type DocumentStatus = 'CURRENT' | 'EXPIRING' | 'EXPIRED';

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  CURRENT: 'Current',
  EXPIRING: 'Expiring soon',
  EXPIRED: 'Expired — needs an update',
};

export interface DocumentAuditEntry {
  at: string;
  actorPersonaId: string;
  action: 'UPLOADED' | 'VIEWED' | 'ACCESS_SET' | 'DOWNLOADED';
  note: string;
}

export interface SecureDocument {
  id: string;
  studentId: string;
  type: DocumentType;
  /** Who added it and answers for it. */
  ownerPersonaId: string;
  uploadedAt: string;
  expiresAt: string | null;
  accessLevel: DocumentAccessLevel;
  version: number;
  history: DocumentAuditEntry[];
  /** True for documents added during this demonstration session. */
  addedThisSession?: boolean;
}

function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * MS_PER_DAY).toISOString();
}

function clampToNow(iso: string): string {
  return Date.parse(iso) > DEMO_NOW_MS ? new Date(DEMO_NOW_MS).toISOString() : iso;
}

export function documentStatus(
  doc: Pick<SecureDocument, 'expiresAt'>,
  nowMs = DEMO_NOW_MS,
): DocumentStatus {
  if (!doc.expiresAt) return 'CURRENT';
  const days = (Date.parse(doc.expiresAt) - nowMs) / MS_PER_DAY;
  if (days < 0) return 'EXPIRED';
  if (days <= EXPIRING_SOON_DAYS) return 'EXPIRING';
  return 'CURRENT';
}

export function expiresAtFor(type: DocumentType, uploadedAt: string): string | null {
  const days = VALID_FOR_DAYS[type];
  return days === null ? null : addDaysIso(uploadedAt, days);
}

/**
 * A student the school knows but has not referred: the school already holds the plan, and
 * the accommodation documentation when it exists. Nothing from DARS or a provider yet.
 */
function unreferredDocuments(
  student: Student,
  profile: ReadinessProfile,
  school: string,
  random: () => number,
): SecureDocument[] {
  const docs: SecureDocument[] = [];
  const add = (type: DocumentType, daysAgo: number) => {
    const at = new Date(DEMO_NOW_MS - daysAgo * MS_PER_DAY).toISOString();
    docs.push({
      id: `${student.id}-DOC-${String(docs.length + 1).padStart(2, '0')}`,
      studentId: student.id,
      type,
      ownerPersonaId: school,
      uploadedAt: at,
      expiresAt: expiresAtFor(type, at),
      accessLevel: DEFAULT_ACCESS[type],
      version: 1,
      history: [{ at, actorPersonaId: school, action: 'UPLOADED', note: 'Uploaded to the secure folder.' }],
    });
  };
  const plan: DocumentType | null =
    student.planType === 'IEP' ? 'IEP_PLAN' : student.planType === 'SECTION_504' ? 'SECTION_504_PLAN' : null;
  if (plan) add(plan, 20 + Math.floor(random() * 250));
  if (profile.accommodationsDocumented) add('ACCOMMODATION_PLAN', 10 + Math.floor(random() * 120));
  return docs.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/**
 * The secure folder for one student. Which documents exist follows the record: an IEP plan
 * for a student on an IEP, a consent form once consent is on file, a payroll document only
 * after paid work-based learning, hospital records only when a case needed them.
 */
export function buildDocuments(
  student: Student,
  referrals: StoredReferral[],
  services: ServiceRecord[],
  profile: ReadinessProfile,
  /** The division's transition coordinator — owner of the plan for a student not yet referred. */
  schoolPersonaId?: string,
): SecureDocument[] {
  const first = referrals[0];
  const random = keyedRandom(`documents:${student.id}`);
  if (!first) return schoolPersonaId ? unreferredDocuments(student, profile, schoolPersonaId, random) : [];
  const latest = referrals[referrals.length - 1]!;

  const school = first.submittedByPersonaId;
  const counselor = latest.reviewedByPersonaId ?? first.reviewedByPersonaId;
  const provider = latest.assignedVendorId ? vendorPersonaId(latest.assignedVendorId) : null;

  const docs: SecureDocument[] = [];
  const push = (type: DocumentType, owner: string, uploadedAt: string, readers: string[]) => {
    const at = clampToNow(uploadedAt);
    const history: DocumentAuditEntry[] = [
      { at, actorPersonaId: owner, action: 'UPLOADED', note: 'Uploaded to the secure folder.' },
    ];
    // A few later views by the people allowed to read it, so the trail is never empty.
    let cursor = Date.parse(at);
    for (const reader of readers) {
      if (random() < 0.35) continue;
      cursor += (1 + random() * 20) * MS_PER_DAY;
      if (cursor > DEMO_NOW_MS) break;
      history.push({
        at: new Date(cursor).toISOString(),
        actorPersonaId: reader,
        action: 'VIEWED',
        note: 'Opened in the platform.',
      });
    }
    docs.push({
      id: `${student.id}-DOC-${String(docs.length + 1).padStart(2, '0')}`,
      studentId: student.id,
      type,
      ownerPersonaId: owner,
      uploadedAt: at,
      expiresAt: expiresAtFor(type, at),
      accessLevel: DEFAULT_ACCESS[type],
      version: random() < 0.2 ? 2 : 1,
      history,
    });
  };

  // The plan behind eligibility. Refreshed yearly, so older ones age into "expired".
  const planType: DocumentType =
    student.planType === 'IEP'
      ? 'IEP_PLAN'
      : student.planType === 'SECTION_504'
        ? 'SECTION_504_PLAN'
        : 'DISABILITY_DOCUMENTATION';
  const planDate = addDaysIso(latest.submittedAt, -(10 + random() * 200));
  push(planType, school, planDate, counselor ? [counselor] : []);

  if (student.consentOnFile && student.consentDate) {
    push('CONSENT_FORM', school, student.consentDate, [counselor, provider].filter(Boolean) as string[]);
  } else if (latest.status !== 'AWAITING_CONSENT' && latest.reviewedAt) {
    push('CONSENT_FORM', school, latest.reviewedAt, [counselor, provider].filter(Boolean) as string[]);
  }

  if (counselor && latest.reviewedAt) {
    push('VR_ELIGIBILITY', counselor, addDaysIso(latest.reviewedAt, 1), provider ? [provider] : []);
    if (random() < 0.2) {
      push('MEDICAL_RECORDS', counselor, addDaysIso(latest.reviewedAt, 2 + random() * 10), []);
    }
  }

  if (profile.accommodationsDocumented) {
    push(
      'ACCOMMODATION_PLAN',
      school,
      addDaysIso(latest.submittedAt, -(5 + random() * 60)),
      [counselor, provider].filter(Boolean) as string[],
    );
  }

  if (profile.supportLevelDocumented && counselor && latest.reviewedAt) {
    push('SUPPORT_LEVEL_ASSESSMENT', counselor, addDaysIso(latest.reviewedAt, 3), provider ? [provider] : []);
  }

  const firstWbl = services.find((s) => s.activity === 'work_based_learning');
  if (firstWbl && provider && random() < 0.45) {
    push('PAYROLL_FORM', provider, firstWbl.serviceDate, counselor ? [counselor] : []);
  }

  return docs.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/* ==========================================================================
   3. Employer matches
   ========================================================================== */

export interface EmployerMatch {
  posting: JobPosting;
  employer: Employer;
  /** Plain-language reasons, shown so a match is never a black box. */
  reasons: string[];
}

/**
 * Postings in the student's DARS district that fit their career interest. Where
 * transportation is a barrier, postings reachable without a car come first.
 */
export function matchEmployers(
  profile: Pick<ReadinessProfile, 'careerInterest'>,
  student: Pick<Student, 'transportationBarrier'>,
  districtId: string,
  postings: JobPosting[],
  employerById: Map<string, Employer>,
): EmployerMatch[] {
  const matches: EmployerMatch[] = [];
  for (const posting of postings) {
    if (posting.field !== profile.careerInterest) continue;
    const employer = employerById.get(posting.employerId);
    if (!employer || employer.darsDistrictId !== districtId) continue;
    const reasons = ['Matches the student’s career interest', 'In the student’s DARS district'];
    if (posting.transitAccessible) reasons.push('Reachable without a car');
    if (posting.accommodations.length > 0) reasons.push(`Offers: ${posting.accommodations[0]!.toLowerCase()}`);
    matches.push({ posting, employer, reasons });
  }
  return matches.sort((a, b) => {
    if (student.transportationBarrier && a.posting.transitAccessible !== b.posting.transitAccessible) {
      return a.posting.transitAccessible ? -1 : 1;
    }
    return b.posting.postedAt.localeCompare(a.posting.postedAt);
  });
}

/* ==========================================================================
   4. Need → Intervention → Progress → Outcome
   ========================================================================== */

export type JourneyStepKey = 'need' | 'intervention' | 'progress' | 'outcome';
export type JourneyState = 'done' | 'current' | 'upcoming';

export interface JourneyStep {
  key: JourneyStepKey;
  label: string;
  state: JourneyState;
  headline: string;
  details: string[];
}

/** What the intervention step says before any service is logged, in the referral's own terms. */
export function interventionWaiting(latest: Pick<StoredReferral, 'status' | 'assignedAt'> | undefined): string {
  if (!latest) return 'No Pre-ETS referral yet';
  if (latest.status === 'CLOSED_NOT_SERVED') return 'Closed before a service was delivered';
  if (latest.assignedAt) return 'Provider assigned — first service not logged yet';
  switch (latest.status) {
    case 'NEW':
      return 'Referral submitted — waiting for DARS review';
    case 'UNDER_REVIEW':
      return 'DARS is reviewing the referral';
    case 'AWAITING_CONSENT':
      return 'Waiting on a signed consent form';
    default:
      return 'Waiting for a provider';
  }
}

export function buildJourney(input: {
  referrals: StoredReferral[];
  services: ServiceRecord[];
  outcomes: OutcomeRecord[];
  profile: ReadinessProfile;
  authorizations: Authorization[];
  transportationBarrier: boolean;
}): JourneyStep[] {
  const { referrals, services, outcomes, profile, authorizations } = input;
  const latest = referrals[referrals.length - 1];
  const needs = profile.items.filter((i) => i.status === 'NEEDS_SUPPORT');
  const requested = latest?.requestedActivities ?? [];

  const needStep: JourneyStep = {
    key: 'need',
    label: 'Need',
    state: 'done',
    headline:
      needs.length === 0
        ? 'No area currently needs extra support'
        : `${needs.length} ${needs.length === 1 ? 'area needs' : 'areas need'} support`,
    details: [
      ...needs.map((n) => READINESS_AREA_LABELS[n.area]),
      latest ? `${requested.length} of 5 Pre-ETS activities requested` : 'No Pre-ETS referral submitted yet',
      ...(input.transportationBarrier ? ['Transportation barrier flagged'] : []),
    ],
  };

  const activitiesDelivered = [...new Set(services.map((s) => s.activity))];
  const minutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const interventionStep: JourneyStep = {
    key: 'intervention',
    label: 'Intervention',
    state: services.length > 0 ? 'done' : latest?.assignedAt ? 'current' : 'upcoming',
    headline:
      services.length > 0
        ? `${services.length} ${services.length === 1 ? 'service' : 'services'} delivered · ${Math.round(minutes / 60)} hours`
        : interventionWaiting(latest),
    details: activitiesDelivered.map((a) => ACTIVITY_SHORT_LABELS[a]),
  };

  const ready = profile.items.filter((i) => i.status === 'READY').length;
  const developing = profile.items.filter((i) => i.status === 'DEVELOPING' || i.status === 'EXPLORING').length;
  const preEts = authorizations.find((a) => a.source === 'DARS');
  const lastService = [...services].sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))[0];
  const outcome = outcomes[outcomes.length - 1];

  const progressStep: JourneyStep = {
    key: 'progress',
    label: 'Progress',
    state: outcome ? 'done' : services.length > 0 ? 'current' : 'upcoming',
    headline: `${ready} of ${profile.items.length} areas ready · ${developing} developing`,
    details: [
      ...(preEts
        ? [`${Math.round((preEts.minutesUsed / 60) * 10) / 10} of ${preEts.hoursAuthorized} authorized Pre-ETS hours used this year`]
        : []),
      ...(lastService ? [`Last service ${lastService.serviceDate}`] : []),
    ],
  };

  const outcomeStep: JourneyStep = {
    key: 'outcome',
    label: 'Outcome',
    state: outcome ? 'done' : 'upcoming',
    headline: outcome
      ? OUTCOME_LABELS[outcome.type]
      : latest?.status === 'COMPLETED'
        ? 'Services complete — outcome not recorded yet'
        : latest?.status === 'CLOSED_NOT_SERVED'
          ? 'Closed without service'
          : !latest
            ? 'Not referred yet'
            : services.length > 0
              ? 'Services under way'
              : 'No outcome yet — services have not started',
    details: outcome
      ? [
          ...(outcome.employerNameSynthetic ? [outcome.employerNameSynthetic] : []),
          ...(outcome.hourlyWage ? [`$${outcome.hourlyWage.toFixed(2)} an hour`] : []),
          ...(outcome.retained90Days === true ? ['Still working after 90 days'] : []),
          ...(outcome.credentialName ? [outcome.credentialName] : []),
        ]
      : [],
  };

  return [needStep, interventionStep, progressStep, outcomeStep];
}

/** Every career field, for filters. Re-exported so screens import one module. */
export { CAREER_FIELDS };
