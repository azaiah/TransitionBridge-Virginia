# 04 — Data Model

One source of truth. Everything in the product derives from these types. Put them in
`src/data/types.ts` and import from there — no duplicate shapes anywhere.

The model deliberately mirrors the statutory vocabulary (the five required Pre-ETS
activities, IEP/504 plan type, RSA-911 service records, WIOA §116 indicators). When a DARS
analyst looks at an export column name, it should be a name they already use.

---

## 1. Enumerations

```ts
/** The five required Pre-ETS activities. Names are statutory — do not paraphrase. */
export const PRE_ETS_ACTIVITIES = [
  'job_exploration_counseling',
  'work_based_learning',
  'postsecondary_counseling',
  'workplace_readiness_training',
  'self_advocacy_instruction',
] as const;
export type PreEtsActivity = typeof PRE_ETS_ACTIVITIES[number];

export const ACTIVITY_LABELS: Record<PreEtsActivity, string> = {
  job_exploration_counseling:   'Job exploration counseling',
  work_based_learning:          'Work-based learning experiences',
  postsecondary_counseling:     'Counseling on postsecondary enrollment opportunities',
  workplace_readiness_training: 'Workplace readiness training',
  self_advocacy_instruction:    'Instruction in self-advocacy',
};

/** Basis of Pre-ETS eligibility. Age 14+ AND one of these. */
export type PlanType = 'IEP' | 'SECTION_504' | 'DOCUMENTED_OTHER';

export type DiplomaTrack = 'STANDARD' | 'ADVANCED_STUDIES' | 'APPLIED_STUDIES' | 'UNDETERMINED';

export type ReferralStatus =
  | 'NEW'                 // submitted by school, not yet reviewed
  | 'UNDER_REVIEW'        // DARS counselor triaging
  | 'AWAITING_CONSENT'    // consent form / documentation outstanding
  | 'READY_TO_ASSIGN'     // eligible, consented, awaiting a provider
  | 'ASSIGNED'            // offered to and accepted by a vendor
  | 'IN_SERVICE'          // at least one activity delivered
  | 'COMPLETED'           // services concluded
  | 'CLOSED_NOT_SERVED';  // closed without service

export type DeclineReason =
  | 'NO_CAPACITY'
  | 'OUTSIDE_SERVICE_AREA'
  | 'CANNOT_DELIVER_ACTIVITY'
  | 'TRANSPORTATION_NOT_FEASIBLE'
  | 'SCHEDULING_CONFLICT'
  | 'OTHER';

export type Role = 'state_leadership' | 'dars_counselor' | 'school_coordinator' | 'vendor';

export type OutcomeType =
  | 'COMPETITIVE_INTEGRATED_EMPLOYMENT'
  | 'CREDENTIAL_ATTAINED'
  | 'POSTSECONDARY_ENROLLED'
  | 'CONTINUED_TO_VR'          // moved on to full VR services / IPE
  | 'NO_OUTCOME_RECORDED';
```

---

## 2. Geography & organizations

```ts
export interface Locality {
  fips: string;              // 5-digit county/independent-city FIPS
  name: string;              // "Portsmouth City"
  type: 'COUNTY' | 'CITY';
  darsDistrictId: string;
  isRural: boolean;          // drives the rural coverage-gap narrative
  centroid: [number, number];
}

export interface DarsDistrict {
  id: string;                // 'hampton-roads'
  name: string;              // 'Hampton Roads District'
  localityFips: string[];
  officeCount: number;
}

export interface SchoolDivision {
  id: string;                // 'portsmouth-city-public-schools'
  name: string;
  localityFips: string;
  darsDistrictId: string;
  highSchoolCount: number;
  /** Illustrative. Never present as VDOE-reported. */
  estimatedSwdEnrollment: number;
}

export interface School {
  id: string;
  name: string;
  divisionId: string;
  gradesServed: string;      // '9-12'
}

export interface Vendor {                 // DARS-approved Employment Service Organization
  id: string;
  name: string;                            // synthetic — never a real ESO's name
  headquartersFips: string;
  servedLocalityFips: string[];
  activitiesOffered: PreEtsActivity[];
  capacityTotal: number;
  capacityUsed: number;
  medianResponseHours: number;
  acceptanceRate: number;                  // 0–1
  completionRate: number;                  // 0–1
  employmentOutcomeRate: number;           // 0–1
  medianPlacementWage: number | null;      // placement QUALITY, per the CSNA finding
  retention90DayRate: number | null;
  activeSince: string;                     // ISO date
}
```

