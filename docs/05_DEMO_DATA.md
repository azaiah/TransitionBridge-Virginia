# 05 — Demo Data

The dataset is the demo. If the numbers are not believable, the product is not believable.
A DARS analyst will spot an implausible distribution in about four seconds.

---

## 1. Principles

1. **Deterministic.** One seeded pseudo-random generator. Same seed → byte-identical dataset
   on every build and every machine. No `Math.random()` anywhere.
2. **Plausible, not flattering.** The data must show real problems: stalled referrals,
   divisions sending nothing, rural counties with no coverage, work-based learning under-
   delivered. **A dataset where everything is fine has nothing to demonstrate.** The whole
   pitch is "here is what you cannot currently see" — so there must be something worth seeing.
3. **Internally consistent.** Every aggregate must recompute exactly from the underlying
   records. If someone adds the district numbers and they don't equal the state number, we
   are finished. Add a test that asserts this.
4. **Obviously synthetic on inspection.** All IDs prefixed `DEMO-`. Vendor names are
   invented. Student names are generated from a neutral name pool. No real ESO's name, no
   real student, no real staff member appears anywhere.
5. **Real geography, synthetic activity.** Localities, FIPS codes, districts, and division
   names are real public reference data — that's what makes the map credible. Everything
   that *happens* on that geography is generated.

---

## 2. Scale targets

