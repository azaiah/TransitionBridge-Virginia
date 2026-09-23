/**
 * The guided tour — the eight beats of docs/08_DEMO_SCRIPT.md, in order.
 *
 * This is a presenter aid, not marketing copy. Each beat says where to be, what the room
 * should be looking at, and the one sentence that lands. Timings match the script so the
 * twelve minutes stay twelve minutes.
 */

export interface TourBeat {
  /** 1-8, shown to the presenter. */
  number: number;
  title: string;
  href: string;
  /** Roughly how long this beat should take, in seconds. */
  seconds: number;
  /** The point of the beat, in the presenter's own words. */
  say: string;
  /** What to do on screen while saying it. */
  show: string;
}

export const TOUR_BEATS: TourBeat[] = [
  {
    number: 1,
    title: 'The four questions',
    href: '/',
    seconds: 90,
    say: 'Four questions. Which divisions sent no referrals last quarter? How many referrals are unassigned right now, and for how long? Which counties have no provider coverage? Of the students who finished, how many are employed?',
    show: 'Stay on the four question cards. Do not scroll past them. Pause and let the room agree.',
  },
  {
    number: 2,
    title: 'This is your own assessment',
    href: '/sources/',
    seconds: 60,
    say: 'We did not invent this problem. Your own 2025 statewide needs assessment found the service gaps, the transportation barrier, and the documentation burden. We built to those findings.',
    show: 'Show the sources page for two seconds. Do not read it. Its existence is the point.',
  },
  {
    number: 3,
    title: 'The command view',
    href: '/state/',
    seconds: 120,
    say: 'This is the Commonwealth, live. Referrals unassigned more than fourteen days — and here they are, oldest first. Divisions that submitted nothing this quarter — there they are by name.',
    show: 'Let the page land before speaking. Walk the top row left to right, then click the two tiles.',
  },
  {
    number: 4,
    title: 'The map',
    href: '/state/map/',
    seconds: 90,
    say: 'Referral demand, then provider coverage, then the difference between them — that is the service gap. And every map and chart here has a full accessible equivalent, from the first line of code.',
    show: 'Start on referral volume, switch to service gap, hover a rural locality, then toggle the table view.',
  },
  {
    number: 5,
    title: 'The closed loop, from four chairs',
    href: '/school/refer/',
    seconds: 150,
    say: 'A coordinator refers a student in ninety seconds. It arrives in the counselor queue. The vendor accepts or declines with a reason. And the coordinator can see exactly what happened — which has never been possible.',
    show: 'Switch roles in order: school coordinator, DARS counselor, vendor, back to school coordinator. Stay on one referral throughout.',
  },
  {
    number: 6,
    title: 'The insight they cannot get anywhere else',
    href: '/state/',
    seconds: 60,
    say: 'Work-based learning — the most resource-intensive activity and the one most predictive of employment — is eight percent statewide. Right now that number is not visible to anyone in the Commonwealth.',
    show: 'Scroll to the activity mix. Pause after the number. Do not prescribe a fix.',
  },
  {
    number: 7,
    title: 'Federal reporting and the 15% reserve',
    href: '/state/reserve/',
    seconds: 90,
    say: 'The six WIOA primary indicators by their statutory names, an export shaped to RSA-911, and spend against the fifteen percent reserve with a projection to year end. This is the view that tells you in March instead of September.',
    show: 'Outcomes first, then the reserve page. For a CFO, this is the beat that pays for the pilot.',
  },
  {
    number: 8,
    title: 'Close',
    href: '/',
    seconds: 90,
    say: 'Everything here is running now, and all of the data is synthetic — which is why we could bring it into this room without a data agreement. What we would like is a pilot: one district, one semester.',
    show: 'Make the ask, then stop talking and let them respond.',
  },
];
