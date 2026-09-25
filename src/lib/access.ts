/**
 * "One secure transition record — every agency sees what it needs."
 *
 * This file is the whole access policy, in one readable place: which parts of a student's
 * record each role can open, which documents, and what each role may download. Screens ask
 * these functions; they never decide access on their own. The same table is shown to users
 * on the record itself ("Who can see what"), so the rules are never a mystery.
 *
 * This is a demonstration of the policy, not a security boundary: the demonstration holds
 * only synthetic records, and a production build enforces the same table on the server.
 */
import type { Persona, Role, StoredReferral } from '@/data/types';

/* --------------------------------------------------------------------------
   Record sections
   -------------------------------------------------------------------------- */

export type RecordSection =
  | 'profile'
  | 'journey'
  | 'services'
  | 'funding'
  | 'documents'
  | 'employers'
  | 'audit';

export const RECORD_SECTION_LABELS: Record<RecordSection, string> = {
  profile: 'Readiness profile',
  journey: 'Need → intervention → progress → outcome',
  services: 'Services delivered',
  funding: 'Funding and hours',
  documents: 'Secure documents',
  employers: 'Employer matches',
  audit: 'Audit trail',
};

export type SectionAccess = 'full' | 'summary' | 'none';

/**
 * Rows are sections, columns are roles. 'summary' means the role sees counts and status
 * but not the detail — for example, the state sees that documents exist, not what they say.
 */
export const SECTION_ACCESS: Record<RecordSection, Record<Role, SectionAccess>> = {
  profile: {
    school_coordinator: 'full',
    dars_counselor: 'full',
    vendor: 'full',
    state_leadership: 'summary',
  },
  journey: {
    school_coordinator: 'full',
    dars_counselor: 'full',
    vendor: 'full',
    state_leadership: 'full',
  },
  services: {
    school_coordinator: 'full',
    dars_counselor: 'full',
    vendor: 'full',
    state_leadership: 'summary',
  },
  funding: {
    school_coordinator: 'none',
    dars_counselor: 'full',
    vendor: 'summary',
    state_leadership: 'full',
  },
  documents: {
    school_coordinator: 'full',
    dars_counselor: 'full',
    vendor: 'full',
    state_leadership: 'summary',
  },
  employers: {
    school_coordinator: 'full',
    dars_counselor: 'full',
    vendor: 'full',
    state_leadership: 'none',
  },
  audit: {
    school_coordinator: 'none',
    dars_counselor: 'full',
    vendor: 'none',
    state_leadership: 'full',
  },
};

/** Why each role sees what it sees — shown next to the table, in plain words. */
export const ROLE_NEED: Record<Role, string> = {
  school_coordinator:
    'Refers the student and supports the family, so sees the profile, services, and the documents the school provided. Funding is not the school’s to manage.',
  dars_counselor:
    'Owns the case, so sees everything: the full record, funding, every document, and who has opened it.',
  vendor:
    'Delivers the services, so sees the profile, its own services, and the hours it still has authorized — never medical records or the student’s name.',
  state_leadership:
    'Oversees the program, so sees the journey, funding, and audit trail by Transition ID — never a name or the contents of a document.',
};

export function sectionAccess(role: Role, section: RecordSection): SectionAccess {
  return SECTION_ACCESS[section][role];
}

/* --------------------------------------------------------------------------
   Documents
   -------------------------------------------------------------------------- */

export type DocumentAccessLevel = 'ALL_TEAM' | 'SCHOOL_DARS' | 'DARS_PROVIDER' | 'DARS_ONLY';

export const ACCESS_LEVEL_LABELS: Record<DocumentAccessLevel, string> = {
  ALL_TEAM: 'School, DARS, and provider',
  SCHOOL_DARS: 'School and DARS only',
  DARS_PROVIDER: 'DARS and provider only',
  DARS_ONLY: 'DARS only',
};

