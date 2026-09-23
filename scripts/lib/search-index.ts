/**
 * Build-time search index.
 *
 * Split in two on purpose. Places (districts, divisions, schools, providers) are a few
 * hundred rows and ship with every page so search answers instantly and can never fail.
 * Students are nine thousand rows, so they go in their own file that is fetched the first
 * time somebody uses the search box — a statewide dashboard should not pay for them.
 */
import type { SearchEntry, StudentIndexPayload } from '../../src/lib/search';
import type {
  DarsDistrict,
  School,
  SchoolDivision,
  Student,
  Vendor,
} from '../../src/data/types';

export interface SearchIndexInput {
  districts: DarsDistrict[];
  divisions: SchoolDivision[];
  schools: School[];
  vendors: Vendor[];
  students: Student[];
}

/**
 * Search results land on a list already filtered to the thing you picked. The `find`
 * parameter is read by every data table, so one convention covers the whole product.
 */
function findHref(path: string, name: string): string {
  return `${path}?find=${encodeURIComponent(name)}`;
}

export function buildPlacesIndex(input: SearchIndexInput): SearchEntry[] {
  const divisionName = new Map(input.divisions.map((d) => [d.id, d.name]));
  const districtName = new Map(input.districts.map((d) => [d.id, d.name]));

  const districts: SearchEntry[] = input.districts.map((district) => ({
    kind: 'district',
    id: district.id,
    label: district.name,
    sub: `${district.localityFips.length} localities`,
    href: findHref('/state/districts/', district.name),
  }));

  const divisions: SearchEntry[] = input.divisions.map((division) => ({
    kind: 'division',
    id: division.id,
    label: division.name,
    sub: districtName.get(division.darsDistrictId) ?? 'School division',
    href: findHref('/state/divisions/', division.name),
  }));

  // A school has no screen of its own, so it lands on its division's row.
  const schools: SearchEntry[] = input.schools.map((school) => ({
    kind: 'school',
    id: school.id,
    label: school.name,
    sub: divisionName.get(school.divisionId) ?? 'High school',
    href: findHref('/state/divisions/', divisionName.get(school.divisionId) ?? ''),
  }));

  const vendors: SearchEntry[] = input.vendors.map((vendor) => ({
    kind: 'vendor',
    id: vendor.id,
    label: vendor.name,
    sub: `Serves ${vendor.servedLocalityFips.length} localities`,
    href: findHref('/state/vendors/', vendor.name),
  }));

  return [...districts, ...divisions, ...schools, ...vendors];
}

/**
 * Students are written in a compact shape — shared id prefix, division names looked up by
 * position — and expanded in the browser. Written as objects this file is 1.4 MB; written
 * this way it is under 300 KB, which is the difference between a fetch you notice and one
 * you don't.
 */
export function buildStudentsIndex(input: SearchIndexInput): StudentIndexPayload {
  const divisionNames = input.divisions.map((d) => d.name);
  const divisionIndex = new Map(input.divisions.map((d, i) => [d.id, i]));
  const prefix = 'DEMO-STU-';

  return {
    idPrefix: prefix,
    divisions: divisionNames,
    rows: input.students.map((student) => [
      student.displayName,
      student.id.startsWith(prefix) ? student.id.slice(prefix.length) : student.id,
      divisionIndex.get(student.divisionId) ?? -1,
    ]),
  };
}
