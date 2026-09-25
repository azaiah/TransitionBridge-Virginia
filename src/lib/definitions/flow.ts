/**
 * Referral-flow metrics — the numbers on the statewide dashboard, the counselor queue,
 * and the school coordinator's tracker.
 *
 * The first two entries exist because "referrals received" and "individuals served" get
 * used interchangeably in conversation and mean very different things on a report.
 */
import type { DefinitionMap } from './types';

const PRE_ETS_SOURCE = 'DARS Pre-Employment Transition Services';
const PRE_ETS_SOURCE_ID = 'A1-dars-pre-ets';

export const FLOW_DEFINITIONS: DefinitionMap = {
  referralsReceived: {
    term: 'Referrals received',
    definition:
      'The count of referral submissions, not the count of people. One student referred twice in a year counts as two referrals.',
    formula: 'Every referral submitted in the period, counted once each.',
    whyItMatters:
      'This is demand. It is deliberately not the same as individuals served, and reporting one as the other overstates reach.',
  },

  individualsServed: {
    term: 'Individuals served',
    definition:
      'The count of distinct people who received at least one Pre-ETS activity. A student who received four activities counts once.',
    formula: 'Distinct students with one or more delivered services in the period.',
    citation: PRE_ETS_SOURCE,
    citationId: PRE_ETS_SOURCE_ID,
    whyItMatters:
      'This is reach. It is the number federal reporting is interested in, and it is always lower than referrals received.',
  },

  activeReferrals: {
    term: 'Active referrals',
    definition:
      'Referrals that are still open — submitted, under review, waiting for a provider, or in service. Completed and closed referrals are excluded.',
    formula: 'All referrals whose status is not completed and not closed without service.',
    whyItMatters:
      'This is the current workload. It is the denominator behind every "are we keeping up" question.',
  },

  fillRate: {
    term: 'Fill rate',
    definition:
      'The share of submitted referrals that reached a provider. It answers whether referrals are finding somebody to serve them.',
    formula: 'Referrals assigned to a provider, divided by referrals submitted.',
    whyItMatters:
      'A low fill rate is a capacity problem, not an effort problem. It points at the provider network rather than at staff.',
  },

  daysToAssignment: {
    term: 'Median days to assignment',
    definition:
      'The typical wait from when a referral is submitted to when a provider is assigned. It is a median, so a handful of very long waits cannot distort it.',
    formula: 'The middle value of the day counts between submission and assignment.',
    whyItMatters:
      'This is the wait a family actually experiences before anything visible happens.',
  },

  daysToFirstService: {
    term: 'Median days to first service',
    definition:
      'The typical wait from referral submission to the first Pre-ETS activity actually delivered. Assignment alone is not service.',
    formula: 'The middle value of the day counts between submission and the first delivered service.',
    whyItMatters:
      'A referral can be assigned quickly and still sit for weeks. This is the number that shows it.',
  },

  unassignedOver14Days: {
    term: 'Waiting more than 14 days',
    definition:
      'Referrals that are still without a provider more than two weeks after they were submitted.',
    formula: 'Open referrals with no provider assigned whose age is over fourteen days.',
    whyItMatters:
      'These are the students most likely to fall through the gap. The queue exists to drive this to zero.',
  },

  completionRate: {
    term: 'Completion rate',
    definition:
      'The share of assigned referrals that reached completion — the planned services were delivered and the case was closed as served.',
    formula:
      'Referrals completed, divided by referrals assigned to a provider. The district and division comparisons count every referral submitted in the last two years; a single quarter\'s referrals have not had time to finish.',
    whyItMatters:
      'Assignment is a promise. Completion is whether the promise was kept. Read the most recent quarter carefully: a referral submitted eight weeks ago has not had time to finish, so a young cohort shows a low rate by definition, not by failure.',
  },

  employmentOutcomeRate: {
    term: 'Employment outcome rate',
    definition:
      'The share of completed referrals that ended in competitive integrated employment — a real job, in the community, at the going wage.',
    formula:
      'Completed referrals with a competitive integrated employment outcome, divided by all completed referrals — over the last two years in the district and division comparisons. Shown only where at least 10 cases have completed — below that, a single placement would swing the rate by tens of points, so no rate is reported.',
    citation: PRE_ETS_SOURCE,
    citationId: PRE_ETS_SOURCE_ID,
    whyItMatters:
      'Pre-ETS is preparation, so not every student is expected to exit into work. Read this as a direction of travel, not a pass mark.',
  },

  zeroReferralDivisions: {
    term: 'Divisions with zero referrals',
    definition:
      'School divisions that submitted no Pre-ETS referrals at all during the quarter.',
    formula: 'Divisions whose referral count for the period is zero.',
    whyItMatters:
      'A division at zero is not visible in any average. It is the failure that only shows up when you look for it deliberately.',
  },

  transportationBarrier: {
    term: 'Transportation barrier',
    definition:
      'A referral flagged at submission because the student has no reliable way to reach services.',
    formula: 'Referrals with the transportation barrier flag set, as a share of all referrals.',
    whyItMatters:
      'Transportation is the most common practical reason a rural referral stalls, and it is fixable with the right provider match.',
  },
};
