/**
 * The LIGHT half of the demonstration dataset: real geography, the provider and persona
 * directory, and every precomputed aggregate. Around 1 MB in total.
 *
 * Record-level data lives in `@/data/records` (students and referrals) and
 * `@/data/services` (service logs). Neither is re-exported from here, so a statewide
 * dashboard never pays to download eleven thousand referral rows it does not render.
 *
 * Everything is bundled at build time. There is no runtime fetching anywhere.
 */
import aggregatesJson from './generated/aggregates.json';
import directoryJson from './generated/directory.json';
import geographyJson from './generated/geography.json';
import type {
  AggregatesBundle,
  DirectoryBundle,
  GeographyBundle,
  Persona,
} from './types';

const geography = geographyJson as unknown as GeographyBundle;
const directory = directoryJson as unknown as DirectoryBundle;
const aggregates = aggregatesJson as unknown as AggregatesBundle;

export const demoData = {
  ...geography,
  ...directory,
  ...aggregates,
};

/** The fixed instant the whole dataset is measured against. */
export const REFERENCE_DATE = aggregates.referenceDate;
export const CURRENT_PERIOD = aggregates.currentPeriod;
export const PERIODS = aggregates.periods;

export function getDivisionById(id: string) {
  return demoData.divisions.find((d) => d.id === id);
}

export function getDistrictById(id: string) {
  return demoData.districts.find((d) => d.id === id);
}

export function getLocalityByFips(fips: string) {
  return demoData.localities.find((l) => l.fips === fips);
}

export function getVendorById(id: string) {
  return demoData.vendors.find((v) => v.id === id);
}

export function getPersonaById(id: string) {
  return demoData.personas.find((p) => p.id === id);
}

/**
 * The persona a role's screens use when someone navigates straight to a URL without
 * picking a view first. Always the first persona in the role, so the demonstration is
 * reproducible rather than arbitrary.
 */
export function getDefaultPersonaFor(role: Persona['role']) {
  return demoData.personas.find((p) => p.role === role);
}

/** Precomputed dashboard numbers for a persona. See `HomeSnapshots` in data/types. */
export function getCounselorHome(personaId: string) {
  return demoData.homeSnapshots.counselors.find((h) => h.personaId === personaId);
}

export function getCoordinatorHome(personaId: string) {
  return demoData.homeSnapshots.coordinators.find((h) => h.personaId === personaId);
}

export function getProviderHome(personaId: string) {
  return demoData.homeSnapshots.providers.find((h) => h.personaId === personaId);
}

/** Statewide metrics for the current quarter. */
export function getCurrentStateMetrics() {
  return demoData.stateMetrics.find((s) => s.period === CURRENT_PERIOD)!;
}

/** Precomputed headline numbers, funnel, and cross-tabs for the current quarter. */
export function getCurrentHeadline() {
  return demoData.headlines.find((h) => h.period === CURRENT_PERIOD)!;
}

export function getDistrictMetrics(districtId: string, period = CURRENT_PERIOD) {
  return demoData.districtMetrics.find(
    (d) => d.darsDistrictId === districtId && d.period === period,
  );
}

export function getDivisionMetrics(divisionId: string, period = CURRENT_PERIOD) {
  return demoData.divisionMetrics.find(
    (d) => d.divisionId === divisionId && d.period === period,
  );
}

export * from './types';
