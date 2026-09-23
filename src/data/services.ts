/**
 * Service records — about 46,000 rows, the heaviest file in the dataset.
 *
 * Kept in its own module on purpose. Only two screens read individual services: the
 * student's service history and the RSA-911 export. Every other screen — including the
 * provider dashboard, which reads its count off the precomputed scorecard — would
 * otherwise pay for a file it never draws.
 *
 * Rows arrive packed (see `packed.ts`); the student on each service is recovered from the
 * referral it belongs to rather than stored 46,000 times.
 */
import servicesJson from './generated/services.json';
import { getReferralById } from './records';
import { unpackServices, type PackedTable } from './packed';
import type { ServiceRecord } from './types';

export const serviceRecords: ServiceRecord[] = unpackServices(
  servicesJson as unknown as PackedTable,
  (referralId) => getReferralById(referralId)?.studentId,
);

export function getServicesForStudent(studentId: string): ServiceRecord[] {
  return serviceRecords.filter((s) => s.studentId === studentId);
}