---

## 3. People

All synthetic. Names are generated; identifiers are prefixed `DEMO-` so no record can ever
be mistaken for a real one.

```ts
export interface Student {
  id: string;                  // 'DEMO-STU-000412'
  displayName: string;         // generated
  divisionId: string;
  schoolId: string;
  gradeLevel: 9 | 10 | 11 | 12;
  age: number;                 // 14+
  planType: PlanType;
  diplomaTrack: DiplomaTrack;
  disabilityDocumented: boolean;
  transportationBarrier: boolean;
  consentOnFile: boolean;
  consentDate: string | null;
  /** DE 96 analogue — first required-activity service date. Null until first service. */
  preEtsStartDate: string | null;
}

export interface Persona {          // who you are "viewing as" in the demo
  id: string;
  role: Role;
  displayName: string;
  title: string;                    // 'Transition Coordinator'
  scopeId: string;                  // divisionId | darsDistrictId | vendorId | 'STATEWIDE'
  blurb: string;
}
```

---

## 4. The referral — the core record

```ts
export interface Referral {
  id: string;                       // 'DEMO-REF-2026-004182'
  studentId: string;
  divisionId: string;
  schoolId: string;
  darsDistrictId: string;
  localityFips: string;

  submittedAt: string;
  submittedByPersonaId: string;

  requestedActivities: PreEtsActivity[];
  planType: PlanType;
  gradeLevel: number;
  diplomaTrack: DiplomaTrack;
  transportationBarrier: boolean;

  status: ReferralStatus;
  statusChangedAt: string;

  reviewedAt: string | null;
  reviewedByPersonaId: string | null;
  assignedVendorId: string | null;
  assignedAt: string | null;
  firstServiceAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  declineReason: DeclineReason | null;

  events: ReferralEvent[];          // the closed loop, made visible
}

export interface ReferralEvent {
  id: string;
  referralId: string;
  at: string;
  actorRole: Role;
  actorPersonaId: string;
  type:
    | 'SUBMITTED' | 'REVIEW_STARTED' | 'CONSENT_REQUESTED' | 'CONSENT_RECEIVED'
    | 'MARKED_READY' | 'OFFERED_TO_VENDOR' | 'VENDOR_ACCEPTED' | 'VENDOR_DECLINED'
    | 'SERVICE_LOGGED' | 'COMPLETED' | 'CLOSED' | 'NOTE_ADDED';
  note: string | null;
}
```

### Derived fields — compute, never store
```ts
ageDays(referral)              // now - submittedAt
daysToAssignment(referral)     // assignedAt - submittedAt
daysToFirstService(referral)   // firstServiceAt - submittedAt
isStale(referral)              // status in [NEW, UNDER_REVIEW, READY_TO_ASSIGN] && ageDays > 14
```
Each of these is a named, unit-tested pure function in `src/lib/metrics.ts`.

---

## 5. Service records — the RSA-911 shape

```ts
export interface ServiceRecord {
  id: string;
  referralId: string;
  studentId: string;
  vendorId: string | null;          // null = delivered in-house by DARS staff
  deliveredInHouse: boolean;        // the in-house vs vendor split is a real DARS question
  activity: PreEtsActivity;
  serviceDate: string;
  durationMinutes: number;
  setting: 'SCHOOL' | 'COMMUNITY' | 'WORKSITE' | 'VIRTUAL' | 'DARS_OFFICE';
  groupSession: boolean;
  notes: string | null;
}

export interface OutcomeRecord {
  id: string;
  studentId: string;
  referralId: string;
  type: OutcomeType;
  recordedAt: string;
  employerNameSynthetic: string | null;
  hourlyWage: number | null;
  hoursPerWeek: number | null;
  retained90Days: boolean | null;
  credentialName: string | null;
}
```

