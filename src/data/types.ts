/**
 * The single source of truth for every domain shape in TransitionBridge.
 * Mirrors docs/04_DATA_MODEL.md. No duplicate shapes anywhere else in the codebase.
 *
 * The vocabulary here is deliberately statutory. When a DARS analyst reads an export
 * column name, it should be a name they already use.
 */

/* ==========================================================================
   1. Enumerations
   ========================================================================== */

/** The five required Pre-ETS activities. Names are statutory — do not paraphrase. */
export const PRE_ETS_ACTIVITIES = [
  'job_exploration_counseling',
  'work_based_learning',
  'postsecondary_counseling',
  'workplace_readiness_training',
  'self_advocacy_instruction',
] as const;
export type PreEtsActivity = (typeof PRE_ETS_ACTIVITIES)[number];

export const ACTIVITY_LABELS: Record<PreEtsActivity, string> = {
  job_exploration_counseling: 'Job exploration counseling',
  work_based_learning: 'Work-based learning experiences',
  postsecondary_counseling: 'Counseling on postsecondary enrollment opportunities',
  workplace_readiness_training: 'Workplace readiness training',
  self_advocacy_instruction: 'Instruction in self-advocacy',
};

/** Shorter forms for axis labels and dense table headers. Still recognisable. */
export const ACTIVITY_SHORT_LABELS: Record<PreEtsActivity, string> = {
  job_exploration_counseling: 'Job exploration',
  work_based_learning: 'Work-based learning',
  postsecondary_counseling: 'Postsecondary counseling',
  workplace_readiness_training: 'Workplace readiness',
  self_advocacy_instruction: 'Self-advocacy',
};

/** Basis of Pre-ETS eligibility. Age 14+ AND one of these. */
export type PlanType = 'IEP' | 'SECTION_504' | 'DOCUMENTED_OTHER';

export const PLAN_TYPES: readonly PlanType[] = ['IEP', 'SECTION_504', 'DOCUMENTED_OTHER'] as const;

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  IEP: 'IEP',
  SECTION_504: 'Section 504 plan',
  DOCUMENTED_OTHER: 'Documented disability, other',
};

export type DiplomaTrack = 'STANDARD' | 'ADVANCED_STUDIES' | 'APPLIED_STUDIES' | 'UNDETERMINED';

export const DIPLOMA_TRACKS: readonly DiplomaTrack[] = [
  'STANDARD',
  'ADVANCED_STUDIES',
  'APPLIED_STUDIES',
  'UNDETERMINED',
] as const;

export const DIPLOMA_TRACK_LABELS: Record<DiplomaTrack, string> = {
  STANDARD: 'Standard Diploma',
  ADVANCED_STUDIES: 'Advanced Studies Diploma',
  APPLIED_STUDIES: 'Applied Studies Diploma',
  UNDETERMINED: 'Not yet determined',
};

export type ReferralStatus =
  | 'NEW' // submitted by school, not yet reviewed
  | 'UNDER_REVIEW' // DARS counselor triaging
  | 'AWAITING_CONSENT' // consent form / documentation outstanding
  | 'READY_TO_ASSIGN' // eligible, consented, awaiting a provider
  | 'ASSIGNED' // offered to and accepted by a vendor
  | 'IN_SERVICE' // at least one activity delivered
  | 'COMPLETED' // services concluded
  | 'CLOSED_NOT_SERVED'; // closed without service

export const REFERRAL_STATUSES: readonly ReferralStatus[] = [
  'NEW',
  'UNDER_REVIEW',
  'AWAITING_CONSENT',
  'READY_TO_ASSIGN',
  'ASSIGNED',
  'IN_SERVICE',
  'COMPLETED',
  'CLOSED_NOT_SERVED',
] as const;

/** Plain-English labels. docs/11_USABILITY.md test 2. */
export const STATUS_LABELS: Record<ReferralStatus, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under review',
  AWAITING_CONSENT: 'Awaiting consent',
  READY_TO_ASSIGN: 'Ready to assign',
  ASSIGNED: 'Assigned',
  IN_SERVICE: 'In service',
  COMPLETED: 'Completed',
  CLOSED_NOT_SERVED: 'Closed — not served',
};

