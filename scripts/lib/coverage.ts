/**
 * One coverage cell per locality — the data behind the statewide map.
 *
 * Demand is measured over the trailing four quarters so the map reads as a live picture
 * rather than a two-year total.
 */
import type { CoverageCell, OutcomeRecord, StoredReferral, Vendor } from '../../src/data/types';
import { coverageGap } from '../../src/lib/metrics';
import { PERIODS, periodOf } from './calendar';
import type { Geography } from './geography';

const TRAILING_PERIODS = new Set(PERIODS.slice(-4) as string[]);

export function buildCoverage(
  geo: Geography,
  vendors: Vendor[],
  referrals: StoredReferral[],
  outcomes: OutcomeRecord[],
): CoverageCell[] {
  const employedReferralIds = new Set(
    outcomes
      .filter((o) => o.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT')
      .map((o) => o.referralId),
  );

  const demand = new Map<string, number>();
  const completed = new Map<string, number>();
  const employed = new Map<string, number>();

  for (const referral of referrals) {
    const period = periodOf(referral.submittedAt);
    if (period && TRAILING_PERIODS.has(period)) {
      demand.set(referral.localityFips, (demand.get(referral.localityFips) ?? 0) + 1);
    }
    if (referral.status === 'COMPLETED') {
      completed.set(referral.localityFips, (completed.get(referral.localityFips) ?? 0) + 1);
      if (employedReferralIds.has(referral.id)) {
        employed.set(referral.localityFips, (employed.get(referral.localityFips) ?? 0) + 1);
      }
    }
  }

  const vendorsByFips = new Map<string, Vendor[]>();
  for (const vendor of vendors) {
    for (const fips of vendor.servedLocalityFips) {
      const list = vendorsByFips.get(fips) ?? [];
      list.push(vendor);
      vendorsByFips.set(fips, list);
    }
  }

  return geo.localities.map((locality) => {
    const serving = vendorsByFips.get(locality.fips) ?? [];

    // Headroom is shared across every locality a provider serves, so a provider covering
    // eight counties does not count as eight counties' worth of capacity.
    const headroom = serving.reduce((total, vendor) => {
      const free = Math.max(0, vendor.capacityTotal - vendor.capacityUsed);
      return total + free / Math.max(1, vendor.servedLocalityFips.length);
    }, 0);

    const referralVolume = demand.get(locality.fips) ?? 0;
    const completedHere = completed.get(locality.fips) ?? 0;

    return {
      fips: locality.fips,
      referralVolume,
      vendorCount: serving.length,
      capacityHeadroom: Math.round(headroom),
      gapScore: coverageGap(referralVolume, headroom),
      employmentOutcomeRate:
        completedHere === 0 ? null : (employed.get(locality.fips) ?? 0) / completedHere,
      isRural: locality.isRural,
    };
  });
}
