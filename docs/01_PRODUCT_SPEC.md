# 01 — Product Specification

Every screen, every role, every feature. Build exactly this.

---

## 0. Information architecture

```
/                          Public front door (the pitch)
/problem                   The Gap — the fragmentation problem, sourced
/platform                  What TransitionBridge does, by role
/accessibility             Accessibility conformance statement
/sources                   Every citation, linked
/enter                     "Choose your view" — the role selector

/state                     STATE LEADERSHIP
  /state                     Command view (statewide)
  /state/map                 Coverage map
  /state/districts           District comparison
  /state/divisions           Division comparison (all 132)
  /state/vendors             Statewide vendor performance
  /state/outcomes            WIOA §116 outcomes
  /state/reserve             15% Pre-ETS reserve tracking
  /state/reports             Report builder + exports

/dars                      DARS COUNSELOR / DISTRICT
  /dars                      My district dashboard
  /dars/queue                Referral queue (triage)
  /dars/referrals/[id]       Referral detail
  /dars/students             Student roster
  /dars/students/[id]        Student record + service history
  /dars/vendors              Vendors serving my district + capacity
  /dars/reports              District reporting

/school                    SCHOOL TRANSITION COORDINATOR
  /school                    My division dashboard
  /school/refer              Submit a referral (the anti-paperwork screen)
  /school/referrals          My referrals + live status
  /school/referrals/[id]     Referral detail + timeline
  /school/students           My caseload
  /school/compliance         Consent, documentation, deadlines

/vendor                    PRE-ETS VENDOR (ESO)
  /vendor                    My dashboard
  /vendor/inbox              Incoming referrals (accept / decline)
  /vendor/roster             Students I'm serving
  /vendor/log                Log a Pre-ETS activity
  /vendor/capacity           Capacity & coverage settings
  /vendor/scorecard          My performance vs. district & state
```

---

## 1. Public front door

Not a generic SaaS landing page. This is a **case**, made to an agency, in the agency's own
language. Comfortable density, warm cream canvas, one orange accent.

### 1.1 Hero
- Eyebrow: `VIRGINIA · PRE-EMPLOYMENT TRANSITION SERVICES`
- Headline: **"Virginia already has the data. TransitionBridge makes it visible."**
- Sub: One sentence naming the four disconnected parties and the cost of that disconnection.
- Two CTAs: **Enter the demonstration** (primary) and **See the research** (ghost).
- Right side: a live, animated preview of the statewide command view — the product IS the
  hero image. No stock photography anywhere on this site, ever.
- Below the fold line: the `DEMONSTRATION DATA` notice, stated confidently.

### 1.2 "The Gap" — four questions
Four cards, each posing a question the Commonwealth cannot currently answer quickly:

1. *Which school divisions sent no Pre-ETS referrals this quarter?*
2. *How many referrals are sitting unassigned right now, and for how long?*
3. *Which Virginia counties have no Pre-ETS vendor coverage?*
4. *Of the students who completed services, how many are employed?*

Under each: a single line on why it's hard today (separate systems, separate records), then
`→ See it answered` linking into the demo at the exact screen that answers it. This is the
strongest possible structure — it makes the demo the *answer* to a question the viewer has
already accepted is unanswered.

### 1.3 "Sourced, not asserted"
A short section listing the agency's own documented findings — the 2025 CSNA findings on
rural Pre-ETS gaps, transportation, fee schedule, and documentation burden — each linked to
the primary source. Then one line: *"We built to what the assessment already found."*

### 1.4 "Built on the five required activities"
A visual of the five statutory Pre-ETS activities as the product's organizing spine, with a
note that reporting is structured to RSA-911's shape and WIOA §116's indicators.

### 1.5 By role
Four panels — DARS, Schools, Vendors, State Leadership — each with the three things that
role gets. Links into that role's view.

### 1.6 Trust strip
IEP Partners certifications as understated badges: Woman-Owned Small Business (WOSB),
Service-Disabled Veteran-Owned Small Business (SDVOSB), Minority / Black American-Owned,
Small Disadvantaged Business, Virginia-registered, federally registered in SAM.
Grayscale treatment. No color competing with the orange.

> Note: IEP Partners' SAM registration required renewal as of the last internal check.
> Confirm current status before displaying "active federal registration."

### 1.7 Footer
IEP Partners, Petersburg VA. Links to `/sources` and `/accessibility`. **No technology names.**

---

## 2. `/enter` — Choose your view

Honest, not a fake login. Four large cards, each with role name, one-line description, and
the name of the synthetic persona you'll be viewing as.

Header text: *"This is a demonstration environment. Select a role to see the platform as
that user sees it. No account or credentials are required — nothing here is real data."*

Selecting a role sets it in client state and the URL (`?role=dars&persona=hr-counselor-01`)
so any view is directly linkable — essential for a live demo where you may need to jump.

A persistent role switcher lives in the top bar in every authenticated-looking view, so you
can move between perspectives mid-sentence. **This is the single most impressive interaction
in the demo**: showing the same referral from four different chairs, instantly. Make the
transition smooth and obviously deliberate.

---