export type DeclineReason =
  | 'NO_CAPACITY'
  | 'OUTSIDE_SERVICE_AREA'
  | 'CANNOT_DELIVER_ACTIVITY'
  | 'TRANSPORTATION_NOT_FEASIBLE'
  | 'SCHEDULING_CONFLICT'
  | 'OTHER';

export const DECLINE_REASONS: readonly DeclineReason[] = [
  'NO_CAPACITY',
  'OUTSIDE_SERVICE_AREA',
  'CANNOT_DELIVER_ACTIVITY',
  'TRANSPORTATION_NOT_FEASIBLE',
  'SCHEDULING_CONFLICT',
  'OTHER',
] as const;

export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  NO_CAPACITY: 'No capacity right now',
  OUTSIDE_SERVICE_AREA: 'Outside our service area',
  CANNOT_DELIVER_ACTIVITY: 'We cannot deliver a requested activity',
  TRANSPORTATION_NOT_FEASIBLE: 'Transportation is not feasible',
  SCHEDULING_CONFLICT: 'Scheduling conflict',
  OTHER: 'Another reason',
};

export type Role = 'state_leadership' | 'dars_counselor' | 'school_coordinator' | 'vendor';

export const ROLES: readonly Role[] = [
  'state_leadership',
  'dars_counselor',
  'school_coordinator',
  'vendor',
] as const;

export type OutcomeType =
  | 'COMPETITIVE_INTEGRATED_EMPLOYMENT'
  | 'CREDENTIAL_ATTAINED'
  | 'POSTSECONDARY_ENROLLED'
  | 'CONTINUED_TO_VR' // moved on to full VR services / IPE
  | 'NO_OUTCOME_RECORDED';

export const OUTCOME_TYPES: readonly OutcomeType[] = [
  'COMPETITIVE_INTEGRATED_EMPLOYMENT',
  'CREDENTIAL_ATTAINED',
  'POSTSECONDARY_ENROLLED',
  'CONTINUED_TO_VR',
  'NO_OUTCOME_RECORDED',
] as const;

export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  COMPETITIVE_INTEGRATED_EMPLOYMENT: 'Working in a competitive, integrated job',
  CREDENTIAL_ATTAINED: 'Earned a credential',
  POSTSECONDARY_ENROLLED: 'Enrolled in education after high school',
  CONTINUED_TO_VR: 'Moved on to full VR services',
  NO_OUTCOME_RECORDED: 'No outcome recorded yet',
};

export type ServiceSetting = 'SCHOOL' | 'COMMUNITY' | 'WORKSITE' | 'VIRTUAL' | 'DARS_OFFICE';

export const SERVICE_SETTINGS: readonly ServiceSetting[] = [
  'SCHOOL',
  'COMMUNITY',
  'WORKSITE',
  'VIRTUAL',
  'DARS_OFFICE',
] as const;

export const SETTING_LABELS: Record<ServiceSetting, string> = {
  SCHOOL: 'At school',
  COMMUNITY: 'In the community',
  WORKSITE: 'At a worksite',
  VIRTUAL: 'Virtual',
  DARS_OFFICE: 'At a DARS office',
};

/* ==========================================================================
   2. Geography & organizations
   ========================================================================== */

export interface Locality {
  fips: string; // 5-digit county/independent-city FIPS
  name: string; // "Portsmouth City"
  type: 'COUNTY' | 'CITY';
  darsDistrictId: string;
  isRural: boolean; // drives the rural coverage-gap narrative
  centroid: [number, number];
}

export interface DarsDistrict {
  id: string; // 'hampton-roads'
  name: string; // 'Hampton Roads District'
  localityFips: string[];
  officeCount: number;
}

export interface SchoolDivision {
  id: string; // 'portsmouth-city-public-schools'
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
  gradesServed: string; // '9-12'
}

