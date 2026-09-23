/**
 * Timestamp resolution for the demonstration dataset.
 *
 * Generated timestamps carried random minutes, seconds, and milliseconds. Nothing in the
 * product ever shows a time of day, and that randomness is pure entropy: it does not
 * compress, and it was the single largest contributor to the referral payload (about
 * 240 KB of transfer on every record screen).
 *
 * Flooring to the hour is done HERE, before any aggregate is computed, so the numbers on
 * a dashboard and the numbers a screen derives from the same records can never disagree.
 */
const ISO_WITH_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:/;

/** '2024-07-17T11:32:51.209Z' → '2024-07-17T11:00:00.000Z'. Date-only values pass through. */
export function floorIsoToHour(value: string): string {
  return ISO_WITH_TIME.test(value) ? `${value.slice(0, 13)}:00:00.000Z` : value;
}

/** Floors every ISO timestamp field on a record. Other fields are untouched. */
export function floorRecordTimestamps<T extends object>(record: T): T {
  const out = { ...(record as Record<string, unknown>) };
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (typeof value === 'string') out[key] = floorIsoToHour(value);
  }
  return out as T;
}

export function floorAllTimestamps<T extends object>(records: T[]): T[] {
  return records.map(floorRecordTimestamps);
}
