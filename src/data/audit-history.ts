/**
 * The month of access-log activity before the demonstration — built by the generator from
 * the same records every screen shows (scripts/lib/audit-history.ts). Small; loaded by the
 * statewide audit log and by each student's transition record.
 */
import historyJson from './generated/audit-history.json';
import type { AuditEvent } from './types';

/** Newest first. */
export const auditHistory = historyJson as unknown as AuditEvent[];

const byStudent = new Map<string, AuditEvent[]>();
for (const event of auditHistory) {
  if (!event.studentId) continue;
  const list = byStudent.get(event.studentId) ?? [];
  list.push(event);
  byStudent.set(event.studentId, list);
}

export function getAuditHistoryForStudent(studentId: string): AuditEvent[] {
  return byStudent.get(studentId) ?? [];
}