/** DARS-approved Employment Service Organization. Names are synthetic. */
export interface Vendor {
  id: string;
  name: string; // synthetic — never a real ESO's name
  headquartersFips: string;
  servedLocalityFips: string[];
  activitiesOffered: PreEtsActivity[];
  capacityTotal: number;
  capacityUsed: number;
  medianResponseHours: number;
  acceptanceRate: number; // 0–1
  completionRate: number; // 0–1
  employmentOutcomeRate: number; // 0–1
  medianPlacementWage: number | null; // placement QUALITY, per the CSNA finding
  retention90DayRate: number | null;
  activeSince: string; // ISO date
}

/* ==========================================================================
   3. People — all synthetic, all prefixed DEMO-
   ========================================================================== */

export interface Student {
  id: string; // 'DEMO-STU-000412'
  displayName: string; // generated
  divisionId: string;
  schoolId: string;
  gradeLevel: 9 | 10 | 11 | 12;
  age: number; // 14+
  planType: PlanType;
  diplomaTrack: DiplomaTrack;
  disabilityDocumented: boolean;
  transportationBarrier: boolean;
  consentOnFile: boolean;
  consentDate: string | null;
  /** DE 96 analogue — first required-activity service date. Null until first service. */
  preEtsStartDate: string | null;
}

/** Who you are "viewing as" in the demonstration. */
export interface Persona {
  id: string;
  role: Role;
  displayName: string;
  title: string; // 'Transition Coordinator'
  scopeId: string; // divisionId | darsDistrictId | vendorId | 'STATEWIDE'
  blurb: string;
}

/* ==========================================================================
   4. The referral — the core record
   ========================================================================== */

export interface Referral {
  id: string; // 'DEMO-REF-2026-004182'
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
  /**
   * Every provider this referral was offered to, in order. The last entry is the provider
   * who accepted; any earlier entries declined. Without this the decline reasons could not
   * be attributed to a provider, and "acceptance rate" on the vendor scorecard would be
   * an authored number rather than a computed one.
   */
  offeredVendorIds: string[];
  assignedVendorId: string | null;
  assignedAt: string | null;
  firstServiceAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  declineReason: DeclineReason | null;

  events: ReferralEvent[]; // the closed loop, made visible
}

export type ReferralEventType =
  | 'SUBMITTED'
  | 'REVIEW_STARTED'
  | 'CONSENT_REQUESTED'
  | 'CONSENT_RECEIVED'
  | 'MARKED_READY'
  | 'OFFERED_TO_VENDOR'
  | 'VENDOR_ACCEPTED'
  | 'VENDOR_DECLINED'
  | 'SERVICE_LOGGED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'NOTE_ADDED';

/** What each timeline step is called on screen. Never show the raw event name. */
export const REFERRAL_EVENT_LABELS: Record<ReferralEventType, string> = {
  SUBMITTED: 'Referral submitted',
  REVIEW_STARTED: 'Counselor started review',
  CONSENT_REQUESTED: 'Consent requested from the family',
  CONSENT_RECEIVED: 'Signed consent received',
  MARKED_READY: 'Marked ready to assign',
  OFFERED_TO_VENDOR: 'Offered to a provider',
  VENDOR_ACCEPTED: 'Provider accepted',
  VENDOR_DECLINED: 'Provider declined',
  SERVICE_LOGGED: 'Service delivered',
  COMPLETED: 'Services completed',
  CLOSED: 'Closed without service',
  NOTE_ADDED: 'Note added',
};

export interface ReferralEvent {
  id: string;
  referralId: string;
  at: string;
  actorRole: Role;
  actorPersonaId: string;
  type: ReferralEventType;
  note: string | null;
}

/* ==========================================================================
   5. Service records — the RSA-911 shape
   ========================================================================== */