| Entity | Count | Notes |
|---|---|---|
| Localities | 133 | All VA counties + independent cities |
| DARS districts | 6 | Northern, New River, Southwest, Capital, Hampton Roads, Skyline |
| School divisions | 132 | Real names |
| High schools | ~330 | Generated, distributed by division size |
| Vendors (ESOs) | 85 | Matches the ~85 approved community rehabilitation programs |
| Students | ~9,600 | Synthetic. ~9,200 with a referral, plus ~470 known to their school but not yet referred (the school's compliance and "eligible, not referred" lists) |
| Referrals | ~11,500 | Across 8 quarters |
| Service records | ~46,000 | ~4 per served student |
| Outcome records | ~2,100 | |
| Periods | 8 quarters | 2024-Q3 through 2026-Q2 |
| Funding authorizations | ~11,600 | Seven funders; every student with a provider has one |
| Employers / postings | 96 / 156 | 16 employers per DARS district |
| Access-log history | 290 entries | June 2026; obeys the same access rules as the live screens |

Large enough that virtualization and precomputation genuinely matter; small enough to bundle.

---

## 3. Distributions to generate

### 3.1 Referral volume by division
Log-normal, correlated with division size. Large divisions (Fairfax, Virginia Beach, Prince
William, Loudoun, Chesterfield) produce the most; small rural divisions produce very few.

**Then deliberately create the finding:** force **9–12 divisions to zero referrals** in the
current quarter, weighted toward small and rural divisions. This is KPI tile #4 and one of
the four questions on the landing page. It must be real in the data, drillable, and listable.

### 3.2 Plan type mix
Statewide roughly **72% IEP · 22% Section 504 · 6% documented other**, with meaningful
variance by division (some at 90% IEP, a handful above 40% 504). This reproduces the
IEP/504 imbalance finding and makes the by-division view genuinely interesting rather than
uniform noise.

### 3.3 Grade level
Skew toward 11th and 12th grade (~55% combined) with real 9th/10th presence — consistent
with the reported policy emphasis on upperclassmen, while leaving the earlier grades visible
so the "start earlier" conversation is available.

### 3.4 Diploma track
Roughly **48% Standard · 8% Advanced Studies · 34% Applied Studies · 10% Undetermined**,
varying by division. Enables the diploma-track outcome comparison.

### 3.5 Status pipeline
Target current-state distribution across open referrals:

| Status | Share |
|---|---|
| NEW | 8% |
| UNDER_REVIEW | 7% |
| AWAITING_CONSENT | 9% |
| READY_TO_ASSIGN | 11% |
| ASSIGNED | 14% |
| IN_SERVICE | 26% |
| COMPLETED | 20% |
| CLOSED_NOT_SERVED | 5% |

**Force 90–140 referrals into the "unassigned > 14 days" bucket**, concentrated in Southwest
and New River (the rural districts). This is KPI tile #2 — the accountability number. It has
to be there, and it has to be defensible when someone clicks it.

### 3.6 Timing
- Referral → review: median 3 days, long right tail.
- Review → assignment: median 9 days; **median 21+ days in rural districts.** The urban/rural
  gap must be visible in the data, because it is the CSNA's own finding.
- Assignment → first service: median 12 days.
- The funnel drop-off between ASSIGNED and IN_SERVICE should be around 10–14% — realistic,
  and the most interesting number on the funnel chart.

### 3.7 Activity mix
Deliberately uneven, per the operational reality:

| Activity | Share of services |
|---|---|
| Workplace readiness training | 31% |
| Job exploration counseling | 28% |
| Instruction in self-advocacy | 19% |
| Counseling on postsecondary enrollment | 14% |
| **Work-based learning experiences** | **8%** |

Work-based learning is the most resource-intensive and the most outcome-predictive activity.
Showing it at 8% statewide, with wide district variation, is one of the strongest insights
in the entire demo — and it is exactly the kind of finding that is invisible when the data
lives in spreadsheets.

### 3.8 Vendor coverage
- Urban corridors (Northern Virginia, Hampton Roads, Richmond) well covered — 6–14 vendors.
- **Force 8–12 rural localities to zero vendor coverage**, and another 15 to a single vendor
  at >85% capacity. This produces the red zones on the map and matches the CSNA's documented
  rural Pre-ETS gap.
- Vendor capacity utilization: mean ~68%, but with a real tail above 95% in underserved areas.

### 3.9 Decline reasons
Where vendors declined: `NO_CAPACITY` 34% · `OUTSIDE_SERVICE_AREA` 27% ·
`TRANSPORTATION_NOT_FEASIBLE` 18% · `CANNOT_DELIVER_ACTIVITY` 12% · `SCHEDULING_CONFLICT` 6% ·
`OTHER` 3%.

Transportation at 18% is deliberate — it makes the CSNA's transportation finding measurable
rather than anecdotal, and it is a genuinely useful thing to be able to show a Secretary.

### 3.10 Outcomes
Of students completing services: **~34% competitive integrated employment**, ~11% credential
attained, ~18% postsecondary enrolled, ~22% continued to full VR services, ~15% no outcome
recorded. Applied Studies track outcomes measurably lower than Standard — a real, visible,
policy-relevant differential.

Placement wages: median around $13.80/hr with a right tail — reflecting the CSNA's concern
about low-paying entry-level placements. 90-day retention around 61%, varying by vendor.
Placement *quality* has to be visible, not just placement count.

### 3.11 Transportation barrier flag
~23% of referrals statewide, ~41% in rural localities. Cross-tabbing this against
days-to-first-service produces a clean, defensible correlation that a Commissioner will
immediately understand.

---

## 4. Generator

`scripts/generate-demo-data.ts`, run at build time, writes typed JSON into `src/data/`.

```
scripts/generate-demo-data.ts
  ├─ seed.ts            deterministic PRNG (mulberry32 or similar)
  ├─ geography.ts       real localities, FIPS, districts, divisions
  ├─ names.ts           neutral synthetic name pools
  ├─ vendors.ts         85 invented ESOs with coverage + capacity
  ├─ students.ts
  ├─ referrals.ts       pipeline simulation + event timelines
  ├─ services.ts
  ├─ outcomes.ts
  ├─ aggregate.ts       ALL metrics computed from records — never hand-written
  ├─ coverage.ts        map cells + gap scores
  ├─ alerts.ts          rules evaluated against real records
  ├─ school-rosters.ts  students known to a school, not yet referred
  ├─ funding.ts         authorizations by funder, tied to the 15% reserve
  ├─ employers.ts       employer partners and job postings
  └─ audit-history.ts   a month of access-log activity, consistent with access rules
```

**Aggregates are computed, never authored.** Every KPI tile, chart, and table reads from
`aggregate.ts` output. Hand-written summary numbers are how a demo gets caught contradicting
itself on stage.

### Alert rules
Alerts must be generated by rules that evaluate the actual records, so every alert is
clickable and lands on records that really are in that state:

```
unassignedOver14Days(district) > 10   → RISK   "N referrals in {district} have been unassigned for over 14 days."
zeroReferralDivisions(quarter) > 0    → WARN   "N divisions submitted no Pre-ETS referrals in {quarter}."
localitiesWithoutCoverage() > 0       → RISK   "N localities have no approved Pre-ETS vendor."
activityShare('work_based_learning') < 0.15 → WARN "Work-based learning experiences represent {x}% of services delivered statewide."
vendorCapacity(v) > 0.95              → WARN   "{vendor} is at {x}% of stated capacity."
reserveProjected < reserveRequired    → RISK   "Projected Pre-ETS spend is tracking below the reserve requirement."
transportBarrierDelay() > 7           → INFO   "Referrals flagged with a transportation barrier take {n} days longer to reach first service."
```

---

## 5. Validation — do not skip this

A test suite that runs on every build and **fails the build** if:

1. `sum(districtMetrics) !== stateMetrics` for every additive measure, every period.
2. `sum(divisionMetrics by district) !== districtMetrics` for every additive measure.
3. Every `Referral.status` is consistent with its event timeline (no `COMPLETED` without a
   `SERVICE_LOGGED`; no `ASSIGNED` without `VENDOR_ACCEPTED`).
4. Every `ServiceRecord.serviceDate` falls after its referral's `assignedAt`.
5. Every `Student.age >= 14` and every student has a valid `planType`.
6. Every alert's `linkTo` route resolves and the target contains ≥1 matching record.
7. No student, vendor, or persona name matches any entry in a blocklist of real Virginia
   ESO names and real DARS staff names.
8. Every ID begins with `DEMO-`.
9. Regenerating with the same seed produces an identical bundle hash.

Rule 1 is the one that saves the presentation. Someone will add up the districts.
