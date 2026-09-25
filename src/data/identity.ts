/**
 * Transition IDs for records, using the light geography every screen already loads.
 * The rules themselves live in src/lib/identity.ts.
 */
import { demoData } from './index';
import { buildTransitionId } from '@/lib/identity';

const schoolNameById = new Map(demoData.schools.map((s) => [s.id, s.name]));
const cache = new Map<string, string>();

/** "AN-VA-004661" for a student, given the high school on their record. */
export function transitionIdFor(student: { id: string; schoolId: string }): string {
  const key = `${student.schoolId}|${student.id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const id = buildTransitionId(schoolNameById.get(student.schoolId) ?? 'High School', student.id);
  cache.set(key, id);
  return id;
}
