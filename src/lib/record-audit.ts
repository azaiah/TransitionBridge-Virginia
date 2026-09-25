/**
 * The audit trail for one student's record: "who did what" — who referred, who reviewed,
 * who uploaded the last document, who opened it, who looked at the name, who changed an
 * authorization.
 *
 * The history before this session is DERIVED from the record (timelines, document history,
 * authorizations), like everything else record-level. Actions taken during this session
 * come from src/lib/session-store.ts and are merged on screen.
 */
import type { AuditEvent, Authorization, Referral } from '@/data/types';
import { FUNDING_SOURCE_LABELS, REFERRAL_EVENT_LABELS } from '@/data/types';
import { ACCESS_ACTIONS, AUDIT_ACTION_LABELS, REFUSAL_ACTIONS } from './audit';
import { DEMO_NOW_MS, MS_PER_DAY } from './demo-clock';
import { keyedRandom } from './hash';
import { REVEAL_REASONS } from './identity';
import { DOCUMENT_TYPE_LABELS, type SecureDocument } from './transition-record';

export type AuditKind = 'access' | 'change';

export interface RecordAuditEntry {
  id: string;
  at: string;
  actorPersonaId: string;
  kind: AuditKind;
  action: string;
  subject: string;
  reason?: string;
  /** Someone was stopped — shown with a warning treatment. */
  refused?: boolean;
}

export function buildRecordAuditTrail(input: {
  studentId: string;
  referrals: Referral[];
  documents: SecureDocument[];
  authorizations: Authorization[];
  /** Entries for this student from the statewide access log (audit-history.json). */
  history?: AuditEvent[];
}): RecordAuditEntry[] {
  const entries: RecordAuditEntry[] = [];

  // The statewide log and the record's own trail are the same entries, seen from two places.
  for (const event of input.history ?? []) {
    entries.push({
      id: event.id,
      at: event.at,
      actorPersonaId: event.actorPersonaId,
      kind: ACCESS_ACTIONS.has(event.action) ? 'access' : 'change',
      action: AUDIT_ACTION_LABELS[event.action],
      subject: event.subject,
      reason: event.reason,
      refused: REFUSAL_ACTIONS.has(event.action),
    });
  }

  for (const referral of input.referrals) {
    for (const event of referral.events) {
      entries.push({
        id: event.id,
        at: event.at,
        actorPersonaId: event.actorPersonaId,
        kind: 'change',
        action: REFERRAL_EVENT_LABELS[event.type],
        subject: `Referral ${referral.id}`,
      });
    }
  }

  for (const doc of input.documents) {
    doc.history.forEach((h, i) => {
      entries.push({
        id: `${doc.id}-H${i}`,
        at: h.at,
        actorPersonaId: h.actorPersonaId,
        kind: h.action === 'VIEWED' || h.action === 'DOWNLOADED' ? 'access' : 'change',
        action:
          h.action === 'UPLOADED'
            ? 'Added a document'
            : h.action === 'VIEWED'
              ? 'Opened a document'
              : h.action === 'DOWNLOADED'
                ? 'Downloaded a document'
                : 'Set a document’s access level',
        subject: DOCUMENT_TYPE_LABELS[doc.type],
      });
    });
  }

  const counselor = input.referrals.find((r) => r.reviewedByPersonaId)?.reviewedByPersonaId ?? null;
  for (const auth of input.authorizations) {
    if (!counselor) break;
    entries.push({
      id: `${auth.id}-issued`,
      at: `${auth.startDate}T12:00:00.000Z`,
      actorPersonaId: counselor,
      kind: 'change',
      action: 'Issued a funding authorization',
      subject: `${FUNDING_SOURCE_LABELS[auth.source]} · ${auth.hoursAuthorized} hours`,
    });
  }

  // Earlier name views by the student's own team, so the trail shows what one looks like.
  const random = keyedRandom(`name-views:${input.studentId}`);
  const first = input.referrals[0];
  const viewers = [first?.submittedByPersonaId, counselor].filter((v): v is string => Boolean(v));
  if (first && viewers.length > 0) {
    const views = Math.floor(random() * 3);
    for (let i = 0; i < views; i++) {
      const at = new Date(Date.parse(first.submittedAt) + (2 + random() * 40) * MS_PER_DAY).toISOString();
      entries.push({
        id: `${input.studentId}-NV${i}`,
        at,
        actorPersonaId: viewers[i % viewers.length]!,
        kind: 'access',
        action: 'Viewed the student’s name',
        subject: 'Restricted identity',
        reason: REVEAL_REASONS[Math.floor(random() * REVEAL_REASONS.length)],
      });
    }
  }

  return entries
    .filter((e) => Date.parse(e.at) <= DEMO_NOW_MS)
    .sort((a, b) => b.at.localeCompare(a.at));
}
