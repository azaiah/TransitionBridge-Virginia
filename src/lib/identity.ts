/**
 * The restricted identity layer.
 *
 * Every screen identifies a student by a Transition ID, never by name:
 *
 *     WH-VA-004661
 *     │  │  └─ student number (unique statewide)
 *     │  └──── state
 *     └─────── high school code
 *
 * A name is shown only when someone with a working reason to know it (the referring school,
 * or the student's DARS counselor) asks to see it — and that request is written to the audit
 * trail with who, when, and why. Providers and state leadership never see a name.
 *
 * Everything here is a pure function so the rules can be unit tested.
 */
import type { Role } from '@/data/types';

/** The state segment of every Transition ID. */
export const STATE_CODE = 'VA';

/** Words that describe what kind of school it is rather than which school it is. */
const SCHOOL_TYPE_WORDS = new Set([
  'high',
  'school',
  'senior',
  'technical',
  'center',
  'academy',
  'secondary',
  'public',
  'schools',
]);

/**
 * Two-letter high school code. Initials of the first two words that name the school
 * ("Accomack North Senior High School" → "AN"), or the first two letters of a one-word name
 * ("Norfolk High School" → "NO"). Codes are for reading, not for uniqueness — the student
 * number carries the uniqueness.
 */
export function schoolCode(schoolName: string): string {
  const words = schoolName
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !SCHOOL_TYPE_WORDS.has(w.toLowerCase()));

  if (words.length === 0) return 'HS';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase().padEnd(2, 'X');
  return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
}

/** The six-digit student number carried by the internal record id (DEMO-STU-004661). */
export function studentNumber(studentId: string): string {
  const digits = studentId.replace(/\D/g, '');
  return digits.slice(-6).padStart(6, '0');
}

/** "AN-VA-004661". */
export function buildTransitionId(schoolName: string, studentId: string): string {
  return `${schoolCode(schoolName)}-${STATE_CODE}-${studentNumber(studentId)}`;
}

/** True for anything shaped like a Transition ID, so search can recognise one typed in. */
export function looksLikeTransitionId(value: string): boolean {
  return /^[A-Z]{2}-VA-\d{6}$/i.test(value.trim());
}

/**
 * Who may ask to see a student's name at all. Everyone else works from the ID only.
 * The scope check (is this student actually on my caseload?) lives in src/lib/access.ts.
 */
export const NAME_REVEAL_ROLES: readonly Role[] = ['school_coordinator', 'dars_counselor'];

export function roleMayRevealNames(role: Role | null): boolean {
  return role !== null && NAME_REVEAL_ROLES.includes(role);
}

/** Why someone is asking to see a name. The reason is written to the audit trail. */
export const REVEAL_REASONS = [
  'Contacting the student or family',
  'Preparing for a meeting with the student',
  'Confirming I have the right student',
  'Completing a required form',
] as const;

export type RevealReason = (typeof REVEAL_REASONS)[number];
