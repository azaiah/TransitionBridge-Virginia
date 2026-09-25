/**
 * The vocabulary of the access and audit log, shared by the live session log
 * (src/lib/session-store.ts), the month of history before it (audit-history.json), and each
 * record's own trail. Pure — no browser access — so the generator and tests can use it.
 */
import type { AuditAction, AuditEvent } from '@/data/types';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  NAME_VIEWED: 'Viewed a student’s name',
  DOCUMENT_VIEWED: 'Opened a document',
  DOCUMENT_ADDED: 'Added a document',
  DOCUMENT_DOWNLOADED: 'Downloaded a document',
  DOCUMENT_REFUSED: 'Tried to open a restricted document',
  EXPORT_DOWNLOADED: 'Downloaded a list',
  EXPORT_REFUSED: 'Download refused',
  RECORD_REFUSED: 'Tried to open a record outside their caseload',
  RECORD_OPENED: 'Opened a transition record',
  AUTHORIZATION_EXTENDED: 'Extended an authorization',
  SERVICE_LOGGED: 'Logged a service',
  SERVICE_REFUSED: 'Service blocked — over authorization',
  JOB_SHARED: 'Shared a job posting with a student’s team',
};

/** Actions that mean someone was stopped. Shown with a warning treatment. */
export const REFUSAL_ACTIONS: ReadonlySet<AuditAction> = new Set([
  'DOCUMENT_REFUSED',
  'EXPORT_REFUSED',
  'RECORD_REFUSED',
  'SERVICE_REFUSED',
]);

/** Actions that are someone looking at something, rather than changing it. */
export const ACCESS_ACTIONS: ReadonlySet<AuditAction> = new Set([
  'NAME_VIEWED',
  'DOCUMENT_VIEWED',
  'DOCUMENT_DOWNLOADED',
  'DOCUMENT_REFUSED',
  'RECORD_OPENED',
  'RECORD_REFUSED',
  'EXPORT_DOWNLOADED',
  'EXPORT_REFUSED',
]);

/** Newest first, the way every log screen shows it. */
export function newestFirst(events: AuditEvent[]): AuditEvent[] {
  return [...events].sort((a, b) => b.at.localeCompare(a.at));
}