## 3. State leadership command view — `/state`

This is the screen that wins the room. Design it first, design it best.

### 3.1 Top band — six statewide KPI tiles
Compact, one row, each with value, label, sparkline, and period-over-period delta with
direction arrow **and** a text label (never color alone):

1. **Active referrals** (statewide)
2. **Unassigned > 14 days** — the accountability number, styled as an alert if non-zero
3. **Median days: referral → service start**
4. **Divisions with zero referrals this quarter** — the invisible failure, made visible
5. **Counties without vendor coverage**
6. **Pre-ETS reserve utilized** — % of the 15% reserve spent, with projection

Tile 2 and tile 4 are the emotional core of the demo. Nobody can see these today.

### 3.2 Virginia coverage map
Interactive choropleth of Virginia by county/city, toggled between four layers:

- **Referral volume** — where demand is
- **Vendor coverage** — how many approved vendors serve this locality
- **Service gap** — demand minus capacity; the red areas are the story
- **Outcomes** — employment rate of students who completed services

Hover: locality name, division(s), referral count, vendor count, gap score.
Click: drills into that locality's division detail.

Accessibility: the map must have an equivalent sortable data table toggle. A map that
excludes screen reader users, in a demo for a disability agency, is indefensible.

### 3.3 Referral funnel
A retention-style funnel: Submitted → Accepted by DARS → Assigned to provider → Services
started → Services completed → Employment outcome. Each stage shows count, % of previous,
and median days in stage. Click any stage to see the records sitting in it.

The drop-off between "Assigned" and "Services started" is where the story lives. Make sure
the synthetic data has a realistic, defensible drop there.

### 3.4 District comparison
Six DARS districts, small-multiple bar chart plus a sortable table: referrals in, fill rate,
median days to assignment, completion rate, employment rate, vendor count, spend.
Sortable by every column. This is the view a District Director will immediately want.

### 3.5 IEP vs. 504 mix
A stacked view by district and by division showing referral composition:
IEP / 504 / Documented-other. Directly addresses the referral-imbalance question, and
nothing in the market can produce this view today.

### 3.6 Activity mix
Which of the five required activities are actually being delivered, statewide and by
district. Reveals over-delivery of the cheap activities (job exploration counseling,
workplace readiness) and under-delivery of the expensive, outcome-driving one (work-based
learning experiences). That's a real, defensible operational insight.

### 3.7 Alerts panel
Rule-driven, plain-language, each with a link to the affected records:
- "17 referrals in Southwest District have been unassigned for over 21 days."
- "9 divisions have submitted no referrals in the current quarter."
- "4 counties have no approved Pre-ETS vendor within 40 miles."
- "Work-based learning experiences are being delivered to 22% of served students statewide."
- "Pre-ETS reserve utilization is tracking 11 points below the same point last year."

Alerts are what turn a dashboard into an operations tool. Give each one an owner and an
age. Nothing sits in an unowned state.

---

## 4. DARS counselor workspace — `/dars`

### 4.1 District dashboard
My district's version of the state view, scoped. Plus **my personal caseload**: assigned
students, upcoming reviews, referrals awaiting my triage, overdue documentation.

### 4.2 Referral queue — the triage screen
A dense, sortable, filterable table. Compact density, ClickUp discipline. Columns:

`Age (days) · Student ID · Division · School · Grade · Plan (IEP/504/Other) · Diploma track ·
Requested activities · Consent status · Status · Assigned vendor · Actions`

- Sort defaults to **oldest first** — the queue should feel like a responsibility.
- Row-level status pill: `New · Under review · Awaiting consent · Ready to assign ·
  Assigned · In service · Completed · Closed — not served`.
- Aging highlight: >14 days gets a visible treatment (border + icon + label, not color alone).
- Bulk select → assign to vendor.
- Filters: district, division, plan type, grade, status, age bucket, requested activity,
  transportation-barrier flag.
- Saved views ("My unassigned >14 days") persisted in local state.

### 4.3 Assignment flow
Click **Assign** → a panel showing candidate vendors ranked by a transparent, explainable fit:
distance to the student's school, current capacity headroom, whether they deliver the
requested activities, their scorecard, and median response time. **Show the reasoning** —
"3 of 3 requested activities · 12 miles · 6 of 20 slots open · 94% completion rate." Never
show an unexplained ranking; agencies do not trust black boxes and are right not to.

### 4.4 Referral detail
Full record: student (synthetic), school, division, plan type, grade, diploma track,
disability documentation status, consent status and date, requested activities,
transportation barrier flag, notes, assigned vendor, and a **complete event timeline** with
actor and timestamp on every event. The timeline is the closed loop made visible — this is
what the school coordinator has never been able to see.

### 4.5 Student record
Identity (synthetic), referral history, every Pre-ETS service delivered with date /
activity / provider / duration, documents checklist, outcome record (employment, credential,
postsecondary enrollment), and the RSA-911-relevant field summary.

---

## 5. School transition coordinator workspace — `/school`

The design objective here is explicitly **"give the coordinator time back."** Field research
found coordinators losing their day to documentation rather than students. Every decision on
these screens is judged against that.

