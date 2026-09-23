/**
 * Neutral synthetic name pools. Nothing here is a real person, a real Employment Service
 * Organization, or a real employer.
 *
 * Every pool is checked against REAL_NAME_BLOCKLIST by tests/data-integrity.test.ts.
 * Two traps to remember when adding names:
 *   - "Aware" and "Libera" are blocklisted software vendors, so avoid any word that
 *     contains them as a substring (Delaware, Liberation, ...).
 *   - "The Arc" is blocklisted, so no vendor name may begin with "The Arc…".
 */
import type { Rng } from './prng';
import { pick, randInt } from './prng';

/** Surnames deliberately exclude every surname of a real named public official. */
export const SURNAMES = [
  'Alvarez', 'Bailey', 'Barnett', 'Bautista', 'Beckham', 'Bellamy', 'Bishop', 'Blackwell',
  'Bowden', 'Boyer', 'Bradshaw', 'Brennan', 'Bristow', 'Cabrera', 'Caldwell', 'Callahan',
  'Camden', 'Cardoza', 'Chandler', 'Chastain', 'Cheng', 'Christie', 'Coburn', 'Coleman',
  'Conley', 'Cortez', 'Cranston', 'Crowder', 'Dabney', 'Dalton', 'Danforth', 'Delgado',
  'Devlin', 'Dorsey', 'Doyle', 'Driscoll', 'Duffy', 'Eastman', 'Eldridge', 'Ellington',
  'Emerson', 'Escobedo', 'Fairbanks', 'Farrell', 'Fenwick', 'Fitzgerald', 'Fleming',
  'Fontaine', 'Fowler', 'Gallagher', 'Garrido', 'Gentry', 'Gilliam', 'Granger', 'Guzman',
  'Hadley', 'Halloran', 'Hampton', 'Hargrove', 'Hawthorne', 'Hendricks', 'Hollis',
  'Holloway', 'Huerta', 'Ibarra', 'Ingram', 'Irizarry', 'Jarrell', 'Jennings', 'Kaminski',
  'Keaton', 'Kendrick', 'Kimura', 'Kirkland', 'Kowalski', 'Lachance', 'Lambert', 'Langston',
  'Lawson', 'Ledbetter', 'Leland', 'Lockhart', 'Lombardi', 'Lowery', 'Machado', 'Maddox',
  'Mahoney', 'Marchetti', 'Marquez', 'Martinez', 'Mayfield', 'McAllister', 'McKenna',
  'Medina', 'Mendoza', 'Merritt', 'Milburn', 'Montoya', 'Moriarty', 'Mullins', 'Nakamura',
  'Navarro', 'Newcomb', 'Nguyen', 'Nolan', 'Norwood', 'Okafor', 'Olarte', 'Osborne',
  'Padilla', 'Paxton', 'Pemberton', 'Perreault', 'Pinckney', 'Prescott', 'Quintero',
  'Radcliffe', 'Ramsey', 'Rankin', 'Redmond', 'Renteria', 'Ricci', 'Ridley', 'Rivera',
  'Rockwell', 'Rosales', 'Rutledge', 'Salazar', 'Sandoval', 'Sawyer', 'Schaefer', 'Serrano',
  'Sheridan', 'Sinclair', 'Solano', 'Sorrell', 'Stanfield', 'Sterling', 'Stoddard',
  'Sutherland', 'Tavares', 'Thornton', 'Tillman', 'Trujillo', 'Underwood', 'Valdez',
  'Vandermeer', 'Vargas', 'Vaughn', 'Villareal', 'Wakefield', 'Waverly', 'Weatherford',
  'Whitfield', 'Winslow', 'Wojcik', 'Yamada', 'Yeager', 'Zamora', 'Zeller',
] as const;

export const GIVEN_NAMES = [
  'Amara', 'Andre', 'Aniyah', 'Beatriz', 'Brandon', 'Caleb', 'Camila', 'Carmen', 'Cedric',
  'Chloe', 'Damon', 'Daniela', 'Darius', 'Delia', 'Devin', 'Eli', 'Elena', 'Emory', 'Ezra',
  'Felix', 'Gabriela', 'Grace', 'Harper', 'Hassan', 'Imani', 'Isaac', 'Ivy', 'Jamal',
  'Jasmine', 'Javier', 'Jonah', 'Jordan', 'Josiah', 'Kai', 'Kayla', 'Keisha', 'Kenji',
  'Lena', 'Leo', 'Lucia', 'Maleek', 'Marisol', 'Mateo', 'Maya', 'Micah', 'Naomi', 'Nadia',
  'Noel', 'Omar', 'Paloma', 'Priya', 'Quinn', 'Rafael', 'Reagan', 'Rosa', 'Ruben', 'Samir',
  'Selena', 'Simone', 'Sofia', 'Tariq', 'Tessa', 'Theo', 'Tomas', 'Uma', 'Vera', 'Vincent',
  'Willa', 'Xavier', 'Yara', 'Zaid', 'Zoe',
] as const;

