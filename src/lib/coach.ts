/**
 * First-run coaching. Three steps per role — where you are, the one number that matters,
 * and the one thing you would do — and never more. docs/11_USABILITY.md "First-run".
 *
 * Steps point at elements marked with `data-coach`. A step whose target is missing still
 * shows its card, so a coach mark can never block somebody on a screen that changed.
 */
import type { Role } from '@/data/types';

export interface CoachStep {
  /** `data-coach` value of the element to ring. */
  target: string;
  title: string;
  body: string;
}

export const COACH_STEPS: Record<Role, CoachStep[]> = {
  state_leadership: [
    {
      target: 'nav',
      title: 'You are looking at the whole Commonwealth',
      body: 'Every district, division, and provider in Virginia is in this view. Use the menu on the left to move between the four points of view.',
    },
    {
      target: 'metric',
      title: 'Start with the top row',
      body: 'These are the numbers a Commissioner asks for first. Referrals waiting more than 14 days is the one that usually needs an answer today.',
    },
    {
      target: 'action',
      title: 'Anything needing attention is listed here',
      body: 'Each alert names the district, says how long it has been true, and links straight to the records behind it. Nothing here is a dead end.',
    },
  ],
  dars_counselor: [
    {
      target: 'nav',
      title: 'This is your district, not the whole state',
      body: 'Everything you see is scoped to your district and your caseload. The menu on the left switches between views.',
    },
    {
      target: 'metric',
      title: 'The number that matters is the wait',
      body: 'Referrals unassigned more than 14 days are the ones at risk. Selecting that tile opens exactly those referrals, oldest first.',
    },
    {
      target: 'action',
      title: 'Work the queue from the top',
      body: 'Your queue is sorted oldest first on purpose. Open a referral, compare providers, and assign — the reasons behind each provider ranking are shown, never hidden.',
    },
  ],
  school_coordinator: [
    {
      target: 'nav',
      title: 'This is your division',
      body: 'You see the students and referrals for your division only. The menu on the left moves between your referrals, students, and compliance.',
    },
    {
      target: 'metric',
      title: 'Watch consent and anything stuck',
      body: 'Referrals waiting on a consent form, and referrals sitting more than 14 days without a provider, are the two things that hold a student up.',
    },
    {
      target: 'action',
      title: 'Referring a student takes about 90 seconds',
      body: 'Anything already on the student record is filled in for you. You will never be asked twice for something the system already knows.',
    },
  ],
  vendor: [
    {
      target: 'nav',
      title: 'This is your organization',
      body: 'Offers, capacity, and the students you serve — nothing from other providers. The menu on the left moves between them.',
    },
    {
      target: 'metric',
      title: 'Capacity drives what you are offered',
      body: 'How full you are is visible to the counselor making the assignment, so keeping it current means fewer offers you have to turn down.',
    },
    {
      target: 'action',
      title: 'Accept or decline, with a reason',
      body: 'A decline is not a failure. The reason you give rolls up statewide, and that is how transportation and capacity gaps become budget conversations.',
    },
  ],
};

export function storageKeyFor(role: Role): string {
  return `tb-coach-${role}`;
}
