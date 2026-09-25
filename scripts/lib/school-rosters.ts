/**
 * Students a school knows about who have no Pre-ETS referral yet — the school portal's
 * "Eligible, not referred", "Missing disability documentation", and "Approaching age-out"
 * lists. Every other student in the dataset was created by a referral, so without these the
 * school's own worklists would always be empty.
 *
 * They are appended after every referred student (ids continue the same sequence) and drawn
 * from their own seeded stream, so no existing student, referral, or aggregate moves: none of
 * these students has a referral, and every statewide count is built from referrals.
 *
 * A few are older students on the Applied Studies track — still in school through 21 under
 * their IEP — which is exactly who ages out of Pre-ETS at 22 if nobody refers them.
 */
import type { School, SchoolDivision, StoredReferral, Student } from '../../src/data/types';
import { chance, pick, randInt, subRng, weightedPick } from './prng';
import { studentDisplayName } from './names';
import type { DivisionProfile } from './students';

/** Roughly this share of a division's referred students are known but not yet referred. */
const UNREFERRED_SHARE = 0.04;
const MIN_PER_DIVISION = 2;
const MAX_PER_DIVISION = 40;

export function buildUnreferredStudents(input: {
  seed: number;
  divisions: SchoolDivision[];
  schoolsByDivision: Map<string, School[]>;
  profiles: Map<string, DivisionProfile>;
  referrals: StoredReferral[];
  existingCount: number;
}): Student[] {
  const referredByDivision = new Map<string, Set<string>>();
  for (const r of input.referrals) {
    const set = referredByDivision.get(r.divisionId) ?? new Set<string>();
    set.add(r.studentId);
    referredByDivision.set(r.divisionId, set);
  }

  const out: Student[] = [];
  for (const division of input.divisions) {
    const rng = subRng(input.seed, `unreferred:${division.id}`);
    const referred = referredByDivision.get(division.id)?.size ?? 0;
    const count = Math.min(
      MAX_PER_DIVISION,
      Math.max(MIN_PER_DIVISION, Math.round(referred * UNREFERRED_SHARE)),
    );
    const profile = input.profiles.get(division.id);
    const schools = input.schoolsByDivision.get(division.id) ?? [];

    for (let i = 0; i < count; i++) {
      const planType = profile
        ? weightedPick(rng, profile.planTypeWeights.filter(([p]) => p !== 'DOCUMENTED_OTHER'))
        : 'IEP';
      // About one in eight is an older Applied Studies student, still in school past 18.
      const older = planType === 'IEP' && chance(rng, 0.13);
      const grade = older ? 12 : weightedPick(rng, [[9, 0.34], [10, 0.3], [11, 0.22], [12, 0.14]] as const);
      const age = older ? randInt(rng, 19, 21) : Math.max(14, grade + 5 + (chance(rng, 0.18) ? 1 : 0));

      out.push({
        id: `DEMO-STU-${String(input.existingCount + out.length + 1).padStart(6, '0')}`,
        displayName: studentDisplayName(rng),
        divisionId: division.id,
        schoolId: schools.length > 0 ? pick(rng, schools).id : 'DEMO-SCH-00000',
        gradeLevel: grade as 9 | 10 | 11 | 12,
        age,
        planType,
        diplomaTrack: older
          ? 'APPLIED_STUDIES'
          : profile
            ? weightedPick(rng, profile.diplomaWeights)
            : 'STANDARD',
        // A referral needs the documentation behind the plan; some are still waiting on it.
        disabilityDocumented: chance(rng, 0.78),
        transportationBarrier: chance(rng, profile?.isRural ? 0.41 : 0.19),
        consentOnFile: false,
        consentDate: null,
        preEtsStartDate: null,
      });
    }
  }
  return out;
}
