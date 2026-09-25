/**
 * Definitions for the transition record layer: identity, funding, early warnings, and
 * documents. Same shape and voice as every other "explain this" panel.
 */
import type { DefinitionMap } from './types';

export const TRANSITION_DEFINITIONS: DefinitionMap = {
  transitionId: {
    term: 'Transition ID',
    definition:
      'How a student is identified everywhere in the platform instead of by name: a high school code, the state, and a student number — for example WH-VA-004661.',
    formula: 'School code (two letters) · VA · the six-digit student number, which is unique statewide.',
    whyItMatters:
      'People can coordinate a student’s services without names travelling across screens, lists, and downloads. Only the school and the student’s counselor can ask to see a name, and each time they do it is recorded.',
  },
  hoursRemaining: {
    term: 'Hours remaining',
    definition: 'Authorized hours that have not been used yet, added up across every open authorization.',
    formula: 'Hours authorized minus hours logged, per authorization, summed.',
    whyItMatters: 'This is what can still be delivered this year without a new authorization.',
  },
  authorizationNearLimit: {
    term: 'Near its authorized hours',
    definition: 'An authorization with 90% or more of its hours already used.',
    formula: 'Hours logged divided by hours authorized, at or above 0.9.',
    whyItMatters:
      'Seeing it at 90% gives the counselor time to extend it or plan the last sessions — before a provider is turned away mid-plan.',
  },
  authorizationOver: {
    term: 'Over authorization',
    definition:
      'An authorization with more hours logged than were authorized. New services against it are blocked until a counselor extends it, with a reason.',
    formula: 'Hours logged greater than hours authorized.',
    whyItMatters: 'This is the over-billing guard. The check happens when a service is logged, not months later.',
  },
  fundingAuthorized: {
    term: 'Authorized',
    definition: 'What funders have agreed to pay for this fiscal year, across every open authorization.',
    formula: 'Hours authorized times the rate for that service, summed. Rates in this demonstration are illustrative.',
    whyItMatters: 'It is the ceiling. Anything logged beyond it is either an extension or an over-billing risk.',
  },
  fundingUtilized: {
    term: 'Utilized',
    definition:
      'The cost of services actually delivered this fiscal year. For DARS Pre-ETS this equals reserve spend to date on the 15% reserve screen.',
    formula: 'The cost of every logged service, at the same illustrative unit costs the reserve screen uses.',
    whyItMatters: 'Utilized against authorized shows whether money set aside for students is actually reaching them.',
  },
  fundingRemaining: {
    term: 'Remaining',
    definition: 'Authorized minus utilized: money committed to students that has not been spent yet.',
    formula: 'Authorized minus utilized.',
    whyItMatters:
      'A large remaining balance late in the year means authorized services are not being delivered — a follow-up, not an accounting line.',
  },
  earlyWarning: {
    term: 'Early warning (14 / 30 / 90 days)',
    definition:
      'A referral that is stuck — waiting for a provider, waiting on a consent form, or waiting for its first service — is flagged at 14 days and escalated at 30 and 90.',
    formula:
      'Days since the wait began: submission for the first two, assignment for the third. Counts only waits that began within the last year.',
    whyItMatters: 'Nobody has to remember to check. The longer a student waits, the higher the question goes.',
  },
};
