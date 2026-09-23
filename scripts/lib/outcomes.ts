/**
 * Outcomes for students who completed services.
 *
 * Two things matter here and both come straight from the 2025 CSNA:
 *   - Applied Studies outcomes are measurably lower than Standard. That differential is
 *     policy-relevant and invisible in every system Virginia runs today.
 *   - Placement QUALITY is recorded — wage and 90-day retention — because measuring
 *     placement count alone is the failure mode the assessment identified.
 */
import type { DiplomaTrack, OutcomeRecord, OutcomeType, StoredReferral, Student } from '../../src/data/types';
import { addDays, isoOf } from './calendar';
import { chance, lognormalClamped, randInt, subRng, weightedPick } from './prng';
import { credentialName, employerName } from './names';

/** Probability a completed student reaches competitive integrated employment. */
const CIE_BY_TRACK: Record<DiplomaTrack, number> = {
  ADVANCED_STUDIES: 0.44,
  STANDARD: 0.4,
  UNDETERMINED: 0.31,
  APPLIED_STUDIES: 0.23,
};

/** How the remaining students distribute. docs/05_DEMO_DATA.md §3.10. */
const NON_EMPLOYMENT_WEIGHTS = [
  ['CONTINUED_TO_VR', 0.22],
  ['POSTSECONDARY_ENROLLED', 0.18],
  ['NO_OUTCOME_RECORDED', 0.15],
  ['CREDENTIAL_ATTAINED', 0.11],
] as const satisfies readonly (readonly [OutcomeType, number])[];

export function buildOutcomes(
  seed: number,
  referrals: StoredReferral[],
  studentById: Map<string, Student>,
): OutcomeRecord[] {
  const outcomes: OutcomeRecord[] = [];

  for (const referral of referrals) {
    if (referral.status !== 'COMPLETED' || !referral.completedAt) continue;

    const rng = subRng(seed, `out:${referral.id}`);
    const student = studentById.get(referral.studentId);
    const track = student?.diplomaTrack ?? 'STANDARD';

    const employed = chance(rng, CIE_BY_TRACK[track]);
    const type: OutcomeType = employed
      ? 'COMPETITIVE_INTEGRATED_EMPLOYMENT'
      : weightedPick(rng, NON_EMPLOYMENT_WEIGHTS);

    // Recorded a little after completion, the way follow-up actually works.
    const recordedAt = isoOf(addDays(new Date(referral.completedAt), randInt(rng, 3, 40)));

    // Median around $13.80/hr with a right tail — the low-wage concern, made measurable.
    const wage = employed ? Number(lognormalClamped(rng, 13.8, 0.24, 9.5, 31).toFixed(2)) : null;

    outcomes.push({
      id: `DEMO-OUT-${String(outcomes.length + 1).padStart(6, '0')}`,
      studentId: referral.studentId,
      referralId: referral.id,
      type,
      recordedAt,
      employerNameSynthetic: employed ? employerName(rng) : null,
      hourlyWage: wage,
      hoursPerWeek: employed ? weightedPick(rng, [[12, 0.2], [18, 0.3], [24, 0.3], [32, 0.15], [40, 0.05]] as const) : null,
      // Retention tracks wage: better-paid placements hold. ~61% overall.
      retained90Days: employed ? chance(rng, retentionOdds(wage ?? 13.8)) : null,
      credentialName: type === 'CREDENTIAL_ATTAINED' ? credentialName(rng) : null,
    });
  }

  return outcomes;
}

/** Higher wage placements retain better. Centred so the statewide rate lands near 61%. */
function retentionOdds(wage: number): number {
  return Math.min(0.86, Math.max(0.34, 0.61 + (wage - 13.8) * 0.035));
}
