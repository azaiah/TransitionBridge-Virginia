/** Outcome records — loaded only by the transition record, which shows a student's outcome. */
import outcomesJson from './generated/outcomes.json';
import type { OutcomeRecord } from './types';

export const outcomes = outcomesJson as unknown as OutcomeRecord[];

const byStudent = new Map<string, OutcomeRecord[]>();
for (const outcome of outcomes) {
  const list = byStudent.get(outcome.studentId) ?? [];
  list.push(outcome);
  byStudent.set(outcome.studentId, list);
}

export function getOutcomesForStudent(studentId: string): OutcomeRecord[] {
  return byStudent.get(studentId) ?? [];
}