const DOCUMENT_READERS: Record<DocumentAccessLevel, readonly Role[]> = {
  ALL_TEAM: ['school_coordinator', 'dars_counselor', 'vendor'],
  SCHOOL_DARS: ['school_coordinator', 'dars_counselor'],
  DARS_PROVIDER: ['dars_counselor', 'vendor'],
  DARS_ONLY: ['dars_counselor'],
};

/** May this role open (view) a document at this access level? State never opens content. */
export function canOpenDocument(role: Role, level: DocumentAccessLevel): boolean {
  return DOCUMENT_READERS[level].includes(role);
}

/** Only DARS keeps a downloadable copy. Everyone else views inside the platform. */
export function canDownloadDocument(role: Role, level: DocumentAccessLevel): boolean {
  return role === 'dars_counselor' && canOpenDocument(role, level);
}

/** Who may add a document to the secure folder. */
export function canAddDocuments(role: Role): boolean {
  return role !== 'state_leadership';
}

/* --------------------------------------------------------------------------
   Downloads
   -------------------------------------------------------------------------- */

/**
 * Two kinds of download. 'records' is anything with one row per student or referral;
 * 'aggregate' is counts, rates, and totals with no individual in them.
 */
export type ExportKind = 'records' | 'aggregate';

export interface ExportPolicy {
  allowed: boolean;
  /** Shown when a download is refused, and on the confirmation when it is allowed. */
  explanation: string;
}

export function exportPolicy(role: Role | null, kind: ExportKind): ExportPolicy {
  if (!role) {
    return { allowed: false, explanation: 'Sign in to download.' };
  }
  if (kind === 'aggregate') {
    return {
      allowed: true,
      explanation: 'Totals only — no individual student is in this file.',
    };
  }
  if (role === 'vendor') {
    return {
      allowed: false,
      explanation:
        'Provider accounts cannot download student lists. Your roster stays in the platform, where access is controlled and recorded. Your DARS counselor can send you what you need.',
    };
  }
  return {
    allowed: true,
    explanation:
      'Names are removed — students appear by Transition ID only — and the file is stamped with your name, the time, and your reason.',
  };
}

/** Why someone is downloading. Recorded in the audit trail with the download. */
export const EXPORT_PURPOSES = [
  'State or federal reporting',
  'Case coordination with my team',
  'Program monitoring',
  'Preparing for a meeting',
] as const;

/* --------------------------------------------------------------------------
   Caseload scope — is this student actually mine?
   -------------------------------------------------------------------------- */

export interface ScopeResult {
  inScope: boolean;
  /** Plain-language reason, shown when access is refused. */
  reason: string;
}

export function recordScope(
  role: Role,
  persona: Pick<Persona, 'scopeId'> | undefined,
  student: { divisionId: string },
  studentReferrals: Pick<StoredReferral, 'darsDistrictId' | 'assignedVendorId' | 'offeredVendorIds'>[],
): ScopeResult {
  if (role === 'state_leadership') {
    return { inScope: true, reason: 'State leadership oversees every record, by Transition ID.' };
  }
  const scope = persona?.scopeId;
  if (!scope) return { inScope: false, reason: 'This view has no caseload attached.' };

  if (role === 'school_coordinator') {
    return student.divisionId === scope
      ? { inScope: true, reason: 'This student attends a school in your division.' }
      : { inScope: false, reason: 'This student is not enrolled in your school division.' };
  }
  if (role === 'dars_counselor') {
    return studentReferrals.some((r) => r.darsDistrictId === scope)
      ? { inScope: true, reason: 'This student has a referral in your district.' }
      : { inScope: false, reason: 'This student has no referral in your district.' };
  }
  // A provider sees students it has been assigned — and, while deciding, students it has
  // been offered. Nobody else's.
  return studentReferrals.some(
    (r) => r.assignedVendorId === scope || r.offeredVendorIds.includes(scope),
  )
    ? { inScope: true, reason: 'This student was referred to your organization.' }
    : { inScope: false, reason: 'This student has not been referred to your organization.' };
}

/** May this role, in scope, ask to see the student's name? */
export function canRevealName(role: Role, inScope: boolean): boolean {
  return inScope && (role === 'school_coordinator' || role === 'dars_counselor');
}
