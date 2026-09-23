/**
 * How referral and student records are stored on disk.
 *
 * Stored as tuple rows against a shared column list instead of one object per record, and
 * with every field that can be recomputed left out entirely:
 *
 *   - `id` is the row position (`DEMO-REF-{year}-{n}`, `DEMO-STU-{n}`)
 *   - `divisionId`, `darsDistrictId`, and `localityFips` all follow from `schoolId`,
 *     using the geography file every screen already loads
 *
 * This cuts what a record screen downloads by roughly half. The column lists live here,
 * next to the decoder, so the generator and the browser can never drift apart.
 */
import type {
  PlanType,
  DiplomaTrack,
  ServiceRecord,
  StoredReferral,
  Student,
} from './types';

/** Column order for a packed referral row. The generator writes exactly these, in order. */
export const PACKED_REFERRAL_KEYS = [
  'studentId',
  'schoolId',
  'submittedAt',
  'submittedByPersonaId',
  'requestedActivities',
  'planType',
  'gradeLevel',
  'diplomaTrack',
  'transportationBarrier',
  'status',
  'statusChangedAt',
  'reviewedAt',
  'reviewedByPersonaId',
  'offeredVendorIds',
  'assignedVendorId',
  'assignedAt',
  'firstServiceAt',
  'completedAt',
  'closedAt',
  'declineReason',
] as const;

/** Column order for a packed student row. */
export const PACKED_STUDENT_KEYS = [
  'displayName',
  'schoolId',
  'gradeLevel',
  'age',
  'planType',
  'diplomaTrack',
  'disabilityDocumented',
  'transportationBarrier',
  'consentOnFile',
  'consentDate',
  'preEtsStartDate',
] as const;

/**
 * Column order for a packed service row. `id` is the row position and `studentId` comes
 * from the referral the service belongs to, so neither is stored across 46,000 rows.
 */
export const PACKED_SERVICE_KEYS = [
  'referralId',
  'vendorId',
  'deliveredInHouse',
  'activity',
  'serviceDate',
  'durationMinutes',
  'setting',
  'groupSession',
] as const;

/** On-disk shape: the column list, then one array per record. */
export interface PackedTable {
  keys: readonly string[];
  rows: readonly unknown[][];
}

/** Where a school sits, so the omitted geography columns can be rebuilt. */
export interface SchoolPlacement {
  divisionId: string;
  darsDistrictId: string;
  localityFips: string;
}

function padded(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/**
 * Turns records into tuple rows against a fixed column list. Used by the generator, and
 * by the determinism test to prove the committed files are exactly what this seed builds.
 */
export function packRows<T extends object>(
  records: T[],
  keys: readonly string[],
): PackedTable {
  return {
    keys: [...keys],
    rows: records.map((record) => {
      const row = record as Record<string, unknown>;
      return keys.map((key) => row[key] ?? null);
    }),
  };
}

/** Rebuilds full referral records from packed rows. */
export function unpackReferrals(
  table: PackedTable,
  placementOf: (schoolId: string) => SchoolPlacement | undefined,
): StoredReferral[] {
  const column = columnIndex(table.keys, PACKED_REFERRAL_KEYS);

  return table.rows.map((row, i) => {
    const schoolId = row[column.schoolId] as string;
    const submittedAt = row[column.submittedAt] as string;
    const placement = placementOf(schoolId);

    return {
      // The id encodes the submission year, exactly as the generator built it.
      id: `DEMO-REF-${submittedAt.slice(0, 4)}-${padded(i + 1, 6)}`,
      studentId: row[column.studentId] as string,
      divisionId: placement?.divisionId ?? '',
      schoolId,
      darsDistrictId: placement?.darsDistrictId ?? '',
      localityFips: placement?.localityFips ?? '',
      submittedAt,
      submittedByPersonaId: row[column.submittedByPersonaId] as string,
      requestedActivities: row[column.requestedActivities] as StoredReferral['requestedActivities'],
      planType: row[column.planType] as PlanType,
      gradeLevel: row[column.gradeLevel] as number,
      diplomaTrack: row[column.diplomaTrack] as DiplomaTrack,
      transportationBarrier: row[column.transportationBarrier] as boolean,
      status: row[column.status] as StoredReferral['status'],
      statusChangedAt: row[column.statusChangedAt] as string,
      reviewedAt: row[column.reviewedAt] as string | null,
      reviewedByPersonaId: row[column.reviewedByPersonaId] as string | null,
      offeredVendorIds: row[column.offeredVendorIds] as string[],
      assignedVendorId: row[column.assignedVendorId] as string | null,
      assignedAt: row[column.assignedAt] as string | null,
      firstServiceAt: row[column.firstServiceAt] as string | null,
      completedAt: row[column.completedAt] as string | null,
      closedAt: row[column.closedAt] as string | null,
      declineReason: row[column.declineReason] as StoredReferral['declineReason'],
    };
  });
}

/** Rebuilds full student records from packed rows. */
export function unpackStudents(
  table: PackedTable,
  placementOf: (schoolId: string) => SchoolPlacement | undefined,
): Student[] {
  const column = columnIndex(table.keys, PACKED_STUDENT_KEYS);

  return table.rows.map((row, i) => {
    const schoolId = row[column.schoolId] as string;

    return {
      id: `DEMO-STU-${padded(i + 1, 6)}`,
      displayName: row[column.displayName] as string,
      divisionId: placementOf(schoolId)?.divisionId ?? '',
      schoolId,
      gradeLevel: row[column.gradeLevel] as Student['gradeLevel'],
      age: row[column.age] as number,
      planType: row[column.planType] as PlanType,
      diplomaTrack: row[column.diplomaTrack] as DiplomaTrack,
      disabilityDocumented: row[column.disabilityDocumented] as boolean,
      transportationBarrier: row[column.transportationBarrier] as boolean,
      consentOnFile: row[column.consentOnFile] as boolean,
      consentDate: row[column.consentDate] as string | null,
      preEtsStartDate: row[column.preEtsStartDate] as string | null,
    };
  });
}

/** Rebuilds full service records from packed rows. */
export function unpackServices(
  table: PackedTable,
  studentIdOf: (referralId: string) => string | undefined,
): ServiceRecord[] {
  const column = columnIndex(table.keys, PACKED_SERVICE_KEYS);

  return table.rows.map((row, i) => {
    const referralId = row[column.referralId] as string;

    return {
      id: `DEMO-SVC-${padded(i + 1, 6)}`,
      referralId,
      studentId: studentIdOf(referralId) ?? '',
      vendorId: row[column.vendorId] as string | null,
      deliveredInHouse: row[column.deliveredInHouse] as boolean,
      activity: row[column.activity] as ServiceRecord['activity'],
      serviceDate: row[column.serviceDate] as string,
      durationMinutes: row[column.durationMinutes] as number,
      setting: row[column.setting] as ServiceRecord['setting'],
      groupSession: row[column.groupSession] as boolean,
      // Always empty in the demonstration dataset, so it is not shipped.
      notes: null,
    };
  });
}

/**
 * Column name → position, read from the file itself rather than assumed, so a stale data
 * file fails loudly at load instead of quietly shifting every field by one.
 */
function columnIndex<K extends readonly string[]>(
  keys: readonly string[],
  expected: K,
): Record<K[number], number> {
  const index = {} as Record<string, number>;
  for (const name of expected) {
    const at = keys.indexOf(name);
    if (at === -1) {
      throw new Error(`Data file is missing the "${name}" column. Run the data generator.`);
    }
    index[name] = at;
  }
  return index;
}
