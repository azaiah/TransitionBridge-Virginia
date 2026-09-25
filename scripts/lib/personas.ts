/**
 * Synthetic personas — the "viewing as" identities. No real DARS staff member, school
 * employee, or provider coordinator appears anywhere (CLAUDE.md §1.3).
 */
import type { DarsDistrict, Persona, SchoolDivision, Vendor } from '../../src/data/types';
import type { Rng } from './prng';
import { personName } from './names';

/**
 * The featured sign-in accounts all work on the same students, so one student can be
 * followed from every chair: the DARS counselor covers the Northern District, the school
 * coordinator is in a Northern District division, and the provider serves that division.
 */
export const FEATURED_DIVISION_ID = 'fairfax-county-public-schools';
export const FEATURED_VENDOR_ID = 'DEMO-VND-0003';

export function buildPersonas(
  rng: Rng,
  districts: DarsDistrict[],
  divisions: SchoolDivision[],
  vendors: Vendor[],
): Persona[] {
  const personas: Persona[] = [];

  // Fixed fictional name for the default state sign-in account. Burn one personName(rng)
  // first so the rest of the seeded dataset matches prior builds (tests depend on it).
  personName(rng);
  personas.push({
    id: 'DEMO-PER-STATE-001',
    role: 'state_leadership',
    displayName: 'J. Brown',
    title: 'Statewide Pre-ETS Program Director',
    scopeId: 'STATEWIDE',
    blurb: 'Sees every district, division, and provider in one view.',
  });

  districts.forEach((district, i) => {
    // First counselor = default sign-in persona; burn RNG then apply a fixed fake name.
    let displayName: string;
    if (i === 0) {
      personName(rng);
      displayName = 'A. Davis';
    } else {
      displayName = personName(rng);
    }
    personas.push({
      id: `DEMO-PER-DARS-${String(i + 1).padStart(3, '0')}`,
      role: 'dars_counselor',
      displayName,
      title: 'Vocational Rehabilitation Counselor',
      scopeId: district.id,
      blurb: `Triages the referral queue for ${district.name}.`,
    });
  });

  // Every division gets a transition coordinator, so every referral on the system has a
  // real submitter rather than being attributed to someone in another division.
  // Each index draws exactly one name, so moving the fixed name leaves the stream aligned.
  const featuredDivision = Math.max(0, divisions.findIndex((d) => d.id === FEATURED_DIVISION_ID));
  divisions.forEach((division, i) => {
    let displayName: string;
    if (i === featuredDivision) {
      personName(rng);
      displayName = 'C. Smith';
    } else {
      displayName = personName(rng);
    }
    personas.push({
      id: `DEMO-PER-SCHOOL-${String(i + 1).padStart(3, '0')}`,
      role: 'school_coordinator',
      displayName,
      title: 'Transition Coordinator',
      scopeId: division.id,
      blurb: `Submits and tracks referrals for ${division.name}.`,
    });
  });

  // One coordinator per provider, so every vendor action in a timeline has a real actor.
  // The id mirrors the provider's id (DEMO-VND-0042 → DEMO-PER-VND-0042) so a timeline
  // can name the actor without carrying a lookup table into the browser.
  const featuredVendor = Math.max(0, vendors.findIndex((v) => v.id === FEATURED_VENDOR_ID));
  vendors.forEach((vendor, i) => {
    let displayName: string;
    if (i === featuredVendor) {
      personName(rng);
      displayName = 'R. Miller';
    } else {
      displayName = personName(rng);
    }
    personas.push({
      id: `DEMO-PER-VND-${vendor.id.slice(-4)}`,
      role: 'vendor',
      displayName,
      title: 'Program Coordinator',
      scopeId: vendor.id,
      blurb: `Manages referrals and service logging for ${vendor.name}.`,
    });
  });

  // The first persona of each role is the one a portal opens as, so the featured accounts
  // go first within their role. Ids are unchanged; only the order moves.
  const featuredFirst = (p: Persona) =>
    (p.role === 'school_coordinator' && p.scopeId === FEATURED_DIVISION_ID) ||
    (p.role === 'vendor' && p.scopeId === FEATURED_VENDOR_ID)
      ? 0
      : 1;
  const roleOrder = new Map(personas.map((p, i) => [p.id, i]));
  return [...personas].sort(
    (a, b) =>
      (a.role === b.role ? featuredFirst(a) - featuredFirst(b) : 0) ||
      roleOrder.get(a.id)! - roleOrder.get(b.id)!,
  );
}

/** Vendor id → its coordinator persona id. Used to attribute timeline events. */
export function vendorPersonaIndex(personas: Persona[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const persona of personas) {
    if (persona.role === 'vendor') index.set(persona.scopeId, persona.id);
  }
  return index;
}

/** District id → its counselor persona id. */
export function districtPersonaIndex(personas: Persona[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const persona of personas) {
    if (persona.role === 'dars_counselor') index.set(persona.scopeId, persona.id);
  }
  return index;
}

/** Division id → its coordinator persona id, where one exists. */
export function divisionPersonaIndex(personas: Persona[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const persona of personas) {
    if (persona.role === 'school_coordinator') index.set(persona.scopeId, persona.id);
  }
  return index;
}
