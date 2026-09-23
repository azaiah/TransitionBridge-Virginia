/**
 * Funding and compliance terms — the 15% Pre-ETS reserve and the federal reporting file.
 *
 * The award figure in this demonstration is illustrative. Every panel below says so, so a
 * CFO reading the screen never has to guess which numbers are real.
 */
import type { DefinitionMap } from './types';

const RESERVE_SOURCE = 'NTACT:C — Strategies for Managing the 15% Reservation of Funds';
const RESERVE_SOURCE_ID = 'A3-reserve';

export const FUNDING_DEFINITIONS: DefinitionMap = {
  federalAward: {
    term: 'Federal VR award',
    definition:
      'The federal State Vocational Rehabilitation Services grant for the fiscal year. The 15% Pre-ETS reserve is calculated from it.',
    formula:
      'Set by the federal allotment formula. The figure shown here is illustrative and is not a published Virginia award amount.',
    citation: 'RSA — State Vocational Rehabilitation Services Program',
    citationId: 'A3-rsa-vr',
    whyItMatters:
      'Every reserve figure on this screen is a percentage of this number, so it frames the whole page.',
  },

  reserveRequirement: {
    term: '15% Pre-ETS reserve requirement',
    definition:
      'Federal law requires each state vocational rehabilitation agency to reserve at least 15% of its federal award for pre-employment transition services for students with disabilities. It is a floor, not a target.',
    formula: 'Fifteen percent of the federal award for the fiscal year.',
    citation: RESERVE_SOURCE,
    citationId: RESERVE_SOURCE_ID,
    whyItMatters:
      'Money reserved but not spent on Pre-ETS does not roll forward into more services. Underspending is the quiet failure mode.',
  },

  reserveSpentToDate: {
    term: 'Reserve spend to date',
    definition:
      'Pre-ETS spending recorded so far in the current federal fiscal year, which runs October 1 through September 30.',
    formula:
      'The sum of the cost of every Pre-ETS service delivered since October 1. Costs in this demonstration are synthetic.',
    citation: RESERVE_SOURCE,
    citationId: RESERVE_SOURCE_ID,
    whyItMatters:
      'Spend to date is the only number that tells you, mid-year, whether the reserve will be met.',
  },

  reserveProjected: {
    term: 'Projected year-end spend',
    definition:
      'What the year would end at if spending continued at the current pace for the rest of the fiscal year. It is a straight line, not a forecast — it makes no assumption about seasonality.',
    formula:
      'Spend to date divided by the share of the fiscal year that has elapsed. Compared against the reserve requirement to flag a shortfall.',
    citation: RESERVE_SOURCE,
    citationId: RESERVE_SOURCE_ID,
    whyItMatters:
      'A shortfall found in the third quarter can still be corrected. The same shortfall found in September cannot.',
  },

  reserveShortfall: {
    term: 'Projected shortfall',
    definition:
      'The gap between the projected year-end spend and the 15% reserve requirement. A shortfall means the reserve is on track to be underspent.',
    formula: 'Reserve requirement minus projected year-end spend, when that difference is positive.',
    citation: RESERVE_SOURCE,
    citationId: RESERVE_SOURCE_ID,
    whyItMatters:
      'This is the number that turns a compliance risk into a work plan: how much service has to be delivered, and by when.',
  },

  rsa911Export: {
    term: 'RSA-911 aligned export',
    definition:
      'A service-record file shaped to match the fields of the federal RSA-911 case service report. Aligned means the columns line up with the federal file — it is not a certified or validated submission.',
    formula:
      'One row per Pre-ETS service delivered, carrying the record identifier, plan type, activity, service start date, provider, and service date.',
    citation: 'RSA — Case Service Report (RSA-911)',
    citationId: 'B1-rsa-911',
    whyItMatters:
      'Reporting staff currently rebuild this by hand from several systems. Producing it directly from service records is where the hours come back.',
  },
};
