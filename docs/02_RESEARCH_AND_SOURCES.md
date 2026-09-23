# 02 — Research & Sources

Every factual claim the product makes must trace to this file. Anything not in here is
**illustrative** and must be rendered inside the `DEMONSTRATION DATA` frame.

Research conducted August 2026. Re-verify anything time-sensitive before a live presentation.

---

## A. Pre-ETS — statutory foundation

### A1. The five required Pre-ETS activities *(VERIFIED)*
1. Job exploration counseling
2. Work-based learning experiences
3. Counseling on opportunities for enrolling in post-secondary education
4. Workplace readiness training
5. Instruction in self-advocacy

These five are the organizing spine of the entire product. Every service log, every
completion metric, every vendor scorecard is structured around them.

> Source: [An Overview of DARS Pre-ETS and Vocational Rehabilitation Transition Services (2024)](https://csa.virginia.gov/Content/doc/Overview_of_DARS_Pre-ETS_and_VR_Transition_Services_2024.pdf) · [DARS Pre-Employment Transition Services](https://dars.virginia.gov/employment-services/for-students/pre-employment-transition-services/) · [NTACT:C — Pre-ETS](https://transitionta.org/topics/pre-ets/)

### A2. Who is eligible *(VERIFIED)*
A student may receive Pre-ETS if they are **at least 14** *and* one of:
- receiving special education services with an **IEP**, or
- have a **Section 504 plan**, or
- have a disability not served by other means from the school, with documentation.

Critically: **a student does not have to be a DARS client to receive Pre-ETS.** Referral can
come from the school, a parent, or another service provider, and requires a signed Pre-ETS
Information Release and Consent form plus documentation of disability.

*Product implication:* this directly validates Michelle's "IEP vs. 504 imbalance" finding.
The referral record must carry a `planType` of `IEP | 504 | DOCUMENTED_OTHER`, and the
platform must be able to show the IEP/504 mix by division — a view that does not currently
exist anywhere and that speaks straight to a DARS policy priority.

> Source: [Overview of DARS Pre-ETS and VR Transition Services (2024)](https://csa.virginia.gov/Content/doc/Overview_of_DARS_Pre-ETS_and_VR_Transition_Services_2024.pdf)

### A3. The 15% federal reserve *(VERIFIED)*
Each state must reserve and use **at least 15%** of its federal VR State Grant award to
provide or arrange for Pre-ETS.

*Product implication:* this is the single most powerful financial argument in the demo.
Reserved funds that are not spent are funds at risk. A live view of Pre-ETS spend against
the reserve — by district, by vendor, by month, with a projection — turns TransitionBridge
from "a nice dashboard" into "the tool that protects the reserve." Build this. It is the
slide that makes a CFO lean forward.

> Source: [RSA — State Vocational Rehabilitation Services Program](https://rsa.ed.gov/about/programs/vocational-rehabilitation-state-grants) · [NTACT:C — Strategies for Managing the 15% Reservation of Funds](https://transitionta.org/trainings/reservation-funds-strategies-pre-ets-webinar/)

---

## B. Federal reporting — the compliance hook

### B1. RSA-911 Case Service Report *(VERIFIED)*
The RSA-911 is mandated by the Rehabilitation Act as amended by WIOA Title IV. VR agencies
report each service purchased or directly provided, per student, and must maintain
documentation at the individual student level.

Key elements for our purposes:
- An individual is reportable if **Date of Application (DE 7)** is not blank **or**
  **Start Date of Pre-Employment Transition Services (DE 96)** is not blank.
- Agencies should report only students with disabilities who received **one of the five
  required Pre-ETS activities**.
- DCL 23-04 changed RSA-911 data elements effective **July 1, 2024**.

*Product implication:* the service log must capture, at minimum, student identifier, the
specific required activity, provider, and service date — the shape of an RSA-911-compatible
export. Build the export. Label it "RSA-911 aligned export" (aligned, not certified — do not
overclaim).

> Source: [RSA — Case Service Report (RSA-911)](https://rsa.ed.gov/performance/rsa-911-policy-directive) · [RSA-PD-16-04](https://rsa.ed.gov/sites/default/files/subregulatory/pd-16-04.pdf) · [DCL 23-04 Implementation Checklist](https://rsa.ed.gov/sites/default/files/programs/vr/DCL%2023-04%20Implementation%20Checklist.pdf)

### B2. WIOA §116 primary indicators of performance *(VERIFIED)*
The VR program is one of six WIOA core programs and is measured on:
1. Employment rate — 2nd quarter after exit
2. Employment rate — 4th quarter after exit
3. Median earnings — 2nd quarter after exit
4. Credential attainment rate
5. Measurable skill gains
6. Effectiveness in serving employers

*Product implication:* the outcomes dashboard is organized around **exactly these six**, in
this order, with these names. Do not invent metric names. Using the agency's own statutory
vocabulary is what signals that we understand their world.

> Source: [Joint WIOA Performance Accountability Guidance (RSA TAC-17-01)](https://rsa.ed.gov/sites/default/files/subregulatory/TAC-17-01.pdf) · [VRTAC-QM — WIOA Performance Indicators](https://www.vrtac-qm.org/focus-areas/program-performance-qm/wioa-performance-accountability-system/wioa-performance-indicators) · [DOL — Performance Indicators](https://www.dol.gov/agencies/eta/performance/performance-indicators)

---

## C. Virginia specifics

### C1. DARS structure *(VERIFIED, with a currency caveat)*
The Division of Rehabilitative Services (DRS) operates roughly **36 field offices** across
Virginia, plus the Wilson Workforce and Rehabilitation Center.

The published DRS district map (**effective 09/25/2021** — verify before presenting) shows
six districts:

| District | District Director (as of that map) |
|---|---|
| Northern | Tracy Harrington |
| New River | Michele Wells-Escobar |
| Southwest | Cindy Matney |
| Capital | Sherrina Sewell |
| Hampton Roads | Kimberly Shepard |
| Skyline | John Jackson |

> ⚠️ **Do not display these individuals' names in the product.** Use district names only.
> Personnel change; naming real staff next to synthetic caseload numbers is a serious error.

> Source: [DRS District Map (PDF)](https://www.dars.virginia.gov/essp/downloads/Virginia_Map_DRS-color_9_27_21.pdf) · [Overview of DARS Pre-ETS and VR Transition Services (2024)](https://csa.virginia.gov/Content/doc/Overview_of_DARS_Pre-ETS_and_VR_Transition_Services_2024.pdf)

### C2. Vendors — Employment Service Organizations *(VERIFIED)*
Approximately **85 community rehabilitation programs** across Virginia are DARS-approved to
provide employment-related services. Pre-ETS may be delivered by DARS staff, approved ESOs,
or other DARS-approved providers. DARS maintains a searchable **ESO Directory** and
publishes an annual **ESO Scorecard** (editions exist for SFY 2018, 2019, 2021, 2022, 2023,
2024, 2025). Becoming a provider requires attending a quarterly New Provider Workshop before
submitting a vendor application.

*Product implication — important.* DARS **already publishes** a vendor scorecard. That means
(a) they believe in vendor performance measurement, so we are pushing on an open door, and
(b) a static annual PDF is the incumbent we are displacing. Our pitch is not "you should
measure vendors," it is **"you already measure vendors once a year in a PDF; here it is
live, by district, with capacity."** That is a far stronger and more respectful argument.

> Source: [DARS Employment Service & Special Programs (ESSP)](https://www.dars.virginia.gov/essp/) · [DARS — Current & Potential Provider Documents](https://dars.virginia.gov/employment-services/for-providers/documents/)

### C3. 2025 Comprehensive Statewide Needs Assessment *(VERIFIED — the strongest evidence we have)*
Conducted with the State Rehabilitation Council through a contract with the Interwork
Institute at San Diego State University, using PY2021–2023 data and qualitative data through
January 2025. Findings relevant to us:

- **Pre-ETS service gaps exist throughout the state, especially in rural areas.**
- **Transportation is a persistent barrier**, both for service delivery and for sustaining
  employment once obtained; public transit is nonexistent in much of rural Virginia. The
  assessment recommends DARS pay provider transportation costs for rural Pre-ETS delivery.
- **The Pre-ETS fee schedule needs review** to motivate providers to deliver services.
- **Documentation requirements are burdensome** — providers said so directly, and the
  assessment recommends DARS streamline them.
- ESO placement quality is a recurring concern: placements skew to low-paying entry-level
  positions, producing high turnover and low retention, and jobs are sometimes chosen for
  availability rather than fit with the consumer's IPE.

*Product implication:* these five findings map one-to-one onto five product features —
the coverage-gap map, a transportation-barrier flag on the referral record, a fee/spend
view, a streamlined single-entry service log, and a placement-quality dimension on the
vendor scorecard (wage and retention, not just placement count). **Structure the demo
around the agency's own assessment findings.** This is the highest-leverage insight in this
document.

> Source: [Virginia DARS 2025 Comprehensive Statewide Needs Assessment (PDF)](https://www.dars.virginia.gov/downloads/publications/2025%20Comprehensive%20Statewide%20Needs%20Assesment.pdf) · [DARS Publications](https://www.dars.virginia.gov/publications.htm)

### C4. Scale of the ecosystem *(VERIFIED)*
- **132 school divisions** in Virginia (the School Quality Profiles system lists 133 reporting entities).
- Approximately **185,000 students with disabilities** served in Virginia K-12 (2024–25).
- VDOE collects a **December 1 Child Count** annually; the 2025-26 window ran Dec 1–12, 2025.

> Source: [VDOE — Virginia Public School Listing by Division](https://www.doe.virginia.gov/about-vdoe/virginia-school-directories/virginia-public-school-listing-by-division) · [The Commonwealth Institute — 132 school divisions](https://thecommonwealthinstitute.org/tci_research/key-school-funding-trends-in-virginia-statewide-and-in-all-132-school-divisions/) · [VDOE — Special Education December 1 Child Count](https://www.doe.virginia.gov/programs-services/special-education/reports-plans-statistics/special-education-child-count)

### C5. Pre-ETS volume *(UNVERIFIED — DO NOT PRESENT AS FACT)*
A figure of **16,006 "in-house" Pre-ETS services** and approximately **412 students served
via DARS vendors** appears in search summaries attributed to Virginia's PY2024–2027 WIOA
state plan. The primary document could not be opened directly during this research.

> ⚠️ **Do not put this number in the product or say it in a meeting until someone has read
> it in the primary source.** If it is accurate, the in-house-to-vendor ratio is a striking
> talking point. If it is wrong, saying it in front of DARS leadership costs us credibility
> that we cannot buy back. Verify at [Virginia PY2024-2027 VR State Plan](https://wioaplans.ed.gov/node/496896) and the [Virginia Combined State Plan PYs 24-27](https://townhall.virginia.gov/L/GetFile.cfm?File=C%3A%2FTownHall%2Fdocroot%2FGuidanceDocs_Proposed%2F262%2FGDoc_DARS_7774_20240912.pdf).

### C6. Diploma pathway *(PARTIALLY VERIFIED)*
Virginia's **Applied Studies Diploma** is available to students with disabilities who
complete their IEP requirements but do not meet the requirements for a named diploma.
Students pursuing college generally need a Standard or Advanced Studies Diploma, and
Applied Studies students may not qualify for financial aid.

Michelle's report that DARS is shifting emphasis toward Standard Diploma students, 11th/12th
graders, and expanded eligibility is **stakeholder-sourced and not independently verified in
public documents.** Treat it as directional intelligence that shapes what we build — the
referral record carries `diplomaTrack` and `gradeLevel` so the platform can answer that
question — but do not state DARS policy direction as established fact in the demo.

> Source: [VDOE — Applied Studies Diploma](https://www.doe.virginia.gov/parents-students/for-students/graduation/diploma-options/applied-studies-diploma) · [PEATC — The Applied Studies Diploma](https://peatc.org/wp-content/uploads/2020/12/Applied-Studies-Diploma-1.pdf)

---

## D. Competitive landscape

### D1. Aware (Alliance Enterprises) — the incumbent *(VERIFIED)*
A commercial off-the-shelf VR case management application, serving the VR community since
1995. Reported: **37 state agencies, 24 tribal nations, 12,000+ rehabilitation service
providers.** Together, Alliance and Libera software manage caseloads for roughly
**two-thirds of the nation's ~80 VR agencies.** Aware supports the three primary federal
case types (VR, Independent Living, Older Blind) plus custom state-funded case types.

**Strengths:** deeply entrenched, federally-aligned, complete case lifecycle, financial
management, decades of domain knowledge.

**Weaknesses we exploit:** it is a **caseworker-centric system of record**, not a
**multi-stakeholder visibility layer**. Schools and vendors are outside it. It answers "what
happened on this case," not "which of my 132 divisions sent zero referrals this quarter, and
which counties have no vendor within 40 miles." Its reporting is retrospective and
report-driven rather than live and operational.

> Source: [Alliance Enterprises — Aware](https://www.allianceenterprises.com/products/aware/) · [Alliance Enterprises](https://www.allianceenterprises.com/) · [Alliance & Libera consolidation announcement](https://www.prweb.com/releases/alliance_enterprises_and_libera_seek_to_consolidate_software_platforms_and_professional_services_for_vocational_rehabilitation_vr_agencies/prweb13831829.htm)

> **Strategic rule:** never position against Aware as a replacement. Position as the layer
> above it, and offer to ingest from it. "We complement your system of record" is a sentence
> that keeps us in the room.

### D2. K-12 special education platforms *(VERIFIED)*
Frontline IEP, PowerSchool Special Programs (formerly TIENET), SEAS, and similar tools own
the IEP document lifecycle inside school divisions.

Documented user complaints about Frontline IEP include restrictions on document content and
formatting, difficulty with tables, difficulty replacing documents, limited document search,
slow load times, save errors, and frequent bugs.

**Weakness we exploit:** these are **compliance-document systems bounded by one division**.
They do not cross the boundary to DARS, they do not see vendors, and they have no statewide
view. They validate the pain (documentation burden, duplicate entry) that our field research
found, but they cannot solve the coordination problem because coordination is out of scope
for them by design.

> Source: [Frontline IEP Review: Features, Pros, Cons & Alternatives](https://www.fullmindlearning.com/blog/frontline-iep-review) · [PowerSchool Special Programs](https://www.powerschool.com/solutions/student-information/special-programs/) · [Frontline Special Programs Management](https://www.frontlineeducation.com/special-programs/special-ed-software/)

### D3. Closed-loop referral networks *(VERIFIED)*
Unite Us and Findhelp operate closed-loop referral infrastructure across health and social
care; Unite Us reports networks spanning 3,000+ counties in 42 states.

**What we borrow:** the closed-loop concept is exactly right and is proven at scale. A
referral is not "sent," it is **accepted, served, and closed with an outcome**. Adopt their
status vocabulary and the discipline of never letting a referral sit in an unowned state.

**Weakness we exploit:** they are health/social-care generalists. They know nothing about the
five required Pre-ETS activities, RSA-911, WIOA §116, the 15% reserve, IEP/504 status, or
school transition timelines. Domain depth is our entire advantage over a horizontal platform.

> Source: [Unite Us — Closed-Loop Referrals](https://uniteus.com/products/closed-loop-referral-system/) · [Findhelp Platform](https://company.findhelp.com/products/platform/)

### D4. The gap, stated plainly
Nothing on the market combines: **(a)** multi-stakeholder visibility across schools, VR
counselors, vendors, and state leadership, **(b)** native Pre-ETS domain structure (the five
activities, IEP/504, diploma track, grade level), and **(c)** federal reporting alignment
(RSA-911 shape, WIOA §116 indicators, 15% reserve tracking), **(d)** in real time.

That intersection is TransitionBridge. It is a genuinely open lane.

---

## E. Design reference

Per the design direction request, the visual system is anchored on **refero.design**:

- **Primary style reference — Harvest** (`styles.refero.design/style/1eee9aa2-1e23-4675-9f6e-fb98c93969bd`):
  "Golden hour workbench — warm cream canvas, white floating cards, and one vivid orange
  flame." Chosen because it is an almost exact match for the existing IEP Partners brand
  (orange primary on warm off-white) executed at world-class quality, and because a warm
  cream canvas is instantly distinguishable from every gray government dashboard in the room.
- **Density reference — ClickUp** (`styles.refero.design/style/efcb73cb-b84a-4ae7-9a2b-e1116f79f130`):
  "Hardworking dashboard on white marble." Chosen for its compact operational density,
  4px base unit, pill status badges, and flat-hairline elevation — the discipline our data
  tables need, which Harvest's comfortable marketing density would not supply.
- **Dashboard principles** — [Refero: Dashboard UI Best Practices](https://refero.design/p/dashboard-ui-best-practices/) and [Refero: Dashboard Design Prompts for AI](https://styles.refero.design/ai-agents/dashboard-design-prompts).

The synthesis is specified in `03_DESIGN_SYSTEM.md`.

---

## F. Stakeholder context (internal only — never rendered in the product)

From Michelle Pettaway's stakeholder engagement, for internal strategy only:

- **Secretary Marvin B. Figueroa** (Health & Human Resources) reportedly advised: *"Identify
  the problem and the gap, network the appropriate agencies, and present a pilot at the state
  or federal level."* This is our roadmap — the demo IS the pilot presentation.
- **DBHDS** leadership reported dashboard data running **6–8 months behind**, adequate for
  historical reporting but not for operational decisions. This is the second market, not the
  first. Win DARS, then extend.
- **DARS** leadership and frontline counselors both reported: no centralized statewide
  real-time view, fragmented referral tracking, disconnected systems, heavy manual entry,
  and inability to evaluate statewide trends.
- Field research with Portsmouth Public Schools transition staff found coordinators losing
  substantial time to IEP documentation, compliance letters, 5-day notices, repetitive entry,
  and outside-agency coordination rather than direct student contact.

> These are unverified stakeholder accounts. They are excellent product direction and
> excellent context for a conversation. They are **not** citable facts and must not appear
> as statistics in the product.
