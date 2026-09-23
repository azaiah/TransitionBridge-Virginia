/**
 * Loads the committed demonstration dataset from disk for the validation suite.
 * Reading the generated files (rather than importing the generator) means the tests
 * check what actually ships.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  unpackReferrals,
  unpackServices,
  unpackStudents,
  type PackedTable,
  type SchoolPlacement,
} from '../../src/data/packed';
import type {
  Alert,
  CoverageCell,
  DemoDataBundle,
  OutcomeRecord,
  SchoolDivision,
  School,
  ServiceRecord,
} from '../../src/data/types';

const DIR = path.resolve(process.cwd(), 'src/data/generated');

function read<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(DIR, name), 'utf8')) as T;
}

export function loadBundle(): DemoDataBundle {
  const geography = read<Record<string, unknown>>('geography.json');
  const directory = read<Record<string, unknown>>('directory.json');
  const aggregates = read<Record<string, unknown>>('aggregates.json');

  // Every record file ships packed, so the suite decodes them exactly the way the
  // application does — which also proves the shipped files decode at all.
  const placementOf = schoolPlacements(
    geography.schools as School[],
    geography.divisions as SchoolDivision[],
  );

  const students = unpackStudents(read<PackedTable>('students.json'), placementOf);
  const referrals = unpackReferrals(read<PackedTable>('referrals.json'), placementOf);
  const studentIdByReferral = new Map(referrals.map((r) => [r.id, r.studentId]));

  const serviceRecords: ServiceRecord[] = unpackServices(
    read<PackedTable>('services.json'),
    (referralId) => studentIdByReferral.get(referralId),
  );

  return {
    ...geography,
    ...directory,
    ...aggregates,
    students,
    referrals,
    outcomes: read<OutcomeRecord[]>('outcomes.json'),
    serviceRecords,
  } as unknown as DemoDataBundle;
}

/** School id → the division, district, and locality the packed files leave out. */
function schoolPlacements(
  schools: School[],
  divisions: SchoolDivision[],
): (schoolId: string) => SchoolPlacement | undefined {
  const divisionById = new Map(divisions.map((d) => [d.id, d]));
  const bySchool = new Map<string, SchoolPlacement>();

  for (const school of schools) {
    const division = divisionById.get(school.divisionId);
    if (!division) continue;
    bySchool.set(school.id, {
      divisionId: division.id,
      darsDistrictId: division.darsDistrictId,
      localityFips: division.localityFips,
    });
  }

  return (schoolId: string) => bySchool.get(schoolId);
}

/**
 * Every route the application actually serves, derived from the App Router file tree.
 * Used to prove an alert cannot link somewhere that does not exist.
 */
export function appRoutes(): Set<string> {
  const root = path.resolve(process.cwd(), 'src/app');
  const routes = new Set<string>();

  const walk = (dir: string, route: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // Route groups and private folders do not appear in the URL.
        if (entry.name.startsWith('_')) continue;
        const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
        walk(path.join(dir, entry.name), route + segment);
      } else if (entry.name === 'page.tsx') {
        routes.add(`${route || ''}/`);
      }
    }
  };

  walk(root, '');
  return routes;
}

export type AlertWithScope = Alert & { coverage?: CoverageCell[] };
