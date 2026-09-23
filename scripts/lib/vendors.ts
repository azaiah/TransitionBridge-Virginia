/**
 * 85 invented Employment Service Organizations, their service areas, and the deliberate
 * coverage gaps (docs/05_DEMO_DATA.md §3.8).
 *
 * Capacity and performance numbers are NOT set here. They are recomputed from the
 * simulated records in aggregate.ts so a vendor's card can never disagree with its
 * scorecard (CLAUDE.md §3.2).
 */
import type { PreEtsActivity, Vendor } from '../../src/data/types';
import { PRE_ETS_ACTIVITIES } from '../../src/data/types';
import type { Geography } from './geography';
import { milesBetween } from './geography';
import type { Rng } from './prng';
import { chance, pick, randInt, shuffle, weightedPick } from './prng';
import { buildVendorNames } from './names';
import { DIVISION_ENROLLMENT } from './reference';

export const VENDOR_COUNT = 85;
/** Localities with no approved provider at all — the red zones on the map. */
export const ZERO_COVERAGE_TARGET = 10;
/** Localities served by exactly one provider, who is running near capacity. */
export const SINGLE_COVERAGE_TARGET = 15;

export type VendorNetwork = {
  vendors: Vendor[];
  /** Locality FIPS → vendor ids serving it. */
  coverageByFips: Map<string, string[]>;
  zeroCoverageFips: string[];
  singleCoverageFips: string[];
  /** Vendors whose stated capacity must be tuned above 85% utilization. */
  strainedVendorIds: Set<string>;
};

/** Rough demand weight for a locality, used to place vendors where students are. */
function demandWeight(geo: Geography, fips: string): number {
  const divisionIds = geo.localityDivisions.get(fips) ?? [];
  let enrollment = 0;
  for (const id of divisionIds) enrollment += DIVISION_ENROLLMENT[id] ?? 1200;
  return Math.max(300, enrollment);
}

