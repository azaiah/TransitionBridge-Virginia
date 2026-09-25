/**
 * Funding authorizations for the current federal fiscal year, and their roll-ups.
 *
 * Two kinds, kept honest against the rest of the dataset:
 *
 *   - DARS Pre-ETS: one per student placed with a provider. Hours and dollars USED are
 *     summed from the real service records dated inside the fiscal year, at the same unit
 *     costs the 15% reserve page uses. So DARS dollars used here equal "reserve spent to
 *     date" there, to the dollar — a CFO can check one screen against the other.
 *   - Partner-funded: for roughly a quarter of served students, a second authorization
 *     from DMAS, Virginia Works, the school division, a grant, the local workforce board,
 *     or another agency, for the adjacent supports those partners actually fund.
 *
 * Authorized hours are set so most students have room, some are close to the limit, and a
 * few have already gone over — which is the situation the over-billing guard exists for.
 *
 * Uses its own seeded stream (subRng), so adding this layer does not shift one byte of the
 * existing referral, student, or service data.
 */
import type {
  FundingSource,
  FundingSummary,
  FundingTotals,
  ServiceRecord,
  StoredAuthorization,
  StoredReferral,
} from '../../src/data/types';
import { FUNDING_SOURCES } from '../../src/data/types';
import { sumAuthorizations } from '../../src/lib/funding';
import { FEDERAL_FY_END, FEDERAL_FY_START, REFERENCE_DATE } from './calendar';
import { chance, randFloat, subRng, weightedPick } from './prng';
import { UNIT_RATE, serviceCost } from './services';

/** Partner funders, how often each appears, what they pay for, and an illustrative rate. */
const PARTNERS: readonly {
  source: FundingSource;
  weight: number;
  service: string;
  hourly: number;
}[] = [
  { source: 'DMAS', weight: 0.26, service: 'Job coaching (Medicaid waiver)', hourly: 46 },
  { source: 'VIRGINIA_WORKS', weight: 0.2, service: 'Paid work experience', hourly: 16.5 },
  { source: 'SCHOOL_DIVISION', weight: 0.18, service: 'Job coach during the school day', hourly: 38 },
  { source: 'LOCAL_WORKFORCE_BOARD', weight: 0.16, service: 'WIOA Youth work experience', hourly: 17 },
  { source: 'GRANT', weight: 0.12, service: 'Summer work program', hourly: 22 },
  { source: 'OTHER_AGENCY', weight: 0.08, service: 'Benefits counseling', hourly: 55 },
];

const PARTNER_SHARE = 0.24;

const DARS_SERVICE = 'Pre-ETS required activities';

