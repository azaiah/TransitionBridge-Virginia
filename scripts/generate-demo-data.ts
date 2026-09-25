/**
 * Build-time data generator.
 *
 * Writes the demonstration dataset as several files rather than one, so a route only pays
 * for the data it actually renders: the statewide dashboards load `aggregates.json`
 * (small) and never touch `services.json` (large).
 *
 * Run: npm run generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildBundle, SEED } from './lib/build-bundle';
import { CURRENT_PERIOD } from './lib/calendar';
import { buildPlacesIndex, buildStudentsIndex } from './lib/search-index';
import { daysToAssignment, isStale, medianDays } from '../src/lib/metrics';
import {
  packRows,
  PACKED_REFERRAL_KEYS,
  PACKED_SERVICE_KEYS,
  PACKED_STUDENT_KEYS,
  PACKED_AUTHORIZATION_KEYS,
} from '../src/data/packed';

const OUT_DIR = path.resolve(process.cwd(), 'src/data/generated');

function write(name: string, data: unknown): number {
  const file = path.join(OUT_DIR, name);
  const json = JSON.stringify(data);
  writeFileSync(file, json);
  return Buffer.byteLength(json);
}

function mb(bytes: number): string {
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function main(): void {
  const startedAt = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });

  const bundle = buildBundle(SEED);

  const sizes = {
    geography: write('geography.json', {
      localities: bundle.localities,
      districts: bundle.districts,
      divisions: bundle.divisions,
      schools: bundle.schools,
    }),
    directory: write('directory.json', {
      vendors: bundle.vendors,
      personas: bundle.personas,
    }),
    // Students and referrals ship packed — tuple rows, with ids and geography rebuilt on
    // load. See src/data/packed.ts.
    students: write('students.json', packRows(bundle.students, PACKED_STUDENT_KEYS)),
    referrals: write('referrals.json', packRows(bundle.referrals, PACKED_REFERRAL_KEYS)),
    services: write('services.json', packRows(bundle.serviceRecords, PACKED_SERVICE_KEYS)),
    outcomes: write('outcomes.json', bundle.outcomes),
    aggregates: write('aggregates.json', {
      generatedAt: bundle.generatedAt,
      seed: bundle.seed,
      periods: bundle.periods,
      currentPeriod: bundle.currentPeriod,
      referenceDate: bundle.referenceDate,
      divisionMetrics: bundle.divisionMetrics,
      districtMetrics: bundle.districtMetrics,
      stateMetrics: bundle.stateMetrics,
      coverage: bundle.coverage,
      alerts: bundle.alerts,
      headlines: bundle.headlines,
      vendorScorecards: bundle.vendorScorecards,
      reserveRows: bundle.reserveRows,
      homeSnapshots: bundle.homeSnapshots,
      funding: bundle.funding,
      escalations: bundle.escalations,
    }),
    // Funding authorizations ship packed, like the other record files.
    authorizations: write(
      'authorizations.json',
      packRows(bundle.authorizations, PACKED_AUTHORIZATION_KEYS),
    ),
    auditHistory: write('audit-history.json', bundle.auditHistory),
    employers: write('employers.json', {
      employers: bundle.employers,
      postings: bundle.postings,
    }),
    // Global search. Places ship with every page; students are fetched on first use.
    searchPlaces: write('search-places.json', buildPlacesIndex(bundle)),
    searchStudents: write('search-students.json', buildStudentsIndex(bundle)),
  };

  report(bundle, sizes, Date.now() - startedAt);
}

function report(
  bundle: ReturnType<typeof buildBundle>,
  sizes: Record<string, number>,
  elapsedMs: number,
): void {
  const headline = bundle.headlines[bundle.headlines.length - 1]!;
  const state = bundle.stateMetrics.find((s) => s.period === CURRENT_PERIOD)!;
  const stale = bundle.referrals.filter((r) => isStale(r)).length;

  const declined = bundle.referrals.filter((r) => r.declineReason);
  const ruralRefs = new Set(
    bundle.localities.filter((l) => l.isRural).map((l) => l.fips),
  );
  const ruralReferrals = bundle.referrals.filter((r) => ruralRefs.has(r.localityFips));
  const barrier = bundle.referrals.filter((r) => r.transportationBarrier);
  const ruralBarrier = ruralReferrals.filter((r) => r.transportationBarrier);

  const utilization = bundle.vendors
    .filter((v) => v.capacityTotal > 0)
    .map((v) => v.capacityUsed / v.capacityTotal);
  const meanUtilization = utilization.reduce((a, b) => a + b, 0) / utilization.length;

  const completed = bundle.referrals.filter((r) => r.status === 'COMPLETED').length;
  const cie = bundle.outcomes.filter(
    (o) => o.type === 'COMPETITIVE_INTEGRATED_EMPLOYMENT',
  );

  const lines = [
    '',
    'TransitionBridge demonstration dataset',
    '─'.repeat(64),
    `  seed ${bundle.seed} · generated in ${(elapsedMs / 1000).toFixed(1)}s`,
    '',
    '  Scale',
    `    localities            ${bundle.localities.length}   (target 133)`,
    `    school divisions      ${bundle.divisions.length}   (target 132)`,
    `    high schools          ${bundle.schools.length}   (target ~330)`,
    `    providers             ${bundle.vendors.length}   (target 85)`,
    `    students              ${bundle.students.length}   (target ~9,000)`,
    `    referrals             ${bundle.referrals.length}   (target ~11,500)`,
    `    service records       ${bundle.serviceRecords.length}   (target ~46,000)`,
    `    outcomes              ${bundle.outcomes.length}   (target ~2,100)`,
    '',
    '  Deliberate findings',
    `    divisions, zero referrals this quarter   ${state.divisionsWithZeroReferrals}   (target 9–12)`,
    `    localities with no provider              ${state.localitiesWithoutVendorCoverage}   (target 8–12)`,
    `    localities with exactly one provider     ${bundle.coverage.filter((c) => c.vendorCount === 1).length}   (target 15+)`,
    `    referrals unassigned over 14 days        ${stale}   (target 90–140)`,
    `    work-based learning share of services    ${pct(headline.activityMix.work_based_learning)}   (target ~8%)`,
    `    transportation barrier, statewide        ${pct(barrier.length / bundle.referrals.length)}   (target ~23%)`,
    `    transportation barrier, rural            ${pct(ruralBarrier.length / Math.max(1, ruralReferrals.length))}   (target ~41%)`,
    `    mean provider capacity utilization       ${pct(meanUtilization)}   (target ~68%)`,
    `    providers above 85% utilization          ${utilization.filter((u) => u > 0.85).length}   (target 15+)`,
    `    providers above 95% utilization          ${utilization.filter((u) => u > 0.95).length}`,
    '',
    '  Waiting times (current quarter)',
    `    median days to assignment                ${state.totals.medianDaysToAssignment}`,
    `      urban localities                       ${medianAssign(bundle, false)}   (target ~9)`,
    `      rural localities                       ${medianAssign(bundle, true)}   (target 21+)`,
    `    median days to first service             ${headline.medianDaysToFirstService}`,
    `    with transportation barrier              ${headline.transportBarrierDaysToService.withBarrier}`,
    `    without transportation barrier           ${headline.transportBarrierDaysToService.withoutBarrier}`,
    '',
    '  Decline reasons (target 34 / 27 / 18 / 12 / 6 / 3)',
    ...Object.entries(declineMix(bundle)).map(
      ([reason, share]) => `    ${reason.padEnd(30)}${pct(share)}`,
    ),
    '',
    '  Mix checks',
    `    plan type   IEP ${pct(headline.planTypeMix.IEP)} · 504 ${pct(headline.planTypeMix.SECTION_504)} · other ${pct(headline.planTypeMix.DOCUMENTED_OTHER)}`,
    `    declines    ${declined.length} referrals with a recorded reason`,
    `    employment outcome rate                  ${pct(completed === 0 ? 0 : cie.length / completed)}   (target ~34%)`,
    `    services delivered in house              ${pct(headline.inHouseVsVendorServices.inHouse / Math.max(1, headline.inHouseVsVendorServices.inHouse + headline.inHouseVsVendorServices.vendor))}`,
    '',
    '  Reserve (illustrative)',
    `    requirement    $${state.reserveRequirement.toLocaleString()}`,
    `    spent to date  $${state.reserveSpentToDate.toLocaleString()}`,
    `    projected      $${state.reserveProjectedYearEnd.toLocaleString()}`,
    '',
    '  Funding (federal fiscal year 2026, illustrative)',
    ...bundle.funding.bySource.map(
      (row) =>
        `    ${row.source.padEnd(22)}${String(row.authorizations).padStart(6)} auths  $${row.dollarsUsed.toLocaleString()} of $${row.dollarsAuthorized.toLocaleString()}  near ${row.nearLimit}  over ${row.overAuthorized}`,
    ),
    `    DARS used vs reserve spent to date       ${bundle.funding.bySource.find((r) => r.source === 'DARS')?.dollarsUsed === state.reserveSpentToDate ? 'MATCH' : 'MISMATCH'}`,
    '',
    '  Early warnings (state)',
    ...Object.entries(bundle.escalations.state).map(
      ([stage, tiers]) => `    ${stage.padEnd(22)}14+ ${tiers[14]}  30+ ${tiers[30]}  90+ ${tiers[90]}`,
    ),
    `    dormant (open, stalled over a year)      ${bundle.escalations.dormant}`,
    '',
    `  Employers ${bundle.employers.length} · job postings ${bundle.postings.length}`,
    `  Access log history ${bundle.auditHistory.length} entries (${bundle.auditHistory.filter((e) => e.action === 'NAME_VIEWED').length} names shown, ${bundle.auditHistory.filter((e) => ['EXPORT_REFUSED', 'RECORD_REFUSED', 'SERVICE_REFUSED'].includes(e.action)).length} refused)`,
    '',
    '  Alerts',
    ...bundle.alerts.map((a) => `    ${a.severity.padEnd(5)} ${a.message}`),
    '',
    '  Payload',
    ...Object.entries(sizes).map(([name, bytes]) => `    ${`${name}.json`.padEnd(18)}${mb(bytes)}`),
    '',
  ];

  console.log(lines.join('\n'));
}

/** Share of each decline reason across every referral that recorded one. */
function declineMix(bundle: ReturnType<typeof buildBundle>): Record<string, number> {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const referral of bundle.referrals) {
    if (!referral.declineReason) continue;
    counts[referral.declineReason] = (counts[referral.declineReason] ?? 0) + 1;
    total++;
  }
  return Object.fromEntries(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, n]) => [reason, total === 0 ? 0 : n / total]),
  );
}

/** Median days from submission to assignment, split by rural / urban locality. */
function medianAssign(bundle: ReturnType<typeof buildBundle>, rural: boolean): number {
  const fips = new Set(
    bundle.localities.filter((l) => l.isRural === rural).map((l) => l.fips),
  );
  const days = bundle.referrals
    .filter((r) => fips.has(r.localityFips))
    .map((r) => daysToAssignment(r))
    .filter((n): n is number => n !== null);
  return medianDays(days) ?? 0;
}

main();
