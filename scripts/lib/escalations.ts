/**
 * Precomputes the early warning counts (14 / 30 / 90 days) so dashboards never scan
 * eleven thousand referrals in the browser. The rules themselves live in
 * src/lib/escalation.ts — the same functions the queue uses row by row, so a tile and the
 * list it opens always agree.
 */
import type { EscalationSummary, StoredReferral } from '../../src/data/types';
import { countEscalations, isDormant } from '../../src/lib/escalation';

function groupBy(referrals: StoredReferral[], keyOf: (r: StoredReferral) => string | null) {
  const map = new Map<string, StoredReferral[]>();
  for (const referral of referrals) {
    const key = keyOf(referral);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(referral);
    map.set(key, list);
  }
  return map;
}

export function summarizeEscalations(
  referrals: StoredReferral[],
  districtIds: string[],
  divisionIds: string[],
  vendorIds: string[],
): EscalationSummary {
  const byDistrict = groupBy(referrals, (r) => r.darsDistrictId);
  const byDivision = groupBy(referrals, (r) => r.divisionId);
  const byVendor = groupBy(referrals, (r) => r.assignedVendorId);

  return {
    state: countEscalations(referrals),
    dormant: referrals.filter((r) => isDormant(r)).length,
    byDistrict: districtIds.map((darsDistrictId) => {
      const list = byDistrict.get(darsDistrictId) ?? [];
      return {
        darsDistrictId,
        counts: countEscalations(list),
        dormant: list.filter((r) => isDormant(r)).length,
      };
    }),
    byVendor: vendorIds.map((vendorId) => ({
      vendorId,
      counts: countEscalations(byVendor.get(vendorId) ?? []),
    })),
    byDivision: divisionIds.map((divisionId) => ({
      divisionId,
      counts: countEscalations(byDivision.get(divisionId) ?? []),
    })),
  };
}
