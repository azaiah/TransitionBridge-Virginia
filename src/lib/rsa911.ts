/**
 * The RSA-911 aligned export.
 *
 * "Aligned" means the columns line up with the federal case service report. It is not a
 * certified file and not a validated submission, and nothing in this product should ever
 * call it one (docs/01_PRODUCT_SPEC.md §7.3).
 *
 * The service start date column is the analogue of the DE 96 field — the date the student
 * first received a pre-employment transition service.
 */
import { ACTIVITY_LABELS } from '@/data/types';
import type { PlanType, ServiceRecord, StoredReferral } from '@/data/types';

export interface Rsa911Row {
  recordIdentifier: string;
  studentIdentifier: string;
  planType: PlanType;
  activityDelivered: string;
  serviceStartDate: string;
  provider: string;
  serviceDate: string;
  setting: string;
  durationMinutes: number;
}

/** Column headers, in the order they are exported. */
export const RSA911_COLUMNS = [
  'Record identifier',
  'Student identifier',
  'Plan type',
  'Required activity delivered',
  'Pre-ETS service start date',
  'Provider',
  'Service date',
  'Setting',
  'Duration (minutes)',
] as const;

/** ISO timestamps become plain dates — a reporting file has no use for the time of day. */
export function toDateOnly(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * Turns service records into export rows. Services whose referral is missing are dropped
 * rather than exported with blanks, because a reporting file with holes is worse than a
 * shorter one.
 */
export function buildRsa911Rows(
  services: ServiceRecord[],
  referralById: Map<string, StoredReferral>,
  providerName: (vendorId: string | null, deliveredInHouse: boolean) => string,
): Rsa911Row[] {
  const rows: Rsa911Row[] = [];

  for (const service of services) {
    const referral = referralById.get(service.referralId);
    if (!referral) continue;

    rows.push({
      recordIdentifier: service.referralId,
      studentIdentifier: service.studentId,
      planType: referral.planType,
      activityDelivered: ACTIVITY_LABELS[service.activity],
      serviceStartDate: toDateOnly(referral.firstServiceAt),
      provider: providerName(service.vendorId, service.deliveredInHouse),
      serviceDate: toDateOnly(service.serviceDate),
      setting: service.setting,
      durationMinutes: service.durationMinutes,
    });
  }

  return rows;
}

/** One row as an array, in column order. Used for both the preview and the CSV. */
export function rsa911RowValues(row: Rsa911Row): (string | number)[] {
  return [
    row.recordIdentifier,
    row.studentIdentifier,
    row.planType,
    row.activityDelivered,
    row.serviceStartDate,
    row.provider,
    row.serviceDate,
    row.setting,
    row.durationMinutes,
  ];
}

/** CSV text with the demonstration-data notice on the first line. */
export function toRsa911Csv(rows: Rsa911Row[]): string {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const notice =
    '"DEMONSTRATION DATA — synthetic records generated for demonstration. RSA-911 aligned; not a certified or validated submission."';

  return [
    notice,
    RSA911_COLUMNS.map(quote).join(','),
    ...rows.map((row) => rsa911RowValues(row).map(quote).join(',')),
  ].join('\n');
}