function dateOnly(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function roundUpTo(value: number, step: number): number {
  return Math.max(step, Math.ceil(value / step) * step);
}

export function buildAuthorizations(
  seed: number,
  referrals: StoredReferral[],
  services: ServiceRecord[],
): StoredAuthorization[] {
  const fyStart = FEDERAL_FY_START.getTime();
  const fyEnd = FEDERAL_FY_END.getTime();
  const now = REFERENCE_DATE.getTime();

  // Minutes and dollars delivered inside the fiscal year, per referral. Same cost basis
  // and the same date window as the reserve calculation in aggregate.ts.
  const minutesByReferral = new Map<string, number>();
  const dollarsByReferral = new Map<string, number>();
  for (const service of services) {
    const t = Date.parse(service.serviceDate);
    if (t < fyStart || t > now) continue;
    minutesByReferral.set(
      service.referralId,
      (minutesByReferral.get(service.referralId) ?? 0) + service.durationMinutes,
    );
    dollarsByReferral.set(
      service.referralId,
      (dollarsByReferral.get(service.referralId) ?? 0) + serviceCost(service),
    );
  }

  const auths: StoredAuthorization[] = [];

  for (const referral of referrals) {
    const minutes = minutesByReferral.get(referral.id) ?? 0;
    const endedAt = referral.completedAt ?? referral.closedAt;
    const assigned = referral.assignedAt ? Date.parse(referral.assignedAt) : null;
    // An authorization is issued at assignment and renewed each fiscal year while the
    // student is still with a provider. So every student a provider holds today has one —
    // the service log checks it — and a closed placement with no service this year has none.
    const placedThisYear =
      assigned !== null &&
      assigned >= fyStart &&
      assigned <= now &&
      (endedAt === null || Date.parse(endedAt) >= fyStart);
    const withProviderNow = referral.status === 'ASSIGNED' || referral.status === 'IN_SERVICE';
    if (minutes === 0 && !placedThisYear && !withProviderNow) continue;

    const rng = subRng(seed, `auth:${referral.id}`);
    const used = minutes / 60;
    // A plan's size follows how much was asked for: about two hours per requested activity for the year, never under four.
    const planned = Math.max(4, referral.requestedActivities.length * 2);

    let hoursAuthorized: number;
    const roll = rng();
    if (used >= 6 && roll < 0.035) {
      // Already past the limit: services kept being logged after the hours ran out.
      hoursAuthorized = Math.max(5, Math.floor((used * randFloat(rng, 0.78, 0.94)) / 5) * 5);
    } else if (used >= 4 && roll < 0.14) {
      // Close to the limit — the counselor should see this before it becomes a problem.
      hoursAuthorized = roundUpTo(used / randFloat(rng, 0.9, 0.99), 1);
    } else {
      hoursAuthorized = roundUpTo(Math.max(planned, used / randFloat(rng, 0.55, 0.95)), 1);
    }

    const dollarsUsed = Math.round(dollarsByReferral.get(referral.id) ?? 0);
    const blendedHourly =
      used > 0
        ? dollarsUsed / used
        : (referral.requestedActivities.reduce((s, a) => s + UNIT_RATE[a], 0) /
            Math.max(1, referral.requestedActivities.length)) *
          0.8;

    const start = Math.max(assigned ?? fyStart, fyStart);
    const end = endedAt ? Math.min(Date.parse(endedAt), fyEnd) : fyEnd;

    auths.push({
      referralId: referral.id,
      source: 'DARS',
      service: DARS_SERVICE,
      hoursAuthorized,
      minutesUsed: minutes,
      dollarsAuthorized: Math.round(hoursAuthorized * blendedHourly),
      dollarsUsed,
      startDate: dateOnly(start),
      endDate: dateOnly(Math.max(start, end)),
    });

    // A partner-funded support alongside Pre-ETS, for students already receiving services.
    const served = referral.status === 'IN_SERVICE' || referral.status === 'COMPLETED';
    if (!served || !chance(rng, PARTNER_SHARE)) continue;

    const partner = weightedPick(
      rng,
      PARTNERS.map((p) => [p, p.weight] as const),
    );
    const partnerHours = weightedPick(rng, [
      [20, 0.18],
      [30, 0.2],
      [40, 0.22],
      [60, 0.18],
      [80, 0.12],
      [120, 0.1],
    ] as const);
    const partnerShare = rng() < 0.03 ? randFloat(rng, 1.02, 1.12) : randFloat(rng, 0.1, 0.97);
    // Whole quarter-hours, like a timesheet.
    const partnerMinutes = Math.round((partnerHours * partnerShare * 60) / 15) * 15;

    auths.push({
      referralId: referral.id,
      source: partner.source,
      service: partner.service,
      hoursAuthorized: partnerHours,
      minutesUsed: partnerMinutes,
      dollarsAuthorized: Math.round(partnerHours * partner.hourly),
      dollarsUsed: Math.round((partnerMinutes / 60) * partner.hourly),
      startDate: dateOnly(start),
      endDate: dateOnly(Math.max(start, end)),
    });
  }

  return auths;
}

export function summarizeFunding(
  auths: StoredAuthorization[],
  districtByReferral: Map<string, string>,
  districtIds: string[],
  vendorByReferral: Map<string, string | null>,
  vendorIds: string[],
): FundingSummary {
  const bySource: FundingSummary['bySource'] = FUNDING_SOURCES.map((source) => ({
    source,
    ...sumAuthorizations(auths.filter((a) => a.source === source)),
  }));

  const grouped = new Map<string, StoredAuthorization[]>();
  for (const auth of auths) {
    const district = districtByReferral.get(auth.referralId) ?? '';
    const list = grouped.get(district) ?? [];
    list.push(auth);
    grouped.set(district, list);
  }

  const byDistrict = districtIds.map((darsDistrictId) => ({
    darsDistrictId,
    ...sumAuthorizations(grouped.get(darsDistrictId) ?? []),
  }));

  const groupedByVendor = new Map<string, StoredAuthorization[]>();
  for (const auth of auths) {
    // Only the provider's own Pre-ETS hours — the ones its service log draws down.
    if (auth.source !== 'DARS') continue;
    const vendor = vendorByReferral.get(auth.referralId);
    if (!vendor) continue;
    const list = groupedByVendor.get(vendor) ?? [];
    list.push(auth);
    groupedByVendor.set(vendor, list);
  }
  const byVendor = vendorIds.map((vendorId) => ({
    vendorId,
    ...sumAuthorizations(groupedByVendor.get(vendorId) ?? []),
  }));

  const byDistrictSource: FundingSummary['byDistrictSource'] = [];
  for (const darsDistrictId of districtIds) {
    const list = grouped.get(darsDistrictId) ?? [];
    for (const source of FUNDING_SOURCES) {
      const totals: FundingTotals = sumAuthorizations(list.filter((a) => a.source === source));
      byDistrictSource.push({ darsDistrictId, source, ...totals });
    }
  }

  return {
    fiscalYearLabel: 'federal fiscal year 2026',
    asOf: REFERENCE_DATE.toISOString(),
    totals: sumAuthorizations(auths),
    bySource,
    byDistrict,
    byVendor,
    byDistrictSource,
  };
}