### 5.1 Division dashboard
My referrals by status, what's stuck and why, upcoming deadlines, consent forms outstanding,
and a simple "students eligible but not yet referred" list (age 14+, IEP or 504, no referral
on file) — a proactive prompt that no current system offers.

### 5.2 Submit a referral — the anti-paperwork screen
The most important screen for adoption. If this is not obviously faster than what they do
today, nothing else matters.

- **One screen, not a wizard.** Progressive disclosure, not pagination.
- Student lookup pre-fills everything already known — the duplicate-data-entry complaint is
  the loudest one in the field research. Demonstrate that we never ask twice.
- Requested activities: five checkboxes, the exact statutory names.
- Consent: upload-or-attest, with clear status.
- Transportation barrier: an explicit flag (the CSNA named transportation as a real barrier;
  capturing it at referral is how it becomes an analyzable fact instead of an anecdote).
- Inline validation, autosave draft, and an explicit *"This takes about 90 seconds"* promise
  next to the submit button — then make that true.
- On submit: an immediate confirmation with a tracking reference and the honest expected
  next step and timeline.

### 5.3 My referrals
Every referral I've submitted with its **live status** — the single thing that does not
exist today. Filter by status, student, and age. Each row expands to the same event timeline
the DARS counselor sees. Full transparency across the boundary is the product.

### 5.4 Compliance view
Consent forms outstanding, documentation gaps, students approaching age-out, and IEP/504
review dates in relation to transition planning. Plain-language, deadline-first ordering.

---

## 6. Vendor workspace — `/vendor`

### 6.1 Dashboard
Open referral offers, students in service, services logged this month, capacity utilization,
and my scorecard position.

### 6.2 Referral inbox
Incoming offers with **accept / decline (with reason) / request more info**. Declines
require a reason from a fixed list — decline reasons are operational gold: "no capacity,"
"outside service area," "cannot deliver requested activity," "transportation not feasible."
Aggregate them upward into the state view. Nobody currently captures why a referral fails.

### 6.3 Service log
Log a delivered Pre-ETS activity: student, activity (the five, exact names), date, duration,
setting, notes. Designed for speed and repeat entry — bulk-log a group session across
multiple students in one action. This is the "streamline documentation" recommendation from
the CSNA, implemented literally.

### 6.4 Capacity & coverage
Set localities served, activities offered, and current slot capacity. This is the input that
makes the statewide coverage-gap map possible — show the vendor the direct link between what
they maintain here and what the state can see. Reciprocity drives data quality.

### 6.5 Scorecard
My performance against district and state medians: acceptance rate, median response time,
service completion rate, employment outcome rate, **median wage and 90-day retention**
(the CSNA flagged placement quality — measuring only placement count is exactly the failure
mode it identified), and activity mix. Peer comparison anonymized.

---

## 7. Compliance & reporting

### 7.1 WIOA §116 outcomes view
The six primary indicators, in statutory order and with statutory names:
employment rate Q2 after exit · employment rate Q4 after exit · median earnings Q2 after exit ·
credential attainment rate · measurable skill gains · effectiveness in serving employers.
Each with trend, and a breakdown by district and by division.

### 7.2 15% reserve tracking
Federal award, the 15% reserve requirement, spend to date, spend by district, spend by
activity, and a straight-line projection to fiscal year end with a shortfall/overrun flag.

Label the award figure clearly as illustrative unless a verified number is sourced.

### 7.3 RSA-911 aligned export
Export a service-record file shaped to RSA-911 reporting: identifier, plan type, the five
required activities delivered, Pre-ETS service start date (the DE 96 analogue), provider, and
service dates. Call it **"RSA-911 aligned"** — never "certified" or "compliant."

### 7.4 Report builder
Pick a scope (state / district / division / vendor), a period, and a set of measures.
Produces an on-screen report with charts and tables, plus CSV and print-to-PDF.
The printed output must be branded, dated, and carry the demonstration-data notice.

---

## 8. Cross-cutting requirements

### 8.1 States
Every list, table, and chart has designed **loading**, **empty**, **zero-results-after-filter**,
and **error** states. Empty states say what to do next, not "no data."

### 8.2 Search
One global search across students (synthetic IDs), divisions, schools, and vendors. `/` to
focus. In a demo, being able to type a division name and land instantly reads as mastery.

### 8.3 Exports
CSV on every table. Print stylesheet on every report. Both carry the demonstration-data notice.

### 8.4 Explain-this
A small `?` affordance on every non-obvious metric that opens a plain-language definition
and, where applicable, the statutory citation. Agencies live and die by definitional
precision; showing that we know the difference between "referrals received" and "individuals
served" earns more trust than any chart.

### 8.5 Demo mode
A presenter toggle (keyboard shortcut) that:
- Enlarges type by one step for projection
- Highlights the current section
- Enables a guided tour that walks the eight beats of `08_DEMO_SCRIPT.md`

### 8.6 Motion
Subtle and purposeful. Chart entrance animations under 400ms. Respect
`prefers-reduced-motion` fully — this is an accessibility requirement, not a preference.