export function buildVendorNetwork(rng: Rng, geo: Geography): VendorNetwork {
  const rural = geo.localities.filter((l) => l.isRural);

  // 1. The deliberate gaps are chosen first, so nothing else can accidentally cover them.
  //    Weighted toward the smallest, most remote rural localities.
  const ruralBySize = [...rural].sort(
    (a, b) => demandWeight(geo, a.fips) - demandWeight(geo, b.fips),
  );
  const gapPool = shuffle(rng, ruralBySize.slice(0, 44));
  const zeroCoverageFips = gapPool.slice(0, ZERO_COVERAGE_TARGET).map((l) => l.fips);
  const singleCoverageFips = gapPool
    .slice(ZERO_COVERAGE_TARGET, ZERO_COVERAGE_TARGET + SINGLE_COVERAGE_TARGET)
    .map((l) => l.fips);

  const zeroSet = new Set(zeroCoverageFips);
  const singleSet = new Set(singleCoverageFips);

  // 2. Place headquarters. Urban corridors carry most providers, which is what produces
  //    the 6–14 vendors per urban locality and the thin rural coverage.
  const hqCandidates = geo.localities.filter((l) => !zeroSet.has(l.fips) && !singleSet.has(l.fips));
  const hqWeights = hqCandidates.map(
    (l) => [l.fips, demandWeight(geo, l.fips) * (l.isRural ? 0.35 : 1)] as const,
  );

  const names = buildVendorNames(rng, VENDOR_COUNT);
  const vendors: Vendor[] = [];

  for (let i = 0; i < VENDOR_COUNT; i++) {
    const hqFips = weightedPick(rng, hqWeights);
    const hq = geo.byFips.get(hqFips)!;

    // Rural providers cover more ground because they have to; urban ones stay tight.
    const reach = hq.isRural ? randInt(rng, 5, 11) : randInt(rng, 3, 7);
    const nearest = [...geo.localities]
      .map((l) => ({ fips: l.fips, miles: milesBetween(hq.centroid, l.centroid) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, reach)
      .map((n) => n.fips);

    vendors.push({
      id: `DEMO-VND-${String(i + 1).padStart(4, '0')}`,
      name: names[i] ?? `Demonstration Provider ${i + 1}`,
      headquartersFips: hqFips,
      servedLocalityFips: Array.from(new Set([hqFips, ...nearest])),
      activitiesOffered: pickActivities(rng),
      // Placeholders — reconciled against real records in aggregate.ts.
      capacityTotal: 0,
      capacityUsed: 0,
      medianResponseHours: 0,
      acceptanceRate: 0,
      completionRate: 0,
      employmentOutcomeRate: 0,
      medianPlacementWage: null,
      retention90DayRate: null,
      activeSince: `${randInt(rng, 2016, 2024)}-07-01`,
    });
  }

  // 3. Enforce the gaps. No provider serves a zero-coverage locality; exactly one serves
  //    each single-coverage locality.
  for (const vendor of vendors) {
    vendor.servedLocalityFips = vendor.servedLocalityFips.filter((f) => !zeroSet.has(f));
  }

  const strainedVendorIds = new Set<string>();
  for (const fips of singleCoverageFips) {
    const target = geo.byFips.get(fips)!;
    const ranked = [...vendors].sort(
      (a, b) =>
        milesBetween(geo.byFips.get(a.headquartersFips)!.centroid, target.centroid) -
        milesBetween(geo.byFips.get(b.headquartersFips)!.centroid, target.centroid),
    );
    const keeper = ranked[0]!;
    for (const vendor of vendors) {
      if (vendor.id === keeper.id) continue;
      vendor.servedLocalityFips = vendor.servedLocalityFips.filter((f) => f !== fips);
    }
    if (!keeper.servedLocalityFips.includes(fips)) keeper.servedLocalityFips.push(fips);
    strainedVendorIds.add(keeper.id);
  }

  // 4. Nearest-neighbour service areas leave incidental holes. Close them, so the only
  //    localities without a provider are the ten we chose deliberately.
  for (const locality of geo.localities) {
    if (zeroSet.has(locality.fips)) continue;
    if (vendors.some((v) => v.servedLocalityFips.includes(locality.fips))) continue;
    const nearest = [...vendors].sort(
      (a, b) =>
        milesBetween(geo.byFips.get(a.headquartersFips)!.centroid, locality.centroid) -
        milesBetween(geo.byFips.get(b.headquartersFips)!.centroid, locality.centroid),
    )[0]!;
    nearest.servedLocalityFips.push(locality.fips);
    if (singleSet.has(locality.fips)) strainedVendorIds.add(nearest.id);
  }

  const coverageByFips = new Map<string, string[]>();
  for (const locality of geo.localities) coverageByFips.set(locality.fips, []);
  for (const vendor of vendors) {
    for (const fips of vendor.servedLocalityFips) {
      coverageByFips.get(fips)?.push(vendor.id);
    }
  }

  return {
    vendors,
    coverageByFips,
    zeroCoverageFips,
    singleCoverageFips,
    strainedVendorIds,
  };
}

/**
 * Most providers offer the low-cost activities. Work-based learning is the expensive,
 * outcome-driving one, and fewer providers can deliver it — which is exactly why it lands
 * at 8% of services statewide (docs/05_DEMO_DATA.md §3.7).
 */
function pickActivities(rng: Rng): PreEtsActivity[] {
  const offered: PreEtsActivity[] = [];
  const propensity: Record<PreEtsActivity, number> = {
    workplace_readiness_training: 0.94,
    job_exploration_counseling: 0.92,
    self_advocacy_instruction: 0.78,
    postsecondary_counseling: 0.66,
    work_based_learning: 0.42,
  };

  for (const activity of PRE_ETS_ACTIVITIES) {
    if (chance(rng, propensity[activity])) offered.push(activity);
  }
  // Nobody is an approved provider offering nothing.
  if (offered.length === 0) offered.push(pick(rng, PRE_ETS_ACTIVITIES));
  return offered;
}
