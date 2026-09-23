/**
 * Real public geography: 133 Virginia localities, 6 DARS districts, 132 school divisions,
 * and the generated high schools hanging off them.
 *
 * Only the geography is real. Everything that HAPPENS on it is generated
 * (docs/05_DEMO_DATA.md §1.5).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { DarsDistrict, Locality, School, SchoolDivision } from '../../src/data/types';
import type { Rng } from './prng';
import { schoolName } from './names';
import {
  COMBINED_DIVISIONS,
  DISTRICT_DEFS,
  DIVISION_ENROLLMENT,
  LOCALITY_DISTRICT,
  TOWN_DIVISIONS,
  URBAN_FIPS,
} from './reference';

export type LocalityRef = {
  fips: string;
  name: string;
  type: 'COUNTY' | 'CITY';
  centroid: [number, number];
  areaRank: number;
};

export type Geography = {
  localities: Locality[];
  districts: DarsDistrict[];
  divisions: SchoolDivision[];
  schools: School[];
  /** Division id → the localities that division serves (combined divisions serve two). */
  divisionLocalities: Map<string, string[]>;
  /** Locality FIPS → the divisions operating in it. */
  localityDivisions: Map<string, string[]>;
  byFips: Map<string, Locality>;
};

export function loadLocalityRefs(): LocalityRef[] {
  const file = path.resolve(process.cwd(), 'src/data/geo/locality-reference.json');
  return JSON.parse(readFileSync(file, 'utf8')) as LocalityRef[];
}

function divisionIdFor(localityName: string): string {
  const base = localityName
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `${base}-public-schools`;
}

function divisionNameFor(localityName: string): string {
  return `${localityName.replace(/ (County|City)$/, '')} Public Schools`;
}

/** Roughly 330 high schools statewide, distributed by division size. */
function highSchoolCountFor(enrollment: number): number {
  return Math.min(12, 1 + Math.floor(enrollment / 3900));
}

export function buildGeography(rng: Rng, refs: LocalityRef[]): Geography {
  const localities: Locality[] = refs.map((r) => ({
    fips: r.fips,
    name: r.name,
    type: r.type,
    darsDistrictId: LOCALITY_DISTRICT[r.fips] ?? 'capital',
    isRural: !URBAN_FIPS.has(r.fips),
    centroid: r.centroid,
  }));

  const byFips = new Map(localities.map((l) => [l.fips, l]));

  const districts: DarsDistrict[] = DISTRICT_DEFS.map((d) => ({
    id: d.id,
    name: d.name,
    officeCount: d.officeCount,
    localityFips: localities.filter((l) => l.darsDistrictId === d.id).map((l) => l.fips),
  }));

  const divisions: SchoolDivision[] = [];
  const divisionLocalities = new Map<string, string[]>();

  /** Localities already served by a combined division do not get their own division. */
  const absorbed = new Set<string>();
  for (const combo of COMBINED_DIVISIONS) {
    combo.fips.forEach((f) => absorbed.add(f));
  }

  const push = (division: SchoolDivision, serves: string[]) => {
    divisions.push(division);
    divisionLocalities.set(division.id, serves);
  };

  for (const combo of COMBINED_DIVISIONS) {
    const seat = combo.fips[0] as string;
    const enrollment = DIVISION_ENROLLMENT[combo.id] ?? 2200;
    push(
      {
        id: combo.id,
        name: combo.name,
        localityFips: seat,
        darsDistrictId: LOCALITY_DISTRICT[seat] ?? 'capital',
        highSchoolCount: highSchoolCountFor(enrollment),
        estimatedSwdEnrollment: enrollment,
      },
      [...combo.fips],
    );
  }

  for (const ref of refs) {
    if (absorbed.has(ref.fips)) continue;
    const id = divisionIdFor(ref.name);
    const enrollment = DIVISION_ENROLLMENT[id] ?? 1200;
    push(
      {
        id,
        name: divisionNameFor(ref.name),
        localityFips: ref.fips,
        darsDistrictId: LOCALITY_DISTRICT[ref.fips] ?? 'capital',
        highSchoolCount: highSchoolCountFor(enrollment),
        estimatedSwdEnrollment: enrollment,
      },
      [ref.fips],
    );
  }

  // Virginia's two town divisions operate alongside — not instead of — their county
  // division. Absorbing their locality would silently drop two real divisions.
  for (const town of TOWN_DIVISIONS) {
    const enrollment = DIVISION_ENROLLMENT[town.id] ?? 600;
    push(
      {
        id: town.id,
        name: town.name,
        localityFips: town.fips,
        darsDistrictId: LOCALITY_DISTRICT[town.fips] ?? 'capital',
        highSchoolCount: 1,
        estimatedSwdEnrollment: enrollment,
      },
      [town.fips],
    );
  }

  divisions.sort((a, b) => a.name.localeCompare(b.name));

  const localityDivisions = new Map<string, string[]>();
  for (const [divisionId, fipsList] of divisionLocalities) {
    for (const fips of fipsList) {
      const existing = localityDivisions.get(fips) ?? [];
      existing.push(divisionId);
      localityDivisions.set(fips, existing);
    }
  }

  const schools: School[] = [];
  for (const division of divisions) {
    for (let i = 0; i < division.highSchoolCount; i++) {
      schools.push({
        id: `DEMO-SCH-${String(schools.length + 1).padStart(5, '0')}`,
        name: schoolName(rng, division.name, i, division.highSchoolCount),
        divisionId: division.id,
        gradesServed: '9-12',
      });
    }
  }

  return { localities, districts, divisions, schools, divisionLocalities, localityDivisions, byFips };
}

/** Great-circle distance in miles between two [lon, lat] centroids. */
export function milesBetween(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
