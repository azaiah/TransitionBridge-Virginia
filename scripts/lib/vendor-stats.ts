/**
 * Vendor capacity and performance, recomputed from the simulated records.
 *
 * The Vendor record's own numbers are OVERWRITTEN here so a provider's card and its
 * scorecard can never show different acceptance rates. Only `capacityTotal` is chosen
 * rather than measured — it is a stated capacity, and it is chosen so the resulting
 * utilization matches the distribution in docs/05_DEMO_DATA.md §3.8.
 */
import type {
  OutcomeRecord,
  PreEtsActivity,
  ServiceRecord,
  StoredReferral,
  Vendor,
  VendorScorecard,
} from '../../src/data/types';
import { PRE_ETS_ACTIVITIES } from '../../src/data/types';
import { median } from '../../src/lib/metrics';
import { offerLeadHours } from '../../src/lib/timeline';
import type { Rng } from './prng';
import { normal, randFloat, randInt } from './prng';

export type VendorStatsInput = {
  vendors: Vendor[];
  referrals: StoredReferral[];
  services: ServiceRecord[];
  outcomes: OutcomeRecord[];
  /** Providers who must read above 85% utilization — the sole provider in a thin area. */
  strainedVendorIds: Set<string>;
};

export function buildVendorStats(rng: Rng, input: VendorStatsInput): VendorScorecard[] {
  const { vendors, referrals, services, outcomes } = input;

  const outcomeByReferral = new Map(outcomes.map((o) => [o.referralId, o]));
  const scorecards: VendorScorecard[] = [];

  const offersByVendor = new Map<string, number>();
  for (const referral of referrals) {
    for (const vendorId of referral.offeredVendorIds) {
      offersByVendor.set(vendorId, (offersByVendor.get(vendorId) ?? 0) + 1);
    }
  }

  const referralsByVendor = new Map<string, StoredReferral[]>();
  for (const referral of referrals) {
    if (!referral.assignedVendorId) continue;
    const list = referralsByVendor.get(referral.assignedVendorId) ?? [];
    list.push(referral);
    referralsByVendor.set(referral.assignedVendorId, list);
  }

  const servicesByVendor = new Map<string, ServiceRecord[]>();
  for (const service of services) {
    if (!service.vendorId) continue;
    const list = servicesByVendor.get(service.vendorId) ?? [];
    list.push(service);
    servicesByVendor.set(service.vendorId, list);
  }

  for (const vendor of vendors) {
    const assigned = referralsByVendor.get(vendor.id) ?? [];
    const vendorServices = servicesByVendor.get(vendor.id) ?? [];
    const offersReceived = offersByVendor.get(vendor.id) ?? 0;

    // Capacity in use right now: students the provider is actively carrying.
    const active = assigned.filter(
      (r) => r.status === 'ASSIGNED' || r.status === 'IN_SERVICE',
    ).length;

    // Stated capacity is chosen so utilization lands on the target distribution:
    // mean about 68%, with a genuine tail above 95% in the underserved areas.
    const utilization = input.strainedVendorIds.has(vendor.id)
      ? randFloat(rng, 0.86, 0.98)
      : Math.min(0.99, Math.max(0.28, normal(rng, 0.68, 0.15)));
    // Round rather than ceil: rounding up always biases the realised utilization DOWN,
    // which quietly flattens the high-strain tail we deliberately created.
    const capacityTotal =
      active === 0 ? randInt(rng, 8, 24) : Math.max(active, Math.round(active / utilization));

    const completed = assigned.filter((r) => r.status === 'COMPLETED');
    const employedOutcomes = completed
      .map((r) => outcomeByReferral.get(r.id))
      .filter((o): o is OutcomeRecord => o?.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT');

    const wages = employedOutcomes
      .map((o) => o.hourlyWage)
      .filter((w): w is number => w !== null);
    const retentionSample = employedOutcomes.filter((o) => o.retained90Days !== null);

    const responseHours = assigned.map((r) => offerLeadHours(r.id));
    const medianResponse = Math.round(median(responseHours) ?? 0);

    const acceptanceRate = offersReceived === 0 ? 0 : assigned.length / offersReceived;
    const completionRate = assigned.length === 0 ? 0 : completed.length / assigned.length;
    const employmentOutcomeRate =
      completed.length === 0 ? 0 : employedOutcomes.length / completed.length;
    const medianWage = wages.length === 0 ? null : Number((median(wages) ?? 0).toFixed(2));
    const retention =
      retentionSample.length === 0
        ? null
        : retentionSample.filter((o) => o.retained90Days === true).length / retentionSample.length;

    // Write the measured values straight back onto the provider record.
    vendor.capacityTotal = capacityTotal;
    vendor.capacityUsed = active;
    vendor.medianResponseHours = medianResponse;
    vendor.acceptanceRate = acceptanceRate;
    vendor.completionRate = completionRate;
    vendor.employmentOutcomeRate = employmentOutcomeRate;
    vendor.medianPlacementWage = medianWage;
    vendor.retention90DayRate = retention;

    const activityMix = Object.fromEntries(
      PRE_ETS_ACTIVITIES.map((a) => [a, 0]),
    ) as Record<PreEtsActivity, number>;
    for (const service of vendorServices) activityMix[service.activity]++;

    scorecards.push({
      vendorId: vendor.id,
      vendorName: vendor.name,
      darsDistrictId: assigned[0]?.darsDistrictId ?? 'capital',
      offersReceived,
      offersAccepted: assigned.length,
      acceptanceRate,
      medianResponseHours: medianResponse,
      studentsServed: new Set(vendorServices.map((s) => s.studentId)).size,
      servicesLogged: vendorServices.length,
      completionRate,
      employmentOutcomeRate,
      medianPlacementWage: medianWage,
      retention90DayRate: retention,
      capacityUsedPct: capacityTotal === 0 ? 0 : active / capacityTotal,
      activityMix,
    });
  }

  return scorecards;
}
