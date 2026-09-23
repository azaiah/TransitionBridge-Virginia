/** Citations from docs/02_RESEARCH_AND_SOURCES.md — grouped for /sources. Section F excluded (internal only). */

export type Citation = {
  id: string;
  label: string;
  url: string;
  note?: string;
};

export type CitationSection = {
  id: string;
  title: string;
  intro?: string;
  items: Citation[];
  /**
   * Kept in the codebase for internal strategy work, but never rendered on a public
   * surface. Naming competing products on a page we hand to DARS tells the agency
   * exactly who else to call, and it puts vendor names on a client-facing screen.
   */
  internalOnly?: boolean;
};

export const CITATION_SECTIONS: CitationSection[] = [
  {
    id: 'pre-ets',
    title: 'Pre-ETS — statutory foundation',
    items: [
      {
        id: 'A1-overview',
        label: 'An Overview of DARS Pre-ETS and Vocational Rehabilitation Transition Services (2024)',
        url: 'https://csa.virginia.gov/Content/doc/Overview_of_DARS_Pre-ETS_and_VR_Transition_Services_2024.pdf',
      },
      {
        id: 'A1-dars-pre-ets',
        label: 'DARS Pre-Employment Transition Services',
        url: 'https://dars.virginia.gov/employment-services/for-students/pre-employment-transition-services/',
      },
      {
        id: 'A1-ntact',
        label: 'NTACT:C — Pre-ETS',
        url: 'https://transitionta.org/topics/pre-ets/',
      },
      {
        id: 'A3-rsa-vr',
        label: 'RSA — State Vocational Rehabilitation Services Program',
        url: 'https://rsa.ed.gov/about/programs/vocational-rehabilitation-state-grants',
      },
      {
        id: 'A3-reserve',
        label: 'NTACT:C — Strategies for Managing the 15% Reservation of Funds',
        url: 'https://transitionta.org/trainings/reservation-funds-strategies-pre-ets-webinar/',
      },
    ],
  },
  {
    id: 'federal-reporting',
    title: 'Federal reporting — RSA-911 and WIOA §116',
    items: [
      {
        id: 'B1-rsa-911',
        label: 'RSA — Case Service Report (RSA-911)',
        url: 'https://rsa.ed.gov/performance/rsa-911-policy-directive',
      },
      {
        id: 'B1-pd-16-04',
        label: 'RSA-PD-16-04',
        url: 'https://rsa.ed.gov/sites/default/files/subregulatory/pd-16-04.pdf',
      },
      {
        id: 'B1-dcl-23-04',
        label: 'DCL 23-04 Implementation Checklist',
        url: 'https://rsa.ed.gov/sites/default/files/programs/vr/DCL%2023-04%20Implementation%20Checklist.pdf',
      },
      {
        id: 'B2-tac-17-01',
        label: 'Joint WIOA Performance Accountability Guidance (RSA TAC-17-01)',
        url: 'https://rsa.ed.gov/sites/default/files/subregulatory/TAC-17-01.pdf',
      },
      {
        id: 'B2-vrtac',
        label: 'VRTAC-QM — WIOA Performance Indicators',
        url: 'https://www.vrtac-qm.org/focus-areas/program-performance-qm/wioa-performance-accountability-system/wioa-performance-indicators',
      },
      {
        id: 'B2-dol',
        label: 'DOL — Performance Indicators',
        url: 'https://www.dol.gov/agencies/eta/performance/performance-indicators',
      },
    ],
  },
  {
    id: 'virginia',
    title: 'Virginia specifics',
    items: [
      {
        id: 'C1-drs-map',
        label: 'DRS District Map (PDF, effective 09/25/2021)',
        url: 'https://www.dars.virginia.gov/essp/downloads/Virginia_Map_DRS-color_9_27_21.pdf',
        note: 'Verify district structure is still current before any live presentation.',
      },
      {
        id: 'C2-essp',
        label: 'DARS Employment Service & Special Programs (ESSP)',
        url: 'https://www.dars.virginia.gov/essp/',
      },
      {
        id: 'C2-providers',
        label: 'DARS — Current & Potential Provider Documents',
        url: 'https://dars.virginia.gov/employment-services/for-providers/documents/',
      },
      {
        id: 'C3-csna',
        label: 'Virginia DARS 2025 Comprehensive Statewide Needs Assessment (PDF)',
        url: 'https://www.dars.virginia.gov/downloads/publications/2025%20Comprehensive%20Statewide%20Needs%20Assesment.pdf',
      },
      {
        id: 'C3-publications',
        label: 'DARS Publications',
        url: 'https://www.dars.virginia.gov/publications.htm',
      },
      {
        id: 'C4-divisions',
        label: 'VDOE — Virginia Public School Listing by Division',
        url: 'https://www.doe.virginia.gov/about-vdoe/virginia-school-directories/virginia-public-school-listing-by-division',
      },
      {
        id: 'C4-tci',
        label: 'The Commonwealth Institute — 132 school divisions',
        url: 'https://thecommonwealthinstitute.org/tci_research/key-school-funding-trends-in-virginia-statewide-and-in-all-132-school-divisions/',
      },
      {
        id: 'C4-child-count',
        label: 'VDOE — Special Education December 1 Child Count',
        url: 'https://www.doe.virginia.gov/programs-services/special-education/reports-plans-statistics/special-education-child-count',
      },
      {
        id: 'C6-applied',
        label: 'VDOE — Applied Studies Diploma',
        url: 'https://www.doe.virginia.gov/parents-students/for-students/graduation/diploma-options/applied-studies-diploma',
      },
      {
        id: 'C6-peatc',
        label: 'PEATC — The Applied Studies Diploma',
        url: 'https://peatc.org/wp-content/uploads/2020/12/Applied-Studies-Diploma-1.pdf',
      },
    ],
  },
  {
    id: 'landscape',
    title: 'Competitive landscape (internal strategy context)',
    intro: 'TransitionBridge is positioned as a visibility layer above existing systems of record — not a replacement.',
    internalOnly: true,
    items: [
      {
        id: 'D1-aware',
        label: 'Alliance Enterprises — Aware',
        url: 'https://www.allianceenterprises.com/products/aware/',
      },
      {
        id: 'D1-alliance',
        label: 'Alliance Enterprises',
        url: 'https://www.allianceenterprises.com/',
      },
      {
        id: 'D2-frontline',
        label: 'Frontline IEP Review: Features, Pros, Cons & Alternatives',
        url: 'https://www.fullmindlearning.com/blog/frontline-iep-review',
      },
      {
        id: 'D2-powerschool',
        label: 'PowerSchool Special Programs',
        url: 'https://www.powerschool.com/solutions/student-information/special-programs/',
      },
      {
        id: 'D3-unite',
        label: 'Unite Us — Closed-Loop Referrals',
        url: 'https://uniteus.com/products/closed-loop-referral-system/',
      },
      {
        id: 'D3-findhelp',
        label: 'Findhelp Platform',
        url: 'https://company.findhelp.com/products/platform/',
      },
    ],
  },
];

/** CSNA findings shown on the homepage "Sourced, not asserted" section. */
export const CSNA_FINDINGS = [
  {
    finding: 'Pre-ETS service gaps exist throughout the state, especially in rural areas.',
    sourceId: 'C3-csna',
  },
  {
    finding: 'Transportation is a persistent barrier to service delivery and employment retention.',
    sourceId: 'C3-csna',
  },
  {
    finding: 'The Pre-ETS fee schedule needs review to motivate providers to deliver services.',
    sourceId: 'C3-csna',
  },
  {
    finding: 'Documentation requirements are burdensome — providers said so directly.',
    sourceId: 'C3-csna',
  },
  {
    finding: 'Placement quality matters: wage and retention, not just placement count.',
    sourceId: 'C3-csna',
  },
];

/** The only list a client-facing surface may render. */
export const PUBLIC_CITATION_SECTIONS = CITATION_SECTIONS.filter((s) => !s.internalOnly);

export function getCitationById(id: string): Citation | undefined {
  for (const section of CITATION_SECTIONS) {
    const found = section.items.find((c) => c.id === id);
    if (found) return found;
  }
  return undefined;
}
