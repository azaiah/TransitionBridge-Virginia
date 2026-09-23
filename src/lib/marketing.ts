import type { Role } from '@/data/types';
import { demoData } from '@/data';

export type RoleConfig = {
  role: Role;
  title: string;
  description: string;
  href: string;
  /** Three things this role gets on the platform. */
  benefits: [string, string, string];
};

export const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: 'state_leadership',
    title: 'State leadership',
    description: 'Monitor statewide demand, coverage gaps, and outcomes.',
    href: '/state/',
    // Benefits are written for a first-time visitor: what they can DO, in plain words.
    // The technical detail (WIOA §116, the 15% reserve) lives on the screens themselves.
    benefits: [
      'See every region, school division, and provider on one screen',
      'A map that shows where students need help and no provider is nearby',
      'Track outcomes and required spending without waiting for year-end reports',
    ],
  },
  {
    role: 'dars_counselor',
    title: 'DARS counselor',
    description: 'Triage the referral queue, assign vendors, and close the loop.',
    href: '/dars/',
    benefits: [
      'One list of new referrals, oldest first, with a flag when one waits 14+ days',
      'Suggested providers for each student, with the reason spelled out',
      'Every step of a student’s referral on one timeline',
    ],
  },
  {
    role: 'school_coordinator',
    title: 'School coordinator',
    description: 'Submit referrals, track status, and manage consent.',
    href: '/school/',
    benefits: [
      'Refer a student on one short form — most fields fill in for you',
      'See where each referral stands, the same way the counselor sees it',
      'A list of students who are old enough to be referred but have not been yet',
    ],
  },
  {
    role: 'vendor',
    title: 'Provider',
    description: 'Accept referrals, log services, and manage capacity.',
    href: '/vendor/',
    benefits: [
      'An inbox to accept new students, or decline with a reason',
      'Log a service in seconds — or a whole group session at once',
      'A scorecard that shows jobs, wages, and who is still working 90 days later',
    ],
  },
];

export function getPersonaForRole(role: Role) {
  return demoData.personas.find((p) => p.role === role);
}

export function getRoleConfig(role: Role) {
  return ROLE_CONFIGS.find((r) => r.role === role);
}

export const GAP_QUESTIONS = [
  {
    question: 'Which school divisions sent no Pre-ETS referrals this quarter?',
    whyHard:
      'Schools, DARS, and vendors each keep their own records. No one has a live division-level view.',
    href: '/state/divisions/?zeroReferrals=1',
  },
  {
    question: 'How many referrals are sitting unassigned right now, and for how long?',
    whyHard:
      'Referrals move through email, spreadsheets, and separate case systems. Aging is invisible until someone asks.',
    href: '/dars/queue/?filter=unassigned14',
  },
  {
    question: 'Which Virginia counties have no Pre-ETS vendor coverage?',
    whyHard:
      'Vendor capacity lives in provider files. Demand lives in counselor caseloads. They are never on the same map.',
    href: '/state/map/?layer=coverage',
  },
  {
    question: 'Of the students who completed services, how many are employed?',
    whyHard:
      'Outcomes are reported retrospectively for federal compliance — not tracked in real time across providers.',
    href: '/state/outcomes/',
  },
] as const;

export const TRUST_BADGES = [
  'WOSB — Woman-Owned Small Business',
  'SDVOSB — Service-Disabled Veteran-Owned',
  'Minority / Black American-Owned',
  'Small Disadvantaged Business',
  'Virginia-registered',
  'SAM-registered (verify before presenting)',
] as const;
