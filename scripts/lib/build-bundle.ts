/**
 * Assembles the complete demonstration dataset.
 *
 * Order matters: records are simulated first, then every aggregate is computed FROM those
 * records. Nothing downstream may invent a number (CLAUDE.md §3.2).
 */
import type { DemoDataBundle, School, Vendor } from '../../src/data/types';
import { aggregate } from './aggregate';
import { buildAlerts } from './alerts';
import { CURRENT_PERIOD, PERIODS, REFERENCE_DATE, isoOf } from './calendar';
import { buildCoverage } from './coverage';
import { buildGeography, loadLocalityRefs } from './geography';
import { buildHeadlines, buildReserveRows } from './headlines';
import { buildHomeSnapshots } from './home-snapshots';
import { buildOutcomes } from './outcomes';
import {
  buildPersonas,
  districtPersonaIndex,
  divisionPersonaIndex,
} from './personas';
import { mulberry32 } from './prng';
import { buildReferrals, type ReferralContext } from './referrals';
import { floorAllTimestamps } from './round-time';
import { buildServiceRecords } from './services';
import { StudentPool, buildDivisionProfiles } from './students';
import { buildVendorNetwork } from './vendors';
import { buildVendorStats } from './vendor-stats';
import { buildAuthorizations, summarizeFunding } from './funding';
import { summarizeEscalations } from './escalations';
import { buildEmployers } from './employers';
import { buildAuditHistory } from './audit-history';
import { buildUnreferredStudents } from './school-rosters';

/** Change this and the entire dataset changes — reproducibly. */
export const SEED = 20260630;

