/**
 * Synthetic students and the per-division composition that makes the IEP/504 view
 * interesting rather than uniform noise (docs/05_DEMO_DATA.md §3.2–§3.4, §3.11).
 */
import type {
  DiplomaTrack,
  PlanType,
  School,
  SchoolDivision,
  Student,
} from '../../src/data/types';
import type { Rng } from './prng';
import { chance, normal, pick, shuffle, weightedPick } from './prng';
import { studentDisplayName } from './names';

export type DivisionProfile = {
  divisionId: string;
  isRural: boolean;
  planTypeWeights: readonly (readonly [PlanType, number])[];
  diplomaWeights: readonly (readonly [DiplomaTrack, number])[];
};

/** A handful of divisions run markedly 504-heavy. That contrast is the point of the view. */
const SECTION_504_HEAVY_COUNT = 8;

export function buildDivisionProfiles(
  rng: Rng,
  divisions: SchoolDivision[],
  isRural: (divisionId: string) => boolean,
): Map<string, DivisionProfile> {
  const heavy504 = new Set(
    shuffle(rng, divisions)
      .slice(0, SECTION_504_HEAVY_COUNT)
      .map((d) => d.id),
  );

  const profiles = new Map<string, DivisionProfile>();

  for (const division of divisions) {
    let iepShare: number;
    let share504: number;

    if (heavy504.has(division.id)) {
      // Above 40% Section 504 — deliberately unusual, and drillable.
      share504 = Math.min(0.52, Math.max(0.4, normal(rng, 0.44, 0.04)));
      iepShare = Math.max(0.4, 0.94 - share504);
    } else {
      iepShare = Math.min(0.93, Math.max(0.45, normal(rng, 0.745, 0.09)));
      share504 = (1 - iepShare) * 0.78;
    }
    const shareOther = Math.max(0.01, 1 - iepShare - share504);

    // Diploma track varies by division; Applied Studies concentration differs materially.
    const applied = Math.min(0.5, Math.max(0.18, normal(rng, 0.34, 0.07)));
    const advanced = Math.min(0.18, Math.max(0.02, normal(rng, 0.08, 0.03)));
    const undetermined = Math.min(0.2, Math.max(0.04, normal(rng, 0.1, 0.03)));
    const standard = Math.max(0.2, 1 - applied - advanced - undetermined);

    profiles.set(division.id, {
      divisionId: division.id,
      isRural: isRural(division.id),
      planTypeWeights: [
        ['IEP', iepShare],
        ['SECTION_504', share504],
        ['DOCUMENTED_OTHER', shareOther],
      ],
      diplomaWeights: [
        ['STANDARD', standard],
        ['ADVANCED_STUDIES', advanced],
        ['APPLIED_STUDIES', applied],
        ['UNDETERMINED', undetermined],
      ],
    });
  }

  return profiles;
}

/** Upperclassman skew, with real 9th/10th presence so "start earlier" stays discussable. */
const GRADE_WEIGHTS = [
  [9, 0.2],
  [10, 0.25],
  [11, 0.29],
  [12, 0.26],
] as const;

/**
 * Creates students on demand and reuses them across quarters, so the ~11,500 referrals
 * resolve to ~9,000 distinct students rather than one student per referral.
 */
export class StudentPool {
  readonly students: Student[] = [];
  private byDivision = new Map<string, Student[]>();

  constructor(
    private rng: Rng,
    private profiles: Map<string, DivisionProfile>,
    private schoolsByDivision: Map<string, School[]>,
  ) {}

  /** Returns an existing student (22% of the time) or creates a new one. */
  obtain(divisionId: string): Student {
    const existing = this.byDivision.get(divisionId) ?? [];
    if (existing.length > 0 && chance(this.rng, 0.2)) {
      return pick(this.rng, existing);
    }
    return this.create(divisionId);
  }

  private create(divisionId: string): Student {
    const profile = this.profiles.get(divisionId);
    const schools = this.schoolsByDivision.get(divisionId) ?? [];
    const grade = weightedPick(this.rng, GRADE_WEIGHTS) as 9 | 10 | 11 | 12;

    // Age tracks grade with the usual spread. Never below the statutory floor of 14.
    const age = Math.max(14, grade + 5 + (chance(this.rng, 0.18) ? 1 : 0));

    const student: Student = {
      id: `DEMO-STU-${String(this.students.length + 1).padStart(6, '0')}`,
      displayName: studentDisplayName(this.rng),
      divisionId,
      schoolId: schools.length > 0 ? pick(this.rng, schools).id : `DEMO-SCH-00000`,
      gradeLevel: grade,
      age,
      planType: profile ? weightedPick(this.rng, profile.planTypeWeights) : 'IEP',
      diplomaTrack: profile ? weightedPick(this.rng, profile.diplomaWeights) : 'STANDARD',
      disabilityDocumented: true,
      // Transportation is the CSNA's headline barrier: ~41% rural vs ~17% urban.
      transportationBarrier: chance(this.rng, profile?.isRural ? 0.41 : 0.19),
      consentOnFile: false,
      consentDate: null,
      preEtsStartDate: null,
    };

    this.students.push(student);
    const bucket = this.byDivision.get(divisionId) ?? [];
    bucket.push(student);
    this.byDivision.set(divisionId, bucket);
    return student;
  }
}
