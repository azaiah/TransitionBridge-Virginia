/**
 * Provider network and coverage metrics — the vendor workspace, the coverage map, and the
 * statewide network view.
 */
import type { DefinitionMap } from './types';

const ACTIVITIES_SOURCE = 'NTACT:C — Pre-ETS';
const ACTIVITIES_SOURCE_ID = 'A1-ntact';

export const NETWORK_DEFINITIONS: DefinitionMap = {
  requiredActivities: {
    term: 'The five required Pre-ETS activities',
    definition:
      'Job exploration counseling; work-based learning experiences; counseling on postsecondary opportunities; workplace readiness training; and instruction in self-advocacy. Every Pre-ETS service logged is one of these five.',
    citation: ACTIVITIES_SOURCE,
    citationId: ACTIVITIES_SOURCE_ID,
    whyItMatters:
      'The mix across the five is the clearest picture of what students are actually getting, and where a category is being quietly skipped.',
  },

  workBasedLearningShare: {
    term: 'Work-based learning share',
    definition:
      'Work-based learning experiences as a share of all Pre-ETS services delivered. It is the hardest of the five activities to arrange, so it is usually the scarcest.',
    formula: 'Work-based learning services divided by all services delivered.',
    citation: ACTIVITIES_SOURCE,
    citationId: ACTIVITIES_SOURCE_ID,
    whyItMatters:
      'It is also the activity most closely tied to employment outcomes, so a low share is an early warning about next year.',
  },

  localitiesWithoutCoverage: {
    term: 'Localities without provider coverage',
    definition:
      'Counties and independent cities where no approved Pre-ETS provider currently serves students.',
    formula: 'Localities with zero approved providers listing them in their service area.',
    whyItMatters:
      'A student in one of these localities can be referred correctly and still have nobody to send them to.',
  },

  coverageGap: {
    term: 'Coverage gap score',
    definition:
      'A 0 to 100 score comparing demand against available provider capacity in a locality. Zero means capacity comfortably exceeds demand; one hundred means there is demand and no capacity at all.',
    formula:
      'One minus capacity divided by demand, expressed as a percentage and held between 0 and 100.',
    whyItMatters:
      'It ranks where a single new provider contract would relieve the most pressure.',
  },

  capacityUsed: {
    term: 'Capacity used',
    definition:
      'The share of a provider\u2019s stated caseload capacity that is currently committed to active students.',
    formula: 'Active assigned students divided by the capacity the provider has stated.',
    whyItMatters:
      'A provider above 85% will start declining referrals soon. Seeing it early is the difference between a plan and a scramble.',
  },

  acceptanceRate: {
    term: 'Acceptance rate',
    definition:
      'The share of referrals offered to a provider that the provider accepted.',
    formula: 'Referrals accepted, divided by referrals offered.',
    whyItMatters:
      'A falling acceptance rate usually means capacity or service-area mismatch, and it is the first thing to check before adding volume.',
  },

  retention90Day: {
    term: '90-day job retention',
    definition:
      'The share of people placed in employment who were still in that job ninety days later.',
    formula: 'Placements retained at ninety days, divided by all placements with a retention check.',
    whyItMatters:
      'Placements that do not last cost the student more than no placement at all.',
  },

  planType: {
    term: 'Plan type — IEP, 504, or other',
    definition:
      'How the student is served at school. An IEP is a special education plan; a 504 plan provides accommodations without special education services. Students may be eligible for Pre-ETS under either.',
    citation: 'An Overview of DARS Pre-ETS and VR Transition Services (2024)',
    citationId: 'A1-overview',
    whyItMatters:
      'Students on 504 plans are eligible and are routinely under-referred, so this mix shows whether outreach is reaching them.',
  },

  consentStatus: {
    term: 'Consent status',
    definition:
      'Whether the parent or guardian consent needed before services begin has been requested and received.',
    whyItMatters:
      'A referral cannot move without consent. Consent that was never chased is the most common avoidable delay.',
  },
};