export function buildBundle(seed = SEED): DemoDataBundle {
  const rng = mulberry32(seed);

  const geo = buildGeography(rng, loadLocalityRefs());
  const network = buildVendorNetwork(rng, geo);
  const personas = buildPersonas(rng, geo.districts, geo.divisions, network.vendors);

  const divisionPersona = divisionPersonaIndex(personas);
  const districtPersona = districtPersonaIndex(personas);
  const vendorById = new Map<string, Vendor>(network.vendors.map((v) => [v.id, v]));

  const schoolsByDivision = new Map<string, School[]>();
  for (const school of geo.schools) {
    const list = schoolsByDivision.get(school.divisionId) ?? [];
    list.push(school);
    schoolsByDivision.set(school.divisionId, list);
  }

  const profiles = buildDivisionProfiles(rng, geo.divisions, (divisionId) => {
    const division = geo.divisions.find((d) => d.id === divisionId);
    return division ? (geo.byFips.get(division.localityFips)?.isRural ?? true) : true;
  });

  const pool = new StudentPool(rng, profiles, schoolsByDivision);

  const referralContext: ReferralContext = {
    geo,
    vendors: network.vendors,
    vendorById,
    coverageByFips: network.coverageByFips,
    divisionPersona: (id) => divisionPersona.get(id) ?? 'DEMO-PER-STATE-001',
    districtPersona: (id) => districtPersona.get(id) ?? 'DEMO-PER-STATE-001',
    seed,
  };

  const built = buildReferrals(rng, referralContext, pool);
  const rawServices = buildServiceRecords(
    { seed, vendorById },
    built.referrals,
    new Map(pool.students.map((s) => [s.id, s])),
  );

  // Every timestamp drops to hour resolution before anything is measured, so aggregates
  // and on-screen derivations always agree. See round-time.ts for why.
  const referrals = floorAllTimestamps(built.referrals);
  const referredStudents = floorAllTimestamps(pool.students);
  // Students the schools know about who have no referral yet — appended, own stream.
  const students = [
    ...referredStudents,
    ...buildUnreferredStudents({
      seed,
      divisions: geo.divisions,
      schoolsByDivision,
      profiles,
      referrals,
      existingCount: referredStudents.length,
    }),
  ];
  const serviceRecords = floorAllTimestamps(rawServices);
  const studentById = new Map(students.map((s) => [s.id, s]));

  const outcomes = floorAllTimestamps(buildOutcomes(seed, referrals, studentById));

  // Reconciles each provider's own numbers against what actually happened.
  const vendorScorecards = buildVendorStats(rng, {
    vendors: network.vendors,
    referrals,
    services: serviceRecords,
    outcomes,
    strainedVendorIds: network.strainedVendorIds,
  });

  const coverage = buildCoverage(geo, network.vendors, referrals, outcomes);

  const vendorCountByDistrict = new Map<string, number>();
  for (const vendor of network.vendors) {
    const district = geo.byFips.get(vendor.headquartersFips)?.darsDistrictId;
    if (!district) continue;
    vendorCountByDistrict.set(district, (vendorCountByDistrict.get(district) ?? 0) + 1);
  }

  const { divisionMetrics, districtMetrics, stateMetrics } = aggregate({
    divisionIds: geo.divisions.map((d) => d.id),
    districtIds: geo.districts.map((d) => d.id),
    divisionDistrict: new Map(geo.divisions.map((d) => [d.id, d.darsDistrictId])),
    vendorCountByDistrict,
    localitiesWithoutCoverage: coverage.filter((c) => c.vendorCount === 0).length,
    referrals,
    services: serviceRecords,
    outcomes,
    studentById,
  });

  const headlines = buildHeadlines({
    referrals,
    services: serviceRecords,
    outcomes,
    stateMetrics,
  });

  const reserveRows = buildReserveRows(
    geo.districts.map((d) => d.id),
    referrals,
    serviceRecords,
  );

  // Live "waiting over 14 days" totals: summed across every submission cohort, because a
  // referral submitted last quarter is still waiting today.
  const unassignedByDistrict = new Map<string, number>();
  for (const row of districtMetrics) {
    unassignedByDistrict.set(
      row.darsDistrictId,
      (unassignedByDistrict.get(row.darsDistrictId) ?? 0) + row.unassignedOver14Days,
    );
  }

  const alerts = buildAlerts({
    divisions: geo.divisions,
    divisionMetrics,
    stateMetrics,
    headline: headlines[headlines.length - 1]!,
    coverage,
    vendors: network.vendors,
    personas,
    unassignedByDistrict,
  });

  // What each operational dashboard draws, resolved here so no browser has to.
  const homeSnapshots = buildHomeSnapshots({
    personas,
    divisions: geo.divisions,
    vendors: network.vendors,
    referrals,
    students,
  });

  // The IEP Partners feedback layer: funding authorizations, early warnings, employers.
  // Each draws from its own seeded stream, so none of it shifts the data above.
  const storedAuthorizations = buildAuthorizations(seed, referrals, serviceRecords);
  const districtByReferral = new Map(referrals.map((r) => [r.id, r.darsDistrictId]));
  const studentByReferral = new Map(referrals.map((r) => [r.id, r.studentId]));
  const authorizations = storedAuthorizations.map((a, i) => ({
    ...a,
    id: `DEMO-AUTH-${String(i + 1).padStart(6, '0')}`,
    studentId: studentByReferral.get(a.referralId) ?? '',
  }));
  const funding = summarizeFunding(
    storedAuthorizations,
    districtByReferral,
    geo.districts.map((d) => d.id),
    new Map(referrals.map((r) => [r.id, r.assignedVendorId])),
    network.vendors.map((v) => v.id),
  );
  const escalations = summarizeEscalations(
    referrals,
    geo.districts.map((d) => d.id),
    geo.divisions.map((d) => d.id),
    network.vendors.map((v) => v.id),
  );
  const employerBundle = buildEmployers(seed, geo.localities);

  // The month of access-log activity before the demonstration, built from the records above.
  const auditHistory = buildAuditHistory({
    seed,
    students,
    referrals,
    serviceRecords,
    outcomes,
    schools: geo.schools,
    personas,
    authorizations,
    employers: employerBundle.employers,
    postings: employerBundle.postings,
  });

  return {
    // Fixed, not the wall clock — see src/lib/demo-clock.ts.
    generatedAt: isoOf(REFERENCE_DATE),
    seed,
    periods: [...PERIODS],
    currentPeriod: CURRENT_PERIOD,
    referenceDate: isoOf(REFERENCE_DATE),
    localities: geo.localities,
    districts: geo.districts,
    divisions: geo.divisions,
    schools: geo.schools,
    vendors: network.vendors,
    personas,
    students,
    referrals,
    serviceRecords,
    outcomes,
    divisionMetrics,
    districtMetrics,
    stateMetrics,
    coverage,
    alerts,
    headlines,
    vendorScorecards,
    reserveRows,
    homeSnapshots,
    authorizations,
    funding,
    escalations,
    employers: employerBundle.employers,
    postings: employerBundle.postings,
    auditHistory,
  };
}