export interface ServiceRecord {
  id: string;
  referralId: string;
  studentId: string;
  vendorId: string | null; // null = delivered in-house by DARS staff
  deliveredInHouse: boolean; // the in-house vs vendor split is a real DARS question
  activity: PreEtsActivity;
  serviceDate: string;
  durationMinutes: number;
  setting: ServiceSetting;
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

/* ==========================================================================
   6. Aggregates — precomputed at build time, never at render
   ========================================================================== */

export interface DivisionMetrics {
  divisionId: string;
  period: string; // '2026-Q2'
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
  zeroReferralQuarter: boolean; // the invisible failure this product surfaces
  /**
   * The six WIOA §116 indicators scoped to this division, so /state/outcomes can break
   * the statewide number down without aggregating records in a render.
   */
  wioaIndicators: WioaIndicators;
}

export interface DistrictMetrics extends Omit<DivisionMetrics, 'divisionId'> {
  darsDistrictId: string;
  divisionCount: number;
  vendorCount: number;
  unassignedOver14Days: number;
  preEtsSpend: number; // illustrative
}

export interface StateMetrics {
  period: string;
  // The statewide WIOA indicators live on `wioaIndicators` below, not inside `totals`,
  // because rates are not additive and must not look like a roll-up of district rows.
  totals: Omit<
    DistrictMetrics,
    'darsDistrictId' | 'divisionCount' | 'vendorCount' | 'preEtsSpend' | 'wioaIndicators'
  >;
  divisionsWithZeroReferrals: number;
  localitiesWithoutVendorCoverage: number;
  unassignedOver14Days: number;
  federalAwardIllustrative: number;
  reserveRequirement: number; // 15% of award — the statutory floor
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

/** One locality, for the map. */
export interface CoverageCell {
  fips: string;
  referralVolume: number;
  vendorCount: number;
  capacityHeadroom: number;
  gapScore: number; // demand vs capacity, normalized 0–100
  employmentOutcomeRate: number | null;
  isRural: boolean;
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARN' | 'RISK';
  scope: 'STATE' | 'DISTRICT' | 'DIVISION' | 'VENDOR';
  scopeId: string;
  message: string; // plain language, complete sentence
  createdAt: string;
  ownerPersonaId: string | null; // nothing sits unowned
  linkTo: string; // route to the affected records
}

/* ==========================================================================
   7. Provenance — how verified and illustrative stay separate
   ========================================================================== */

export type Provenance =
  | { kind: 'verified'; sourceId: string; note?: string } // → docs/02_RESEARCH_AND_SOURCES.md
  | { kind: 'illustrative' };

export interface Figure {
  value: number;
  unit?: string;
  provenance: Provenance;
}

/* ==========================================================================
   8. Bundle shape
   ========================================================================== */

/**
 * Storage form of a referral. The event timeline is DERIVED from the timestamps below
 * rather than stored, because materialising ~69,000 event objects would add roughly 18 MB
 * to the shipped payload for information already present in the record.
 * `withTimeline()` in src/lib/timeline.ts turns this back into a full `Referral`.
 */
export type StoredReferral = Omit<Referral, 'events'>;

/** Real geography. Small, loaded everywhere. */
export interface GeographyBundle {
  localities: Locality[];
  districts: DarsDistrict[];
  divisions: SchoolDivision[];
  schools: School[];
}

/** Providers and the "viewing as" identities. Small. */
export interface DirectoryBundle {
  vendors: Vendor[];
  personas: Persona[];
}

/**
 * Storage form of a service record. `id` is the row index and `notes` is always empty in
 * the demonstration dataset, so both are rebuilt on load instead of being shipped.
 */
export type StoredServiceRecord = Omit<ServiceRecord, 'id' | 'notes'>;

/** Record-level data. Large — only record-level routes should load this. */
export interface RecordsBundle {
  students: Student[];
  referrals: StoredReferral[];
  serviceRecords: ServiceRecord[];
  outcomes: OutcomeRecord[];
}

/** Everything precomputed at build time, so no view aggregates at render. */
export interface AggregatesBundle {
  generatedAt: string;
  seed: number;
  periods: string[];
  currentPeriod: string;
  /** The fixed "now" the whole dataset is measured against. */
  referenceDate: string;
  divisionMetrics: DivisionMetrics[];
  districtMetrics: DistrictMetrics[];
  stateMetrics: StateMetrics[]; // several periods for trend lines
  coverage: CoverageCell[];
  alerts: Alert[];
  headlines: StateHeadline[];
  vendorScorecards: VendorScorecard[];
  reserveRows: ReserveRow[];
  /** Everything the three operational dashboards draw, so they load no record files. */
  homeSnapshots: HomeSnapshots;
}

export interface DemoDataBundle
  extends GeographyBundle,
    DirectoryBundle,
    RecordsBundle,
    AggregatesBundle {}

/* ==========================================================================
   9. Derived, presentation-facing shapes
   These are computed by the generator so no view aggregates at render time.
   ========================================================================== */

/** One stage of the referral funnel. docs/01_PRODUCT_SPEC.md §3.3 */
export interface FunnelStage {
  key: 'submitted' | 'accepted' | 'assigned' | 'started' | 'completed' | 'employed';
  label: string;
  count: number;
  /** Share of the previous stage, 0–1. Null for the first stage. */
  shareOfPrevious: number | null;
  /** Median days a record spends in this stage before moving on. */
  medianDaysInStage: number | null;
  /** Route that lists the records currently sitting in this stage. */
  linkTo: string;
}

/** A single point on a KPI sparkline. */
export interface TrendPoint {
  period: string;
  value: number;
}

/** Precomputed, ready-to-render statewide headline numbers. */
export interface StateHeadline {
  period: string;
  activeReferrals: number;
  activeReferralsTrend: TrendPoint[];
  unassignedOver14Days: number;
  unassignedOver14DaysTrend: TrendPoint[];
  medianDaysToFirstService: number;
  medianDaysToFirstServiceTrend: TrendPoint[];
  divisionsWithZeroReferrals: number;
  divisionsWithZeroReferralsTrend: TrendPoint[];
  localitiesWithoutVendorCoverage: number;
  localitiesWithoutVendorCoverageTrend: TrendPoint[];
  reserveUtilizedPct: number;
  reserveUtilizedPctTrend: TrendPoint[];
  funnel: FunnelStage[];
  activityMix: Record<PreEtsActivity, number>;
  declineReasonMix: Record<DeclineReason, number>;
  planTypeMix: Record<PlanType, number>;
  /** Cross-tab: days to first service, split by transportation-barrier flag. */
  transportBarrierDaysToService: { withBarrier: number; withoutBarrier: number };
  /** Outcome rate by diploma track — the policy-relevant differential. */
  outcomeRateByDiplomaTrack: Record<DiplomaTrack, number | null>;
  inHouseVsVendorServices: { inHouse: number; vendor: number };
}

/**
 * Precomputed home screens, one row per persona. These exist so the first screen of a
 * demonstration renders from a small aggregate file rather than scanning every referral
 * in the browser (CLAUDE.md §3.3).
 */
export interface HomeSnapshots {
  counselors: CounselorHome[];
  coordinators: CoordinatorHome[];
  providers: ProviderHome[];
}

/** DARS counselor dashboard: the caseload waiting on this counselor. */
export interface CounselorHome {
  personaId: string;
  awaitingTriage: number;
  unassignedOver14Days: number;
  activeStudents: number;
}

/** School coordinator dashboard: this coordinator's referrals and the two work lists. */
export interface CoordinatorHome {
  personaId: string;
  activeReferrals: number;
  awaitingConsent: number;
  stuckOver14Days: number;
  /** Only the rows the "Action required" panel shows. */
  consentAlerts: { referralId: string; studentName: string }[];
  eligibleNotReferredCount: number;
  /** Only the rows the "Eligible, not referred" panel shows. */
  eligibleNotReferred: {
    studentId: string;
    displayName: string;
    age: number;
    planType: PlanType;
  }[];
}

/** Provider dashboard: offers waiting on this provider and students in service. */
export interface ProviderHome {
  personaId: string;
  openOffers: number;
  activeStudents: number;
}

/** A vendor scorecard row, precomputed with its peer medians. */
export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  darsDistrictId: string;
  offersReceived: number;
  offersAccepted: number;
  acceptanceRate: number;
  medianResponseHours: number;
  studentsServed: number;
  servicesLogged: number;
  completionRate: number;
  employmentOutcomeRate: number;
  medianPlacementWage: number | null;
  retention90DayRate: number | null;
  capacityUsedPct: number;
  activityMix: Record<PreEtsActivity, number>;
}

/** Pre-ETS reserve spend, one row per district per period. Illustrative. */
export interface ReserveRow {
  period: string;
  darsDistrictId: string;
  spend: number;
  spendByActivity: Record<PreEtsActivity, number>;
}
