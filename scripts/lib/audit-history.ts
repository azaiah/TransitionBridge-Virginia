/**
 * The month of activity before the demonstration — what the Access and audit log shows
 * the first time anyone opens it.
 *
 * Every entry is built from the real synthetic records, and obeys the same rules the
 * screens enforce, so the log ties out with everything else:
 *
 *   - a name is shown only by the student's own school or DARS counselor, with a reason;
 *   - a document is opened only by a role its access level allows, after it was added;
 *   - a refused service is a real authorization that the session would have gone past;
 *   - an extension is on an authorization that really is near or over its hours;
 *   - a shared job is a real posting that really matches the student;
 *   - a refused record is a student who really is outside the person's caseload.
 *
 * The default sign-in accounts (A. Davis, C. Smith, R. Miller, J. Brown) appear often, so
 * whoever presents sees their own history. Drawn from its own seeded stream, so nothing
 * else in the dataset moves.
 */
import type {
  AuditAction,
  AuditEvent,
  Authorization,
  Employer,
  JobPosting,
  OutcomeRecord,
  Persona,
  Role,
  School,
  ServiceRecord,
  StoredReferral,
  Student,
} from '../../src/data/types';
import { ACTIVITY_LABELS, FUNDING_SOURCE_LABELS, PRE_ETS_ACTIVITIES } from '../../src/data/types';
import { canDownloadDocument, canOpenDocument, recordScope } from '../../src/lib/access';
import { DEMO_NOW_MS, MS_PER_DAY } from '../../src/lib/demo-clock';
import {
  EXTEND_REASONS,
  authorizationStatus,
  checkNewService,
  formatHours,
} from '../../src/lib/funding';
import { buildTransitionId, REVEAL_REASONS } from '../../src/lib/identity';
import {
  DOCUMENT_TYPE_LABELS,
  buildDocuments,
  buildReadinessProfile,
  careerInterestFor,
  matchEmployers,
  type SecureDocument,
} from '../../src/lib/transition-record';
import { EXPORT_PURPOSES } from '../../src/lib/access';
import { pick, randInt, subRng, weightedPick, type Rng } from './prng';

/** How far back the history goes, in days before the demonstration "now". */
export const AUDIT_HISTORY_DAYS = 30;

const ACTIVE_STATUSES = new Set(['UNDER_REVIEW', 'AWAITING_CONSENT', 'READY_TO_ASSIGN', 'ASSIGNED', 'IN_SERVICE']);

interface Input {
  seed: number;
  students: Student[];
  referrals: StoredReferral[];
  serviceRecords: ServiceRecord[];
  outcomes: OutcomeRecord[];
  schools: School[];
  personas: Persona[];
  authorizations: Authorization[];
  employers: Employer[];
  postings: JobPosting[];
}

type Draft = Omit<AuditEvent, 'id'>;