---

## 6. Aggregates — precomputed at build time

Never aggregate thousands of rows at render. The generator emits these.

```ts
export interface DivisionMetrics {
  divisionId: string;
  period: string;                    // '2026-Q2'
  referralsSubmitted: number;
  referralsAccepted: number;
  referralsAssigned: number;
  referralsInService: number;
  referralsCompleted: number;
  referralsClosedNotServed: number;
  medianDaysToAssignment: number | null;
  medianDaysToFirstService: number | null;
  planTypeMix: Record<PlanType, number>;
  diplomaTrackMix: Record<DiplomaTrack, number>;
  activityMix: Record<PreEtsActivity, number>;
  employmentOutcomeRate: number | null;
  zeroReferralQuarter: boolean;      // the invisible failure this product surfaces
}

export interface DistrictMetrics extends Omit<DivisionMetrics, 'divisionId'> {
  darsDistrictId: string;
  divisionCount: number;
  vendorCount: number;
  unassignedOver14Days: number;
  preEtsSpend: number;               // illustrative
}

export interface StateMetrics {
  period: string;
  totals: Omit<DistrictMetrics, 'darsDistrictId' | 'divisionCount' | 'vendorCount' | 'preEtsSpend'>;
  divisionsWithZeroReferrals: number;
  localitiesWithoutVendorCoverage: number;
  unassignedOver14Days: number;
  federalAwardIllustrative: number;
  reserveRequirement: number;        // 15% of award — the statutory floor
  reserveSpentToDate: number;
  reserveProjectedYearEnd: number;
  wioaIndicators: WioaIndicators;
}

/** WIOA §116 primary indicators — statutory order and naming. */
export interface WioaIndicators {
  employmentRateQ2: number;
  employmentRateQ4: number;
  medianEarningsQ2: number;
  credentialAttainmentRate: number;
  measurableSkillGains: number;
  effectivenessServingEmployers: number;
}

export interface CoverageCell {          // one locality, for the map
  fips: string;
  referralVolume: number;
  vendorCount: number;
  capacityHeadroom: number;
  gapScore: number;                      // demand vs capacity, normalized 0–100
  employmentOutcomeRate: number | null;
  isRural: boolean;
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARN' | 'RISK';
  scope: 'STATE' | 'DISTRICT' | 'DIVISION' | 'VENDOR';
  scopeId: string;
  message: string;                       // plain language, complete sentence
  createdAt: string;
  ownerPersonaId: string | null;         // nothing sits unowned
  linkTo: string;                        // route to the affected records
}
```

---

## 7. Provenance — how verified and illustrative stay separate

```ts
export type Provenance =
  | { kind: 'verified'; sourceId: string; note?: string }   // → 02_RESEARCH_AND_SOURCES.md
  | { kind: 'illustrative' };

export interface Figure {
  value: number;
  unit?: string;
  provenance: Provenance;
}
```

Any number rendered through the shared `<Stat>` component must carry a `Provenance`.
`verified` renders a source marker linking to the citation. `illustrative` inherits the
demonstration-data frame. There is no third option and no default — make the type require it.

---

## 8. Bundle shape

```ts
export interface DemoDataBundle {
  generatedAt: string;
  seed: number;                     // deterministic — same seed, same dataset, every build
  localities: Locality[];
  districts: DarsDistrict[];
  divisions: SchoolDivision[];
  schools: School[];
  vendors: Vendor[];
  personas: Persona[];
  students: Student[];
  referrals: Referral[];
  serviceRecords: ServiceRecord[];
  outcomes: OutcomeRecord[];
  divisionMetrics: DivisionMetrics[];
  districtMetrics: DistrictMetrics[];
  stateMetrics: StateMetrics[];     // several periods for trend lines
  coverage: CoverageCell[];
  alerts: Alert[];
}
```
