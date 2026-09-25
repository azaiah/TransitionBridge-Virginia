/**
 * Students and referrals — the record-level data most operational screens need.
 *
 * Service records live in `@/data/services` so a queue or a roster does not download
 * twelve megabytes of service logs it never renders. Import this module only from routes
 * that show record-level detail.
 *
 * Both files arrive packed (see `packed.ts`) and are rebuilt into full records once, on
 * first import. Referral event timelines are derived on demand (src/lib/timeline.ts)
 * rather than stored.
 */
import referralsJson from './generated/referrals.json';
import studentsJson from './generated/students.json';
import { demoData } from './index';
import { unpackReferrals, unpackStudents, type PackedTable, type SchoolPlacement } from './packed';
import { withTimeline } from '@/lib/timeline';
import type { Referral, StoredReferral, Student } from './types';

/** School → its division, district, and locality. Rebuilds the omitted columns. */
const placements = new Map<string, SchoolPlacement>();
const divisionById = new Map(demoData.divisions.map((d) => [d.id, d]));
for (const school of demoData.schools) {
  const division = divisionById.get(school.divisionId);
  if (!division) continue;
  placements.set(school.id, {
    divisionId: division.id,
    darsDistrictId: division.darsDistrictId,
    localityFips: division.localityFips,
  });
}

const placementOf = (schoolId: string) => placements.get(schoolId);

export const students: Student[] = unpackStudents(
  studentsJson as unknown as PackedTable,
  placementOf,
);
export const referrals: StoredReferral[] = unpackReferrals(
  referralsJson as unknown as PackedTable,
  placementOf,
);

const studentIndex = new Map(students.map((s) => [s.id, s]));
const referralIndex = new Map(referrals.map((r) => [r.id, r]));

export function getStudentById(id: string): Student | undefined {
  return studentIndex.get(id);
}

export function getReferralById(id: string): StoredReferral | undefined {
  return referralIndex.get(id);
}

/** A referral with its full event timeline, ready to render as a case history. */
export function getReferralWithTimeline(id: string): Referral | undefined {
  const referral = referralIndex.get(id);
  if (!referral) return undefined;
  return withTimeline(referral, studentIndex.get(referral.studentId));
}

export function getReferralsForDistrict(districtId: string): StoredReferral[] {
  return referrals.filter((r) => r.darsDistrictId === districtId);
}

export function getReferralsForDivision(divisionId: string): StoredReferral[] {
  return referrals.filter((r) => r.divisionId === divisionId);
}

export function getReferralsForVendor(vendorId: string): StoredReferral[] {
  return referrals.filter((r) => r.assignedVendorId === vendorId);
}

const referralsByStudent = new Map<string, StoredReferral[]>();
for (const referral of referrals) {
  const list = referralsByStudent.get(referral.studentId) ?? [];
  list.push(referral);
  referralsByStudent.set(referral.studentId, list);
}

/** Every referral on a student's record, oldest first. */
export function getReferralsForStudent(studentId: string): StoredReferral[] {
  return [...(referralsByStudent.get(studentId) ?? [])].sort((a, b) =>
    a.submittedAt.localeCompare(b.submittedAt),
  );
}
