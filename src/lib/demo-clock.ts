/**
 * The single "now" for the entire demonstration.
 *
 * Everything age-related is measured against this fixed instant, never against the wall
 * clock. A dataset whose ages drift between builds would break the identical-bundle-hash
 * guarantee and could quietly change a KPI mid-presentation.
 */
export const DEMO_REFERENCE_DATE = '2026-06-30T17:00:00.000Z';

export const DEMO_NOW_MS = Date.parse(DEMO_REFERENCE_DATE);

export const MS_PER_DAY = 86_400_000;
