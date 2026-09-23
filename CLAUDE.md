# CLAUDE.md — Standing rules for this repository

You are building **TransitionBridge**, a statewide Pre-ETS referral-intelligence and
service-delivery platform, presented as a product of **IEP Partners, LLC** and built by
**DataIsData**. The immediate goal is a demonstration environment good enough to win a
pilot with the Virginia Department for Aging and Rehabilitative Services (DARS).

Read `docs/00_START_HERE.md` before doing anything. Then follow `docs/06_BUILD_PROMPTS.md`
in order.

---

## 1. Non-negotiable rules

### 1.1 Never expose the tech stack to anyone outside DataIsData
No client-facing surface — no page copy, no footer, no "Built with", no PDF export, no
README shown in a meeting — may name any tool, framework, host, database, or vendor we use.
Public-facing language is always **"enterprise cloud infrastructure"** and **"secure,
FedRAMP-path hosting."** Describe *what it does and what it's worth*, never *how it's made*.
This protects DataIsData's pricing and positioning. It is not optional.

### 1.2 No real people's data. Ever.
This demo contains **only synthetic data**. No real student names, no real referral records,
no real DARS case data. Every person in the dataset is generated. Every screen that shows a
student record must carry a visible `DEMONSTRATION DATA` marker (see §3.4). This is what
makes the demo safe to present without a FERPA or data-sharing agreement, and it is a
selling point — say so on screen.

### 1.3 Real named public officials appear only as public-record context
Do not fabricate quotes, decisions, caseloads, or performance data attributed to any real
named person (Donna Bonessi, Stephanie Carter, Daryl Washington, Marvin Figueroa, etc.).
Real names appear only in the stakeholder-context section of internal docs, never inside
the product UI attached to synthetic records.

### 1.4 Distinguish verified facts from illustrative figures
Every number that appears in the product is one of two kinds:

- **Verified** — traceable to a citation in `docs/02_RESEARCH_AND_SOURCES.md`. Render with a
  small superscript source marker that opens the citation.
- **Illustrative** — synthetic. Render inside the `DEMONSTRATION DATA` frame.

Never blur the two. If DARS leadership catches one invented statistic presented as fact, the
pilot is dead. This rule is the difference between a credible demo and a liability.

### 1.5 Accessibility is a hard requirement, not a nice-to-have
This is a product for a **disability services agency**. An inaccessible demo is a
self-disqualifying demo. WCAG 2.1 AA minimum, verified, on every screen:
- All interactive elements keyboard reachable with a visible focus ring
- Every chart has an equivalent accessible data table (a real `<table>`, toggled, not hidden)
- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI boundaries
- Never encode meaning in color alone — always pair with a label, icon, or pattern
- Proper landmarks, heading order, `aria-live` on async regions, respected `prefers-reduced-motion`
- Real `<label>`s on every input; no placeholder-as-label
Add a visible **Accessibility** page describing conformance. Agencies notice this.

### 1.6 Built for people who are not technical
The users are transition coordinators between IEP meetings, VR counselors carrying caseloads,
vendor staff who log services on paper, and Commissioners who will look for ninety seconds.
None of them will be trained. None will read documentation. `docs/11_USABILITY.md` is a hard
requirement, not advice — every screen must pass its five tests. Plain language, one obvious
next action, no dead ends, nothing destructive without undo.

The bar: *could a transition coordinator with eleven minutes between meetings, who has never
seen this and will not read anything, do the one thing this screen exists for on her first
try, without asking anyone?* If no, the screen isn't done — regardless of how good it looks.

### 1.7 The demo must never fail live
No backend, no database, no auth server, no network calls at runtime. All data is bundled
at build time and served statically. Every interaction is client-side. There is no
scenario in which a network hiccup breaks a presentation to a Commissioner.

---

## 2. Product framing

**One sentence:** *Virginia has all the Pre-ETS data it needs and no way to see it;
TransitionBridge is the layer that makes it visible in real time.*

The problem is **fragmentation, not effort**. Never imply that DARS, schools, or vendors
are doing a bad job. The narrative is: dedicated people are working inside disconnected
systems, and the cost of that fragmentation is students who fall through the gap between a
referral and a service. Respectful, specific, never condescending.

**The four roles** (see `docs/01_PRODUCT_SPEC.md` for full detail):

| Role | Primary job on the platform |
|---|---|
| `state_leadership` | Monitor statewide demand, coverage, and outcomes; find gaps |
| `dars_counselor` | Triage the referral queue; assign vendors; log services; close cases |
| `school_coordinator` | Submit referrals; track their status; manage consent; see outcomes |
| `vendor` | Accept/decline referrals; manage capacity; log the five Pre-ETS activities |

---

## 3. Engineering conventions

### 3.1 Architecture
- Single application, static output, no server runtime, no database.
- All demo data lives in a typed, versioned data layer under `src/data/`, generated by a
  deterministic seeded script so every build produces the identical dataset.
- Role is chosen at a "Choose your view" screen and held in client state + URL. It is a
  **view selector, not authentication** — never present it as a real login, and say so on
  the screen. A fake login screen that implies real credentials is dishonest and will be
  read as such by a technical evaluator.
- Charts: use one charting library consistently. Every chart ships with an accessible
  table alternative and a CSV download.

### 3.2 Code
- TypeScript everywhere, `strict: true`. Do not disable type checking or linting to unblock
  a build — fix the types. (The previous project shipped with checks disabled; do not repeat it.)
- Domain types live in one place and are the single source of truth (`docs/04_DATA_MODEL.md`).
- Components are presentational and take data as props. No data fetching inside components.
- Small, named, testable functions for every derived metric (fill rate, days-to-assignment,
  coverage gap, completion rate). Each one gets a unit test with hand-checked expected values.

### 3.3 Performance
- Statewide views may render 130+ divisions and thousands of referral rows. Virtualize long
  tables. Precompute aggregates at build time — never aggregate thousands of rows in a render.
- Target: any view interactive in under 1.5s on a mid-range laptop over conference-room wifi.

### 3.4 The demonstration-data marker
A persistent, dismissible-but-returning banner and an inline chip on record-level views:

> **DEMONSTRATION DATA** — Figures on this screen are synthetic and generated for
> demonstration. No real student, referral, or case data is present. Statutory and
> programmatic references are sourced. [View sources]

Style it as a deliberate, confident design element — not an apology.

---

## 4. Design

Follow `docs/03_DESIGN_SYSTEM.md` exactly. Summary:
- Warm cream canvas `#FBF7F1`, white floating cards, one disciplined orange accent — sampled
  from the actual IEP Partners logo. Not another gray government dashboard.
- **Brand orange is `#CE5500`** (sampled from the bridge). Primary button fill is
  `#A84300` with white text. `#E8871E` is decorative only — no text ever sits on it.
  These values are computed against WCAG, not chosen by eye. Do not substitute.
- Marketing surfaces are **comfortable** density; operational dashboards are **compact**.
  Two densities, one system. Do not make the dashboards airy.
- Status is communicated with pill badges that pair color **and** text **and** icon.

---

## 5. Definition of done for any screen

1. Renders correctly at 1440, 1024, 768, and 390px wide.
2. Loading, empty, error, and zero-results states all designed and reachable.
3. Keyboard-only navigable; visible focus; screen-reader landmarks correct.
4. Every chart has its accessible table and CSV export.
5. Every number traces to either a citation or the synthetic dataset — no hard-coded magic numbers.
6. No stack, tool, host, or vendor name appears anywhere the user can see.
7. Someone unfamiliar can find the single most important status on the screen in five seconds.