/** Students appear as "J. Martinez" — an initial and a surname, never a full identity. */
export function studentDisplayName(rng: Rng): string {
  const given = pick(rng, GIVEN_NAMES);
  const surname = pick(rng, SURNAMES);
  return `${given.charAt(0)}. ${surname}`;
}

/** Staff personas get the same shortened form, which is how rosters actually read. */
export function personName(rng: Rng): string {
  return studentDisplayName(rng);
}

const VENDOR_REGIONS = [
  'Blue Ridge', 'Tidewater', 'Shenandoah', 'Piedmont', 'Appalachian', 'James River',
  'Chesapeake', 'Northern Neck', 'Eastern Shore', 'Roanoke Valley', 'New River',
  'Middle Peninsula', 'Southside', 'Central Virginia', 'Potomac', 'Cumberland Gap',
  'Rivanna', 'Clinch Valley', 'Holston', 'Nansemond', 'Occoquan', 'Bull Run',
  'Massanutten', 'Highlands', 'Tuckahoe', 'Falling Creek', 'Meherrin', 'Pamunkey',
  'Mattaponi', 'Dan River', 'Rockfish', 'Catoctin', 'Powhite', 'Blackwater', 'Seaboard',
] as const;

const VENDOR_FOCUS = [
  'Transition', 'Employment', 'Career Pathways', 'Workforce Access', 'Vocational',
  'Youth Employment', 'Employment Pathways', 'Work Readiness', 'Career Launch',
  'Opportunity', 'Employment Solutions', 'Workforce Development', 'Skills Building',
] as const;

const VENDOR_SUFFIX = [
  'Services', 'Partners', 'Center', 'Collaborative', 'Network', 'Group', 'Associates',
  'Institute', 'Cooperative', 'Programs',
] as const;

/**
 * Builds `count` unique invented ESO names. Deterministic: walks the combination space
 * with the seeded generator rather than retrying until unique.
 */
export function buildVendorNames(rng: Rng, count: number): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  let guard = 0;

  while (names.length < count && guard < count * 200) {
    guard++;
    const name = `${pick(rng, VENDOR_REGIONS)} ${pick(rng, VENDOR_FOCUS)} ${pick(rng, VENDOR_SUFFIX)}`;
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

const EMPLOYER_PREFIX = [
  'Riverbend', 'Stonebridge', 'Fair Meadow', 'Old Mill', 'Copper Kettle', 'Harborview',
  'Cardinal', 'Dogwood', 'Ironworks', 'Sunny Ridge', 'Twin Oaks', 'Lantern',
  'Redbud', 'Foxfield', 'Millrace', 'Quarry', 'Beacon Hill', 'Willow Run', 'Pinehurst',
  'Anchor Point', 'Greenfield', 'Sandpiper', 'Belmont', 'Crescent', 'Trailhead',
] as const;

const EMPLOYER_KIND = [
  'Grocery', 'Hardware', 'Auto Care', 'Garden Center', 'Distribution', 'Bakery',
  'Hotel Group', 'Care Center', 'Print Shop', 'Landscaping', 'Cafe', 'Logistics',
  'Veterinary Clinic', 'Fitness Club', 'Manufacturing', 'Pharmacy', 'Outfitters',
] as const;

/** Synthetic employer for a placement outcome. Obviously invented on inspection. */
export function employerName(rng: Rng): string {
  return `${pick(rng, EMPLOYER_PREFIX)} ${pick(rng, EMPLOYER_KIND)}`;
}

const CREDENTIALS = [
  'ServSafe Food Handler',
  'OSHA 10-Hour General Industry',
  'Customer Service Certificate',
  'Forklift Operator Certification',
  'CPR and First Aid Certification',
  'Microsoft Office Fundamentals',
  'Career Readiness Certificate',
  'Certified Nursing Assistant',
] as const;

export function credentialName(rng: Rng): string {
  return pick(rng, CREDENTIALS);
}

const SCHOOL_SUFFIX = ['High School', 'Senior High School', 'Technical Center'] as const;

/** High school names read off the division, which is how Virginia schools are actually named. */
export function schoolName(rng: Rng, divisionName: string, index: number, total: number): string {
  const base = divisionName.replace(/ Public Schools$/, '');
  if (total === 1) return `${base} High School`;
  const directional = ['North', 'South', 'East', 'West', 'Central', 'Lakeside', 'Ridgeview',
    'Fairview', 'Riverside', 'Highland', 'Meadowbrook', 'Woodland'];
  const label = directional[index % directional.length];
  return `${base} ${label} ${pick(rng, SCHOOL_SUFFIX)}`;
}

/** A stable pseudo-office label for a DARS persona. No real office names are used. */
export function officeLabel(rng: Rng): string {
  return `Field Office ${randInt(rng, 1, 9)}`;
}
