/**
 * The four demonstration accounts on the sign-in screen — one per portal.
 *
 * Every account is a SYNTHETIC persona from the generated dataset. None is a real
 * person, and there is no password behind any of them. We show no email address on
 * purpose: a fake address at a real agency or school domain would read as a real account.
 */
import type { Role } from '@/data/types';
import { ROLES } from '@/data/types';
import { getDistrictById, getDivisionById, getVendorById } from '@/data';
import { getPersonaForRole, getRoleConfig } from '@/lib/marketing';

export type DemoAccount = {
  role: Role;
  personaName: string;
  /** Job title, e.g. "Transition Coordinator". */
  title: string;
  /** Where they work, e.g. "Accomack County Public Schools". */
  organization: string;
  /** Plain-language portal name, e.g. "School portal". */
  portalName: string;
  /** What they will do there, in one short sentence. */
  portalPurpose: string;
  /** Where the account lands after sign-in. */
  href: string;
  /** Two-letter avatar text. */
  initials: string;
  /**
   * Avatar fill. Every value holds white text above 4.5:1, and the avatar always has
   * initials plus the name beside it, so color is never the only signal.
   */
  avatarClass: string;
};

/** Portal names and one-line purposes, written for someone who has never seen the product. */
const PORTAL_COPY: Record<Role, { name: string; purpose: string; avatar: string }> = {
  state_leadership: {
    name: 'State leadership portal',
    purpose: 'See the whole state at a glance and find where students are waiting.',
    avatar: 'bg-navy',
  },
  dars_counselor: {
    name: 'Counselor portal',
    purpose: 'Work the referral queue and match each student with a provider.',
    avatar: 'bg-viz-1',
  },
  school_coordinator: {
    name: 'School portal',
    purpose: 'Refer a student in minutes and follow their progress.',
    avatar: 'bg-orange-deep',
  },
  vendor: {
    name: 'Provider portal',
    purpose: 'Accept new students and log the services you deliver.',
    avatar: 'bg-viz-5',
  },
};

/** Turns a persona's scope id into a place name a person would recognise. */
function organizationFor(role: Role, scopeId: string): string {
  if (role === 'state_leadership') return 'Commonwealth of Virginia · Statewide';
  if (role === 'dars_counselor') {
    // District names already end in "District" (e.g. "Northern District").
    return getDistrictById(scopeId)?.name ?? 'Vocational rehabilitation';
  }
  if (role === 'school_coordinator') return getDivisionById(scopeId)?.name ?? 'School division';
  return getVendorById(scopeId)?.name ?? 'Service provider';
}

/** "S. Nolan" → "SN"; "M. Conley" → "MC". */
function initialsFor(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

/** Builds the four accounts in the order the roles are declared. */
export function getDemoAccounts(): DemoAccount[] {
  return ROLES.flatMap((role) => {
    const persona = getPersonaForRole(role);
    const config = getRoleConfig(role);
    if (!persona || !config) return [];
    const copy = PORTAL_COPY[role];
    return [
      {
        role,
        personaName: persona.displayName,
        title: persona.title,
        organization: organizationFor(role, persona.scopeId),
        portalName: copy.name,
        portalPurpose: copy.purpose,
        href: config.href,
        initials: initialsFor(persona.displayName),
        avatarClass: copy.avatar,
      },
    ];
  });
}