export function buildAuditHistory(input: Input): AuditEvent[] {
  const rng = subRng(input.seed, 'audit-history');
  const schoolName = new Map(input.schools.map((s) => [s.id, s.name]));
  const studentById = new Map(input.students.map((s) => [s.id, s]));
  const tid = (studentId: string) => {
    const s = studentById.get(studentId);
    return s ? buildTransitionId(schoolName.get(s.schoolId) ?? '', s.id) : studentId;
  };

  // Referrals per student, oldest first — the same order the record screen uses.
  const refsByStudent = new Map<string, StoredReferral[]>();
  for (const r of input.referrals) {
    const list = refsByStudent.get(r.studentId) ?? [];
    list.push(r);
    refsByStudent.set(r.studentId, list);
  }
  for (const list of refsByStudent.values()) list.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  const servicesByStudent = new Map<string, ServiceRecord[]>();
  for (const s of input.serviceRecords) {
    const list = servicesByStudent.get(s.studentId) ?? [];
    list.push(s);
    servicesByStudent.set(s.studentId, list);
  }
  const outcomesByStudent = new Map<string, OutcomeRecord[]>();
  for (const o of input.outcomes) {
    const list = outcomesByStudent.get(o.studentId) ?? [];
    list.push(o);
    outcomesByStudent.set(o.studentId, list);
  }
  const authsByStudent = new Map<string, Authorization[]>();
  for (const a of input.authorizations) {
    const list = authsByStudent.get(a.studentId) ?? [];
    list.push(a);
    authsByStudent.set(a.studentId, list);
  }
  const employerById = new Map(input.employers.map((e) => [e.id, e]));

  // Derived exactly as the record screen derives them, so a document named here exists there.
  const docCache = new Map<string, SecureDocument[]>();
  const documentsFor = (studentId: string): SecureDocument[] => {
    const hit = docCache.get(studentId);
    if (hit) return hit;
    const student = studentById.get(studentId);
    const refs = refsByStudent.get(studentId) ?? [];
    if (!student || refs.length === 0) return [];
    const services = servicesByStudent.get(studentId) ?? [];
    const profile = buildReadinessProfile(student, services, outcomesByStudent.get(studentId) ?? [], refs);
    const docs = buildDocuments(student, refs, services, profile);
    docCache.set(studentId, docs);
    return docs;
  };

  // Caseloads, by persona.
  const byRole = (role: Role) => input.personas.filter((p) => p.role === role);
  const defaults = {
    dars: input.personas.find((p) => p.role === 'dars_counselor')!,
    school: input.personas.find((p) => p.role === 'school_coordinator')!,
    vendor: input.personas.find((p) => p.role === 'vendor')!,
    state: input.personas.find((p) => p.role === 'state_leadership')!,
  };

  const caseCache = new Map<string, string[]>();
  const caseloadOf = (persona: Persona): string[] => {
    const hit = caseCache.get(persona.id);
    if (hit) return hit;
    const ids = new Set<string>();
    for (const r of input.referrals) {
      const mine =
        persona.role === 'dars_counselor'
          ? r.darsDistrictId === persona.scopeId
          : persona.role === 'school_coordinator'
            ? r.divisionId === persona.scopeId
            : persona.role === 'vendor'
              ? r.assignedVendorId === persona.scopeId
              : ACTIVE_STATUSES.has(r.status);
      // Prefer students someone is actively working with.
      if (mine && (persona.role !== 'dars_counselor' || ACTIVE_STATUSES.has(r.status) || r.status === 'COMPLETED')) {
        ids.add(r.studentId);
      }
    }
    const list = [...ids].sort();
    caseCache.set(persona.id, list);
    return list;
  };

  const inScope = (persona: Persona, studentId: string) => {
    const s = studentById.get(studentId);
    if (!s) return false;
    return recordScope(persona.role, persona, s, refsByStudent.get(studentId) ?? []).inScope;
  };

  // Weekday business-hours instants in the month before "now" (08:30–17:00 Eastern).
  const dayStarts: number[] = [];
  for (let d = AUDIT_HISTORY_DAYS; d >= 0; d--) {
    const day = new Date(DEMO_NOW_MS - d * MS_PER_DAY);
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    dayStarts.push(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 12, 30));
  }
  const timeOn = (r: Rng, dayStart: number) => dayStart + randInt(r, 0, 510) * 60_000;

  const drafts: Draft[] = [];
  const push = (d: Draft) => {
    if (Date.parse(d.at) <= DEMO_NOW_MS) drafts.push(d);
  };
  const at = (ms: number) => new Date(ms).toISOString();

  const firstSubmitted = (studentId: string) => Date.parse(refsByStudent.get(studentId)?.[0]?.submittedAt ?? '2100-01-01');

  // Who acts: the four default accounts often, everyone else some of the time.
  const pickActor = (r: Rng): Persona =>
    weightedPick(r, [
      [defaults.dars, 26],
      [defaults.school, 10],
      [defaults.vendor, 14],
      [defaults.state, 8],
      [pick(r, byRole('dars_counselor')), 16],
      [pick(r, byRole('school_coordinator')), 14],
      [pick(r, byRole('vendor')), 12],
    ] as const);

  const ACTIONS: Record<Role, readonly (readonly [AuditAction, number])[]> = {
    dars_counselor: [
      ['RECORD_OPENED', 24],
      ['NAME_VIEWED', 16],
      ['DOCUMENT_VIEWED', 16],
      ['DOCUMENT_DOWNLOADED', 5],
      ['AUTHORIZATION_EXTENDED', 9],
      ['EXPORT_DOWNLOADED', 9],
      ['JOB_SHARED', 9],
      ['RECORD_REFUSED', 2],
    ],
    school_coordinator: [
      ['RECORD_OPENED', 28],
      ['NAME_VIEWED', 22],
      ['DOCUMENT_VIEWED', 18],
      ['EXPORT_DOWNLOADED', 8],
      ['JOB_SHARED', 8],
      ['RECORD_REFUSED', 4],
    ],
    vendor: [
      ['RECORD_OPENED', 20],
      ['SERVICE_LOGGED', 30],
      ['SERVICE_REFUSED', 12],
      ['DOCUMENT_VIEWED', 12],
      ['EXPORT_REFUSED', 8],
      ['JOB_SHARED', 8],
      ['RECORD_REFUSED', 8],
    ],
    state_leadership: [
      ['RECORD_OPENED', 35],
      ['EXPORT_DOWNLOADED', 65],
    ],
  };

  const EXPORTS: Record<Role, readonly (readonly [string, (p: Persona) => number, 'records' | 'aggregate'])[]> = {
    dars_counselor: [
      ['referral-queue.csv', (p) => input.referrals.filter((r) => r.darsDistrictId === p.scopeId && ACTIVE_STATUSES.has(r.status)).length, 'records'],
      ['district-students.csv', (p) => new Set(input.referrals.filter((r) => r.darsDistrictId === p.scopeId).map((r) => r.studentId)).size, 'records'],
      ['authorizations.csv', (p) => input.authorizations.filter((a) => refsByStudent.get(a.studentId)?.some((r) => r.darsDistrictId === p.scopeId)).length, 'records'],
    ],
    school_coordinator: [
      ['consent-outstanding.csv', (p) => input.referrals.filter((r) => r.divisionId === p.scopeId && r.status === 'AWAITING_CONSENT').length, 'records'],
      ['documentation-gaps.csv', (p) => input.referrals.filter((r) => r.divisionId === p.scopeId && ACTIVE_STATUSES.has(r.status)).length, 'records'],
    ],
    state_leadership: [
      ['district-comparison.csv', () => 6, 'aggregate'],
      ['funding-by-district.csv', () => 6, 'aggregate'],
      ['funding-by-source.csv', () => 7, 'aggregate'],
      ['early-warnings-by-district.csv', () => 6, 'aggregate'],
      ['provider-scorecards.csv', () => input.personas.filter((p) => p.role === 'vendor').length, 'aggregate'],
    ],
    vendor: [],
  };

  for (const dayStart of dayStarts) {
    const count = randInt(rng, 9, 15);
    for (let n = 0; n < count; n++) {
      const actor = pickActor(rng);
      const action = weightedPick(rng, ACTIONS[actor.role]);
      const when = timeOn(rng, dayStart);
      const base = { actorRole: actor.role, actorPersonaId: actor.id } as const;

      // A student this person really works with, referred before this moment.
      const caseload = caseloadOf(actor);
      const studentFor = (filter?: (id: string) => boolean): string | null => {
        for (let tries = 0; tries < 25 && caseload.length > 0; tries++) {
          const id = pick(rng, caseload);
          if (firstSubmitted(id) < when && (!filter || filter(id))) return id;
        }
        return null;
      };

      switch (action) {
        case 'RECORD_OPENED': {
          const id = studentFor();
          if (id) push({ ...base, at: at(when), action, studentId: id, subject: tid(id) });
          break;
        }
        case 'NAME_VIEWED': {
          const id = studentFor();
          if (!id) break;
          // Opened the record first, then asked for the name.
          push({ ...base, at: at(when), action: 'RECORD_OPENED', studentId: id, subject: tid(id) });
          push({
            ...base,
            at: at(when + randInt(rng, 1, 4) * 60_000),
            action,
            studentId: id,
            subject: tid(id),
            reason: pick(rng, REVEAL_REASONS),
          });
          break;
        }
        case 'DOCUMENT_VIEWED':
        case 'DOCUMENT_DOWNLOADED': {
          const id = studentFor((sid) =>
            documentsFor(sid).some(
              (d) =>
                Date.parse(d.uploadedAt) < when &&
                (action === 'DOCUMENT_VIEWED'
                  ? canOpenDocument(actor.role, d.accessLevel)
                  : canDownloadDocument(actor.role, d.accessLevel)),
            ),
          );
          if (!id) break;
          const docs = documentsFor(id).filter(
            (d) =>
              Date.parse(d.uploadedAt) < when &&
              (action === 'DOCUMENT_VIEWED'
                ? canOpenDocument(actor.role, d.accessLevel)
                : canDownloadDocument(actor.role, d.accessLevel)),
          );
          const doc = pick(rng, docs);
          push({
            ...base,
            at: at(when),
            action,
            studentId: id,
            subject: `${DOCUMENT_TYPE_LABELS[doc.type]} · ${tid(id)}`,
            detail: doc.id,
          });
          break;
        }
        case 'AUTHORIZATION_EXTENDED': {
          const id = studentFor((sid) =>
            (authsByStudent.get(sid) ?? []).some((a) => authorizationStatus(a) !== 'OK'),
          );
          if (!id) break;
          const auth = (authsByStudent.get(id) ?? []).find((a) => authorizationStatus(a) !== 'OK')!;
          push({
            ...base,
            at: at(when),
            action,
            studentId: id,
            subject: `${FUNDING_SOURCE_LABELS[auth.source]} · ${tid(id)}`,
            reason: pick(rng, EXTEND_REASONS),
            detail: `+${pick(rng, [2, 4, 5, 6, 8])} hours (${auth.id})`,
          });
          break;
        }
        case 'SERVICE_LOGGED': {
          const id = studentFor((sid) =>
            (authsByStudent.get(sid) ?? []).some((a) => a.source === 'DARS' && authorizationStatus(a) === 'OK'),
          );
          if (!id) break;
          const minutes = pick(rng, [30, 45, 60, 60, 90]);
          const activity = pick(rng, PRE_ETS_ACTIVITIES);
          push({
            ...base,
            at: at(when),
            action,
            studentId: id,
            subject: tid(id),
            detail: `${ACTIVITY_LABELS[activity]} · ${minutes} min`,
          });
          break;
        }
        case 'SERVICE_REFUSED': {
          const minutes = pick(rng, [60, 90, 120]);
          const id = studentFor((sid) => {
            const auth = (authsByStudent.get(sid) ?? []).find((a) => a.source === 'DARS');
            return auth ? !checkNewService(auth, minutes).allowed : false;
          });
          if (!id) break;
          const auth = (authsByStudent.get(id) ?? []).find((a) => a.source === 'DARS')!;
          push({
            ...base,
            at: at(when),
            action,
            studentId: id,
            subject: tid(id),
            detail: `${minutes} min would exceed the authorization by ${formatHours(checkNewService(auth, minutes).overBy)}`,
          });
          break;
        }
        case 'JOB_SHARED': {
          const id = studentFor();
          if (!id) break;
          const latest = refsByStudent.get(id)!.at(-1)!;
          const student = studentById.get(id)!;
          const matches = matchEmployers(
            { careerInterest: careerInterestFor(id) },
            student,
            latest.darsDistrictId,
            input.postings,
            employerById,
          );
          if (matches.length === 0) break;
          const m = pick(rng, matches.slice(0, 3));
          push({
            ...base,
            at: at(when),
            action,
            studentId: id,
            subject: `${m.posting.title} at ${m.employer.name} · ${tid(id)}`,
          });
          break;
        }
        case 'RECORD_REFUSED': {
          // Someone else's student: a referral in a nearby district or another division.
          for (let tries = 0; tries < 25; tries++) {
            const r = pick(rng, input.referrals);
            if (Date.parse(r.submittedAt) > when || inScope(actor, r.studentId)) continue;
            push({ ...base, at: at(when), action, studentId: r.studentId, subject: tid(r.studentId) });
            break;
          }
          break;
        }
        case 'EXPORT_DOWNLOADED': {
          const options = EXPORTS[actor.role];
          if (options.length === 0) break;
          const [file, rows, kind] = pick(rng, options);
          const rowCount = rows(actor);
          if (rowCount === 0) break;
          push({
            ...base,
            at: at(when),
            action,
            subject: file,
            reason: pick(rng, EXPORT_PURPOSES),
            detail: `${rowCount.toLocaleString('en-US')} rows · ${kind === 'records' ? 'student-level, names removed' : 'totals only'}`,
          });
          break;
        }
        case 'EXPORT_REFUSED': {
          const roster = caseload.length;
          if (roster === 0) break;
          push({ ...base, at: at(when), action, subject: 'vendor-roster.csv', detail: `${roster.toLocaleString('en-US')} rows requested` });
          break;
        }
        default:
          break;
      }
    }
  }

  // Oldest first for the ids, newest first for display.
  drafts.sort((a, b) => a.at.localeCompare(b.at) || a.actorPersonaId.localeCompare(b.actorPersonaId));
  return drafts
    .map((d, i) => ({ id: `DEMO-AUD-${String(i + 1).padStart(6, '0')}`, ...d }))
    .reverse();
}
