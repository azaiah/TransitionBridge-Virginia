/**
 * Home-screen snapshots, computed once at build time.
 *
 * The three operational dashboards (counselor, coordinator, provider) each showed four or
 * five numbers that were derived by scanning eleven thousand referral rows in the browser.
 * That meant the FIRST screen of every demonstration downloaded the heaviest data in the
 * product to render a handful of counts (CLAUDE.md §3.3).
 *
 * These snapshots carry exactly what those screens draw — the counts, plus the few named
 * rows the coordinator's two panels list — so the dashboards load aggregates only.
 */
import type {
  HomeSnapshots,
  Persona,
  SchoolDivision,
  StoredReferral,
  Student,
  Vendor,
} from '../../src/data/types';
import { isStale, isOpen, UNASSIGNED_STATUSES } from '../../src/lib/metrics';

const UNASSIGNED: readonly string[] = UNASSIGNED_STATUSES;

interface SnapshotInput {
  personas: Persona[];
  divisions: SchoolDivision[];
  vendors: Vendor[];
  referrals: StoredReferral[];
  students: Student[];
}

export function buildHomeSnapshots(input: SnapshotInput): HomeSnapshots {
  return {
    counselors: buildCounselorHomes(input),
    coordinators: buildCoordinatorHomes(input),
    providers: buildProviderHomes(input),
  };
}

/**
 * A counselor's caseload: everything their district owns that they have touched, plus
 * everything nobody has picked up yet. Mirrors the filter the dashboard used to run.
 */
function buildCounselorHomes({ personas, referrals }: SnapshotInput) {
  const counselors = personas.filter((p) => p.role === 'dars_counselor');
  const byDistrict = groupBy(referrals, (r) => r.darsDistrictId);

  return counselors.map((persona) => {
    const mine = (byDistrict.get(persona.scopeId) ?? []).filter(
      (r) =>
        r.reviewedByPersonaId === persona.id ||
        (!r.reviewedByPersonaId && UNASSIGNED.includes(r.status)),
    );
    const awaitingTriage = mine.filter((r) => UNASSIGNED.includes(r.status));

    return {
      personaId: persona.id,
      awaitingTriage: awaitingTriage.length,
      unassignedOver14Days: awaitingTriage.filter((r) => isStale(r)).length,
      activeStudents: mine.filter(
        (r) => r.status === 'ASSIGNED' || r.status === 'IN_SERVICE',
      ).length,
    };
  });
}

/**
 * A coordinator's own referrals, plus the two lists their dashboard shows: consent still
 * outstanding, and students who look eligible but have no referral on file.
 */
function buildCoordinatorHomes({ personas, referrals, students }: SnapshotInput) {
  const coordinators = personas.filter((p) => p.role === 'school_coordinator');
  const byDivision = groupBy(referrals, (r) => r.divisionId);
  const studentsByDivision = groupBy(students, (s) => s.divisionId);
  const studentName = new Map(students.map((s) => [s.id, s.displayName]));

  return coordinators.map((persona) => {
    const divisionReferrals = byDivision.get(persona.scopeId) ?? [];
    const mine = divisionReferrals.filter((r) => r.submittedByPersonaId === persona.id);
    const awaitingConsent = mine.filter((r) => r.status === 'AWAITING_CONSENT');

    // Eligibility is judged against every referral in the division, not just this
    // coordinator's — a student referred by a colleague has still been referred.
    const referred = new Set(divisionReferrals.map((r) => r.studentId));
    const eligible = (studentsByDivision.get(persona.scopeId) ?? []).filter(
      (s) =>
        s.age >= 14 &&
        (s.planType === 'IEP' || s.planType === 'SECTION_504') &&
        !referred.has(s.id),
    );

    return {
      personaId: persona.id,
      activeReferrals: mine.filter((r) => isOpen(r.status)).length,
      awaitingConsent: awaitingConsent.length,
      stuckOver14Days: mine.filter((r) => isStale(r)).length,
      // Only the rows the panel actually renders travel to the browser.
      consentAlerts: awaitingConsent.slice(0, 3).map((r) => ({
        referralId: r.id,
        studentName: studentName.get(r.studentId) ?? 'Student',
      })),
      eligibleNotReferredCount: eligible.length,
      eligibleNotReferred: eligible.slice(0, 5).map((s) => ({
        studentId: s.id,
        displayName: s.displayName,
        age: s.age,
        planType: s.planType,
      })),
    };
  });
}

/** A provider's two live numbers: offers waiting on them, and students in service. */
function buildProviderHomes({ personas, vendors, referrals }: SnapshotInput) {
  const providers = personas.filter((p) => p.role === 'vendor');
  const vendorById = new Map(vendors.map((v) => [v.id, v]));
  const byAssignedVendor = groupBy(referrals, (r) => r.assignedVendorId ?? '');

  // One pass over every open offer, bucketed by locality, so each provider only has to
  // look up the localities it serves rather than rescan the whole referral file.
  const openOffersByFips = new Map<string, number>();
  for (const referral of referrals) {
    if (referral.status !== 'READY_TO_ASSIGN') continue;
    openOffersByFips.set(
      referral.localityFips,
      (openOffersByFips.get(referral.localityFips) ?? 0) + 1,
    );
  }

  return providers.map((persona) => {
    const vendor = vendorById.get(persona.scopeId);
    const openOffers = (vendor?.servedLocalityFips ?? []).reduce(
      (n, fips) => n + (openOffersByFips.get(fips) ?? 0),
      0,
    );

    return {
      personaId: persona.id,
      openOffers,
      activeStudents: (byAssignedVendor.get(persona.scopeId) ?? []).filter(
        (r) => r.status === 'ASSIGNED' || r.status === 'IN_SERVICE',
      ).length,
    };
  });
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}
