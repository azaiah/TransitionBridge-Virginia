/**
 * The six WIOA §116 primary indicators of performance, in statutory order.
 *
 * These are terms even experienced agency staff routinely get slightly wrong — "employment
 * rate" without saying WHICH quarter after exit, or "credential attainment" without the
 * one-year window. Each definition below states the window explicitly.
 *
 * The demonstration dataset has no exit quarters, so two indicators use documented proxies.
 * Each proxy is named in the panel rather than hidden, because a compliance officer will
 * ask, and the honest answer is the one that earns the pilot.
 */
import type { DefinitionMap } from './types';

const WIOA_SOURCE = 'Joint WIOA Performance Accountability Guidance (RSA TAC-17-01)';
const WIOA_SOURCE_ID = 'B2-tac-17-01';

export const WIOA_DEFINITIONS: DefinitionMap = {
  employmentRateQ2: {
    term: 'Employment rate — 2nd quarter after exit',
    definition:
      'The share of people who are working in unsubsidized employment during the second full quarter after they leave the program. It is measured after exit, not while services are being delivered.',
    formula:
      'People employed in the second quarter after exit, divided by everyone who exited. In this demonstration the dataset has no exit quarters, so it is computed as competitive integrated employment outcomes divided by all recorded outcomes over a trailing four quarters.',
    citation: WIOA_SOURCE,
    citationId: WIOA_SOURCE_ID,
    whyItMatters:
      'This is the headline federal number for the program. It is the one indicator most likely to be quoted back to DARS in a hearing.',
  },

  employmentRateQ4: {
    term: 'Employment rate — 4th quarter after exit',
    definition:
      'The share of people still working in unsubsidized employment during the fourth full quarter after exit. Reading it next to the second-quarter rate shows whether jobs are lasting.',
    formula:
      'People employed in the fourth quarter after exit, divided by everyone who exited. In this demonstration it is computed as employment outcomes retained at 90 days divided by all recorded outcomes over a trailing four quarters.',
    citation: WIOA_SOURCE,
    citationId: WIOA_SOURCE_ID,
    whyItMatters:
      'A strong second-quarter rate with a weak fourth-quarter rate means placements are not sticking, which is a service-design problem rather than a placement problem.',
  },

  medianEarningsQ2: {
    term: 'Median earnings — 2nd quarter after exit',
    definition:
      'The midpoint of quarterly earnings for people who are employed in the second quarter after exit. Half earn more, half earn less. It is a median, not an average, so a few high earners cannot pull it up.',
    formula:
      'The middle value of quarterly earnings among employed exiters. In this demonstration, quarterly earnings are hourly wage multiplied by hours per week multiplied by thirteen weeks.',
    citation: WIOA_SOURCE,
    citationId: WIOA_SOURCE_ID,
    whyItMatters:
      'Employment counts alone can hide low-hour, low-wage placements. Earnings is the check on job quality.',
  },

  credentialAttainmentRate: {
    term: 'Credential attainment rate',
    definition:
      'The share of people who earn a recognized postsecondary credential, or a secondary school diploma or its equivalent, while enrolled or within one year of exit.',
    formula:
      'People who attained a credential, divided by everyone in the same measurement window. In this demonstration it is credential outcomes divided by all recorded outcomes over a trailing four quarters.',
    citation: WIOA_SOURCE,
    citationId: WIOA_SOURCE_ID,
    whyItMatters:
      'Credentials are the durable half of a transition outcome. They travel with the student after the case closes.',
  },

  measurableSkillGains: {
    term: 'Measurable skill gains',
    definition:
      'The share of people in an education or training program who show documented progress toward a credential or employment during the program year. It is progress made during services, not an outcome after exit.',
    formula:
      'People with documented progress, divided by people enrolled in qualifying education or training. In this demonstration it is completed referrals that received three or more distinct Pre-ETS activities, divided by all completed referrals.',
    citation: WIOA_SOURCE,
    citationId: WIOA_SOURCE_ID,
    whyItMatters:
      'This is the only indicator that moves within the program year, so it is the earliest signal that services are working.',
  },

  effectivenessServingEmployers: {
    term: 'Effectiveness in serving employers',
    definition:
      'A measure of how well the program serves employers as customers, not just job seekers. States choose from federally defined approaches; the repeat business customer approach counts employers who come back for more than one hire.',
    formula:
      'Employers who hired more than once, divided by all employers served. In this demonstration it uses synthetic employer names over a trailing four quarters.',
    citation: WIOA_SOURCE,
    citationId: WIOA_SOURCE_ID,
    whyItMatters:
      'Employers who return are the supply side of every future placement. Losing them is invisible until placements stall.',
  },
};
