/**
 * Synthetic personas — the "viewing as" identities. No real DARS staff member, school
 * employee, or provider coordinator appears anywhere (CLAUDE.md §1.3).
 */
import type { DarsDistrict, Persona, SchoolDivision, Vendor } from '../../src/data/types';
import type { Rng } from './prng';
import { personName } from './names';

export function buildPersonas(
  rng: Rng,
  districts: DarsDistrict[],
  divisions: SchoolDivision[],
  vendors: Vendor[],
): Persona[] {
  const personas: Persona[] = [];

  personas.push({
    id: 'DEMO-PER-STATE-001',
    role: 'state_leadership',
    displayName: personName(rng),
    title: 'Statewide Pre-ETS Program Director',
    scopeId: 'STATEWIDE',
    blurb: 'Sees every district, division, and provider in one view.',
  });

  districts.forEach((district, i) => {
    personas.push({
      id: `DEMO-PER-DARS-${String(i + 1).padStart(3, '0')}`,
      role: 'dars_counselor',
      displayName: personName(rng),
      title: 'Vocational Rehabilitation Counselor',
      scopeId: district.id,
      blurb: `Triages the referral queue for ${district.name}.`,
    });
  });

  // Every division gets a transition coordinator, so every referral on the system has a
  // real submitter rather than being attributed to someone in another division.
  divisions.forEach((division, i) => {
    personas.push({
      id: `DEMO-PER-SCHOOL-${String(i + 1).padStart(3, '0')}`,
      role: 'school_coordinator',
      displayName: personName(rng),
      title: 'Transition Coordinator',
      scopeId: division.id,
      blurb: `Submits and tracks referrals for ${division.name}.`,
    });
  });

  // One coordinator per provider, so every vendor action in a timeline has a real actor.
  // The id mirrors the provider's id (DEMO-VND-0042 → DEMO-PER-VND-0042) so a timeline
  // can name the actor without carrying a lookup table into the browser.
  vendors.forEach((vendor) => {
    personas.push({
      id: `DEMO-PER-VND-${vendor.id.slice(-4)}`,
      role: 'vendor',
      displayName: personName(rng),
      title: 'Program Coordinator',
      scopeId: vendor.id,
      blurb: `Manages referrals and service logging for ${vendor.name}.`,
    });
  });

  return personas;
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
