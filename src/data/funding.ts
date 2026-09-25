/**
 * Funding authorizations — record-level, so only the funding screens and the transition
 * record load this file. Statewide and district totals are precomputed in aggregates.
 */
import authorizationsJson from './generated/authorizations.json';
import { getReferralById } from './records';
import { unpackAuthorizations, type PackedTable } from './packed';
import type { Authorization } from './types';

export const authorizations: Authorization[] = unpackAuthorizations(
  authorizationsJson as unknown as PackedTable,
  (referralId) => getReferralById(referralId)?.studentId,
);

const byStudent = new Map<string, Authorization[]>();
for (const auth of authorizations) {
  const list = byStudent.get(auth.studentId) ?? [];
  list.push(auth);
  byStudent.set(auth.studentId, list);
}

export function getAuthorizationsForStudent(studentId: string): Authorization[] {
  return byStudent.get(studentId) ?? [];
}

export function getAuthorizationsForDistrict(districtId: string): Authorization[] {
  return authorizations.filter(
    (a) => getReferralById(a.referralId)?.darsDistrictId === districtId,
  );
}

export function getAuthorizationsForVendor(vendorId: string): Authorization[] {
  return authorizations.filter(
    (a) => getReferralById(a.referralId)?.assignedVendorId === vendorId,
  );
}

/** The DARS Pre-ETS authorization for a referral — the one the service log checks. */
export function getPreEtsAuthorization(referralId: string): Authorization | undefined {
  return authorizations.find((a) => a.referralId === referralId && a.source === 'DARS');
}
