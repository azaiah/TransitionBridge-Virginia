# 06 — Build Prompts for Claude Code

Ten prompts. Paste them into Claude Code **one at a time, in order**. Let each one compile,
run, and be looked at with your own eyes before moving to the next. Do not batch them — the
whole point of the sequence is that each stage is verified before the next depends on it.

**Repo:** https://github.com/azaiah/TransitionBridge-Virginia

---

## Before Prompt 1 — do these by hand (5 minutes)

1. Clone the repo and copy in `CLAUDE.md`, `docs/`, and `.gitignore`.
2. Copy the logo files into `public/brand/`, renamed:
   - `iep-partners-logo.png` → `public/brand/iep-lockup.png`
   - `iep-bridge.png` → `public/brand/iep-mark.png`
   - `iep-text.png` → `public/brand/iep-wordmark.png`
   - The DataIsData icon goes in `public/brand/dataisdata-icon.png` for the "Powered by
     DataIsData" badge only (decided September 2026). See `docs/10_BRAND_ASSETS.md` §5.
3. Open the folder in Cursor.
4. First message to Claude Code, before any prompt:
   > *"Read CLAUDE.md, then docs/00_START_HERE.md, then docs/11_USABILITY.md. Confirm you've
   > read all three and summarize the three hardest constraints in this project before I give
   > you the first build prompt."*

   If its summary doesn't include (a) no tech stack visible to users, (b) verified vs.
   illustrative numbers kept separate, and (c) built for non-technical users who won't read
   documentation — make it read them again. That check is worth the two minutes.

Internal stack (never appears in the product): Next.js 14 App Router with static export,
TypeScript strict, Tailwind, shadcn/ui, Recharts, react-simple-maps + bundled Virginia
TopoJSON, Vitest, deployed static to Netlify.

---

# PROMPT 1 — Foundation, design system, data layer

```
Read CLAUDE.md and every file in docs/ before writing any code. docs/03_DESIGN_SYSTEM.md and
docs/11_USABILITY.md are hard requirements, not suggestions.

Scaffold TransitionBridge: a Next.js 14 App Router application, TypeScript with strict:true,
configured for fully static export (output: 'export'). There is no server runtime, no
database, and no network calls at runtime — that is deliberate and permanent. Tailwind CSS,
shadcn/ui, Recharts, lucide-react, Vitest.

1. DESIGN SYSTEM
   Implement every token in docs/03_DESIGN_SYSTEM.md as CSS custom properties in globals.css
   and map them into tailwind.config.ts. Both densities (comfortable, compact) must be
   expressible via a data attribute or class on a container.

   The brand colors are sampled from the actual IEP Partners logo and are NOT negotiable:
     --tb-orange        #CE5500   brand accent, active states, chart series
     --tb-orange-deep   #A84300   primary button fill, white text on it (6.1:1)
     --tb-orange-bright #E8871E   decorative only — NO TEXT EVER SITS ON THIS
     --tb-navy          #10213C   nav rail, dark panels
     --tb-canvas        #FBF7F1   page background — never #FFFFFF
     viz ramp: #0D4A72 → #3C7FA0 → #CE5500 → #E8871E → #3C6D0F → #6FA33A
   Also define --tb-bridge: linear-gradient(90deg,#0D4A72 0%,#CE5500 50%,#3C6D0F 100%).
   That gradient is the logo itself; use it exactly once per page as the section divider.

   Write a small script or test that computes the WCAG contrast ratio for every
   foreground/background pair actually used in the app and FAILS if any text pair is below
   4.5:1 (3:1 for ≥18.66px bold). Do not eyeball contrast — compute it. Print the table.

   Fonts via next/font: Inter (all UI), Fraunces (hero display only), JetBrains Mono
   (identifiers and micro-labels). Enable a tabular-nums utility and apply it to every
   numeric column and KPI value.

2. DATA LAYER
   Create src/data/types.ts containing every type in docs/04_DATA_MODEL.md verbatim,
   including Provenance and Figure. Then build scripts/generate-demo-data.ts per
   docs/05_DEMO_DATA.md using a deterministic seeded PRNG (mulberry32) — no Math.random()
   anywhere in this codebase, ever.

   For THIS prompt, generate only the real geography: all 133 Virginia localities with FIPS
   codes, the 6 DARS districts, and all 132 school divisions with their real names, plus a
   small placeholder volume of activity so the shell has something to render. The full
   distributions come in Prompt 3.

   Wire it to `npm run generate`, writing typed JSON into src/data/.

3. SHELL AND BASE COMPONENTS
   Two layouts:
   - Marketing: cream canvas, centered 1200px, top nav with the IEP lockup, footer.
   - Product: collapsible 240px navy left rail, fluid content to 1680px, top bar with global
     search and role switcher, persistent DEMONSTRATION DATA banner.

   Base components, all with the usability rules from docs/11_USABILITY.md baked in:
   Button (primary/secondary/ghost/danger — exactly one primary visible per screen),
   StatusPill (the full fixed vocabulary, always color + text + icon),
   KpiTile (meta label, tabular value, delta with arrow AND text direction, sparkline,
     whole tile is a link to the records behind it),
   DataTable (sticky sortable header in plain-English column names, 40px rows, row click
     opens a drawer NOT a navigation, "Showing 24 of 1,180" count, CSV export, column
     toggle, virtualized above 100 rows, designed empty state that says what to do next),
   ChartFrame (title states the FINDING not the variable, explain-this affordance, legend,
     "View as table" rendering a real <table>, CSV download — no chart may exist outside
     this frame),
   ExplainThis (the "?" panel: one-sentence plain definition, the formula in words, the
     statutory citation where one exists, and why it matters in one line),
   AlertRow (complete plain-language sentence, age chip, owner chip, "View records" link),
   Stat (REQUIRES a Provenance prop — make the type impossible to omit),
   EmptyState, ErrorState, DemoDataBanner.

4. ACCESSIBILITY BASELINE
   Skip link, correct landmarks, visible focus ring on everything, prefers-reduced-motion
   handling that makes animation instant rather than merely faster, and a real
   /accessibility page.

Do not disable TypeScript or ESLint checks for any reason — fix the types instead. Get it
compiling and running with the design system visibly correct. Then stop, show me the
contrast table, and summarize.
```

---

# PROMPT 2 — Public site and role selector

```
Build the public marketing site and the /enter role selector per §1 and §2 of
docs/01_PRODUCT_SPEC.md. Apply docs/11_USABILITY.md to every word on these pages.

Pages: / , /problem , /platform , /sources , /accessibility , /enter

Requirements that matter most:
- The hero visual IS the product — a live, animated preview of the statewide command view
  rendered from real demo data, in a white card floating over the cream canvas with the warm
  glow shadow. No stock photography anywhere on this site, ever. Not one image of a person.
- Headline: "Virginia already has the data. TransitionBridge makes it visible."
  Fraunces, and this is the ONLY place Fraunces appears.
- "The Gap" — four question cards, each posing something the Commonwealth cannot currently
  answer quickly, each linking into the exact demo screen that answers it. These four cards
  are the spine of the entire pitch; make them the best thing on the page.
- "Sourced, not asserted" — the DARS 2025 Needs Assessment findings, each linked to the
  primary source.
- The five required Pre-ETS activities shown as the product's organizing spine.
- Four by-role panels. Trust strip with the IEP Partners certifications in grayscale.
- /sources renders EVERY citation from docs/02_RESEARCH_AND_SOURCES.md as a real, linked,
  browsable page grouped by section. This page is a credibility weapon — make it excellent.
- /accessibility is a genuine conformance statement, not boilerplate.
- /enter presents four honest role cards. It is explicitly NOT a login and the copy says so
  plainly. Selecting a role sets it in client state AND the URL (?role=&persona=) so every
  downstream view is directly linkable — essential when presenting live.
- Build the role switcher in the product top bar with a 320ms crossfade, so an audience
  registers that the perspective changed.

Comfortable density here, per the design doc. Run it, look at it, and keep refining spacing,
type, and rhythm until it is genuinely beautiful — not "fine," not "clean." Then stop and
summarize.
```

---

# PROMPT 3 — The full statewide dataset

```
This prompt decides whether the demo is believable. A DARS analyst will spot an implausible
distribution in four seconds.

Complete scripts/generate-demo-data.ts to produce the full dataset exactly per
docs/05_DEMO_DATA.md — every scale target in §2 and every distribution in §3, including all
the deliberately-created findings:

- 9–12 school divisions with ZERO referrals in the current quarter, weighted rural
- 90–140 referrals unassigned more than 14 days, concentrated in Southwest and New River
- 8–12 localities with zero vendor coverage; 15 more with a single vendor above 85% capacity
- Work-based learning experiences at ~8% of services delivered statewide, varying widely by district
- Rural median days-to-assignment materially worse than urban (21+ vs 9)
- Transportation barrier on ~23% statewide / ~41% rural, with a real correlation to days-to-first-service
- Decline reasons distributed per §3.9, with "transportation not feasible" at ~18%
- Placement wage and 90-day retention present, so placement QUALITY is measurable, not just count
- Applied Studies track outcomes measurably lower than Standard

A dataset where everything looks fine has nothing to demonstrate. The entire pitch is "here
is what you cannot currently see" — so there must be something worth seeing, and it must
survive being clicked into.

Compute every aggregate in aggregate.ts FROM the underlying records. Do not hand-write a
single summary number anywhere in this codebase. Generate alerts from rules evaluated against
real records so every alert links to records that genuinely are in that state.

Then write the full validation suite from §5 of docs/05_DEMO_DATA.md. These tests must FAIL
THE BUILD when violated:
  1. sum(districtMetrics) === stateMetrics for every additive measure, every period
  2. sum(divisionMetrics grouped by district) === districtMetrics
  3. Every referral status is consistent with its own event timeline
  4. Every service date falls after its referral's assignment date
  5. Every student is 14+ with a valid plan type
  6. Every alert's linkTo route resolves to ≥1 matching record
  7. No generated name collides with a blocklist of real Virginia ESO and DARS staff names
  8. Every ID starts with DEMO-
  9. Same seed produces an identical bundle hash

Test 1 is the one that saves the presentation — someone WILL add up the districts.

Run the suite and show me the results.
```

---

# PROMPT 4 — State leadership command view

```
Build /state and its sub-routes per §3 of docs/01_PRODUCT_SPEC.md. This is the screen that
wins the room. Give it the most care of anything in this build.

Apply the five-second test from docs/11_USABILITY.md ruthlessly: a Commissioner looking at
this for ninety seconds must leave knowing one thing that matters.

- Six KPI tiles in the specified order. Tiles 2 (unassigned >14 days) and 4 (divisions with
  zero referrals this quarter) get the alerting treatment — 3px semantic left border plus
  icon, never color alone. Every tile links through to the records behind it.
- Referral funnel: Submitted → Accepted → Assigned → Services started → Completed →
  Employment outcome. Count, % of previous, median days in stage. Every stage clickable
  through to the records sitting in it. Use the bridge gradient for the funnel progression.
- District comparison: small-multiple bars plus a fully sortable table.
- IEP vs 504 mix, stacked, by district and by division.
- Activity mix across the five required activities. Title the chart with the FINDING:
  "Work-based learning is 8% of services delivered."
- Alerts panel: complete plain-language sentences, age chip, owner chip, working
  "View records" link on each. Nothing sits in an unowned state.
- Sub-routes: /state/districts, /state/divisions (all 132, virtualized), /state/vendors,
  /state/outcomes (the six WIOA §116 indicators in statutory order with statutory names),
  /state/reserve (15% Pre-ETS reserve with a year-end projection).

Compact density. Every chart in ChartFrame with its accessible table and CSV. Every number
through <Stat> with an explicit Provenance. Every non-obvious metric gets ExplainThis.
Designed loading, empty, zero-results-after-filter, and error states on every list and chart
— and each must say what to do next, with a button that does it.

Check it at 1440 and 1024. Then stop and summarize.
```

---

# PROMPT 5 — DARS counselor workspace

```
Build /dars per §4 of docs/01_PRODUCT_SPEC.md.

The user is a counselor carrying a caseload who is being asked to open one more tab. Every
interaction must earn its place.

- /dars — district dashboard, district-scoped, plus the counselor's personal caseload:
  assigned students, referrals awaiting my triage, overdue documentation.

- /dars/queue — the triage table, and the most-used screen in the product.
  Dense, sortable, filterable, bulk-selectable. DEFAULT SORT IS OLDEST FIRST — the queue
  should feel like a responsibility, and the default is a form of guidance.
  Referrals over 14 days get a visible aging treatment: border + icon + text label, never
  color alone. Column header reads "Waiting (days)", not "age_days".
  Filters: district, division, plan type, grade, status, age bucket, requested activity,
  transportation barrier. Active filters shown as removable chips. Saved views ("My
  unassigned over 14 days") persisted in local state.

- Assignment flow — an explainable matching panel. Rank candidate vendors and SHOW THE
  REASONING on every row in plain words: "3 of 3 requested activities · 12 miles · 6 of 20
  slots open · 94% completion rate." Never an unexplained score. Agencies do not trust black
  boxes and they are right not to.

- /dars/referrals/[id] — full record with the COMPLETE event timeline: actor and timestamp
  on every event. Make the timeline the visual centrepiece of the page. This is the closed
  loop made visible, and it is the thing the school coordinator has never been able to see.

- /dars/students and /dars/students/[id] — full service history plus the RSA-911-relevant
  field summary.
- /dars/vendors — vendors serving my district with live capacity.

Row clicks open a drawer, not a navigation — never lose the user's place in the queue.
Then stop and summarize.
```

---

# PROMPT 6 — School coordinator workspace

```
Build /school per §5 of docs/01_PRODUCT_SPEC.md.

The design objective is explicitly "give the coordinator her time back." The user is a
transition coordinator with 40 students and eleven minutes between IEP meetings. She will
try this once. If it confuses her she goes back to her spreadsheet forever.

- /school — division dashboard: my referrals by status, what's stuck and why, upcoming
  deadlines, consent forms outstanding, and a proactive "eligible but not yet referred" list
  (age 14+, IEP or 504, no referral on file). No current system offers that prompt.

- /school/refer — THE ADOPTION SCREEN. Build this one twice if you have to.
  * ONE screen with progressive disclosure. Never a multi-step wizard with a progress bar.
  * Student lookup pre-fills everything already known, and VISIBLY marks it: "From student
    record — edit if wrong." We never ask for the same fact twice, and the UI should make
    that obvious, because duplicate data entry was the loudest complaint in the field research.
  * Five checkboxes using the exact statutory activity names.
  * Consent: upload-or-attest with an unmistakable status.
  * Explicit transportation-barrier flag.
  * Real <label> on every input. Placeholder text is not a label.
  * Inline validation on blur, in plain language: "This needs to be a date in the past,"
    never "Invalid format."
  * Autosave draft, and say so: "Saved just now."
  * "About 90 seconds" next to the submit button — then TIME IT and make that true.
  * Confirmation is concrete: "Referral submitted for J. Martinez. Reference
    DEMO-REF-2026-004182. A DARS counselor typically reviews within 3 days — you'll see the
    status change here." Not "Success!"

- /school/referrals — live status on every referral I submitted, expanding to the same event
  timeline the DARS counselor sees. Full cross-boundary transparency IS the product.

- /school/compliance — consent outstanding, documentation gaps, students approaching age-out,
  IEP/504 review dates against transition planning. Deadline-first ordering, plain language.

Then stop and summarize, and tell me how long /school/refer actually took you to complete
end to end.
```

---

# PROMPT 7 — Vendor workspace

```
Build /vendor per §6 of docs/01_PRODUCT_SPEC.md.

The user is a coordinator at a small nonprofit who currently logs services on paper and types
them up on Friday. Optimize for fast repeat entry above all else.

- /vendor — dashboard: open referral offers, students in service, services logged this month,
  capacity utilization, scorecard position.

- /vendor/inbox — accept / decline-with-reason / request-more-info. Declines REQUIRE a reason
  from the fixed list (no capacity, outside service area, cannot deliver activity,
  transportation not feasible, scheduling conflict, other). Those reasons aggregate upward
  into the state view — nobody currently captures why a referral fails, and when 18% of
  declines statewide are "transportation not feasible," that stops being an anecdote and
  becomes a budget line someone can argue for.

- /vendor/roster — students I'm serving.

- /vendor/log — log a delivered Pre-ETS activity: student, activity (the five, exact
  statutory names), date, duration, setting, notes. Built for speed and repetition, with
  BULK GROUP-SESSION LOGGING across multiple students in one action. This is the CSNA's
  "streamline documentation" recommendation implemented literally — make it feel fast.

- /vendor/capacity — localities served, activities offered, current slot capacity. Show the
  vendor the direct link between what they maintain here and what the state can see on the
  coverage map. Reciprocity is what drives data quality.

- /vendor/scorecard — my performance vs. district and state medians: acceptance rate, median
  response time, completion rate, employment outcome rate, MEDIAN PLACEMENT WAGE and 90-DAY
  RETENTION, and activity mix. Peer comparison anonymized. Measuring only placement count is
  exactly the failure mode the 2025 Needs Assessment identified — measure quality.

Then stop and summarize.
```

---

# PROMPT 8 — Coverage map and report builder

```
Build the Virginia coverage map at /state/map per §3.2 of docs/01_PRODUCT_SPEC.md.

- Choropleth of all 133 Virginia localities using react-simple-maps with a BUNDLED Virginia
  county/independent-city TopoJSON. No external tile service, no runtime network calls —
  this must work with the wifi off.
- Four toggleable layers: referral volume, vendor coverage, service gap, outcomes.
- Hover: locality, division(s), referral count, vendor count, gap score.
- Click drills into that locality's division detail.
- Sequential scales built from the viz ramp. Verify every step against the cream canvas for
  contrast, AND confirm the scales stay distinguishable under deuteranopia and protanopia
  simulation. This is a platform for a disability services agency — the map cannot rely on
  hue discrimination alone. Add a value label or pattern fallback.
- MANDATORY: a "View as table" toggle rendering an equivalent sortable table of all 133
  localities. A map that excludes screen reader users is not shippable here, and it is the
  first thing a VR agency will notice.
- Keyboard navigable: tab through localities, Enter to drill in.

Then build /state/reports — the report builder. Pick scope (state / district / division /
vendor), period, and measures. Render on screen with charts and tables. Export CSV. Print
stylesheet producing a branded, dated PDF carrying the demonstration-data notice and the IEP
Partners lockup.

Keep the builder to three controls maximum on first view. A non-technical user must be able
to produce a useful report without knowing what a query is.

Then stop and summarize.
```

---

# PROMPT 9 — Compliance, reporting, and explain-this everywhere

```
Build the compliance layer per §7 of docs/01_PRODUCT_SPEC.md.

- /state/outcomes — the six WIOA §116 primary indicators in statutory order with statutory
  names: employment rate 2nd quarter after exit; employment rate 4th quarter after exit;
  median earnings 2nd quarter after exit; credential attainment rate; measurable skill gains;
  effectiveness in serving employers. Trend for each, plus breakdown by district and division.
  Every one gets an ExplainThis with the plain-language definition AND the citation — these
  are terms even agency staff routinely get slightly wrong.

- /state/reserve — federal award (clearly marked illustrative), the statutory 15% reserve
  requirement, spend to date, spend by district and by activity, straight-line projection to
  fiscal year end with a shortfall flag. Include a short sourced note explaining the 15%
  reserve, linked to the citation. For a CFO this is the screen that pays for the pilot.

- RSA-911 aligned export: identifier, plan type, required activities delivered, Pre-ETS
  service start date (the DE 96 analogue), provider, service dates. Label it "RSA-911
  aligned" — never "certified," never "compliant." Do not overclaim.

- Roll ExplainThis out across the ENTIRE app now. Every non-obvious metric, everywhere.
  Be precise about definitional distinctions — "referrals received" is not "individuals
  served," and showing that we know the difference earns more trust than any chart.

Then stop and summarize.
```

---

# PROMPT 10 — Polish, audit, demo mode

```
Final pass. Add NO new features. Make what exists excellent.

1. USABILITY AUDIT. Walk every screen against the five tests in docs/11_USABILITY.md:
   five-second test, no-jargon test, one-obvious-next-action test, dead-end test,
   reversibility test. Read every visible string aloud and rewrite anything a transition
   coordinator wouldn't understand. Confirm exactly one primary button is visible per screen.
   Confirm no dead ends anywhere. Report every change you made.

2. ACCESSIBILITY AUDIT. Screen by screen: keyboard-only navigation of every interactive
   element with a visible focus ring; correct landmarks and heading order; aria-live on async
   regions; a real <label> on every input; every chart has its accessible table; contrast
   ≥4.5:1 body and ≥3:1 large/UI on every pairing — COMPUTE these, don't eyeball; no meaning
   conveyed by color alone anywhere; prefers-reduced-motion makes animation instant rather
   than merely faster. Fix everything and give me a written report.

3. STATES. Every list, table, and chart has designed loading, empty, zero-results-after-filter,
   and error states, each reachable and each telling the user what to do next with a button
   that does it.

4. RESPONSIVE. 1680 / 1440 / 1024 / 768 / 390. Below 1024 the nav rail becomes a bottom bar
   and data tables become stacked record cards — never a horizontally scrolling table.

5. FIRST-RUN COACHING. On first entry to each role, a THREE-step coach mark sequence — no
   more than three — pointing at where you are, the one number that matters, and the one
   action you'd take. Dismissible forever, replayable from a "?" in the top bar.

6. DEMO MODE. Presenter toggle by keyboard shortcut: enlarges type one step for projection,
   highlights the active section, and runs a guided tour through the eight beats in
   docs/08_DEMO_SCRIPT.md with next/previous/escape.

7. GLOBAL SEARCH. "/" focuses it, and a visible search field exists too — not everyone knows
   keyboard shortcuts. Searches students, divisions, schools, vendors. Grouped results.

8. PERFORMANCE. Every view interactive under 1.5s on a mid-range laptop. Virtualize any
   remaining long lists. Move remaining runtime aggregation to build time. Report bundle size
   and the slowest route.

9. COMPLIANCE SWEEP. Grep the entire BUILT output — every page, export, PDF, meta tag, and
   shipped comment — for the name of any framework, library, host, database, or vendor. There
   must be ZERO occurrences visible to a user. Report what you searched for and what you found.

10. FAVICON AND SOCIAL. Favicon from the bridge mark at 32 and 16px plus a 180px
    apple-touch-icon. Open Graph image 1200×630: cream background, IEP lockup centered, the
    bridge gradient rule beneath, and "TransitionBridge — Virginia Statewide Pre-ETS Referral
    & Outcomes Platform." This is what shows when the link is pasted into an email to a
    Commissioner.

11. TYPES AND TESTS. Strict TypeScript passes with no suppressions and no ignore flags
    anywhere in the config. Full test suite green.

Give me a written report against the definition-of-done checklist in CLAUDE.md §5, plus the
usability and accessibility findings.
```

---

## After the build

1. `07_DEPLOY_NETLIFY.md` — ship it, then run the pre-presentation checklist **on the
   deployed URL**, not on localhost.
2. `08_DEMO_SCRIPT.md` — rehearse out loud, twice, with a timer.
3. Close the §1 items in `09_OPEN_ITEMS.md` before any live presentation. Two of them
   (the Pre-ETS volume figure, the current district structure) are things that will cost
   credibility if they're wrong in front of DARS leadership.

## If Claude Code drifts

Common failure modes and the correction:

| Symptom | Say this |
|---|---|
| Dashboards look like the landing page | "Compact density per docs/03_DESIGN_SYSTEM.md §3. This is a tool, not a brochure." |
| Charts without accessible tables | "Every chart goes inside ChartFrame. No exceptions — re-read CLAUDE.md §1.5." |
| Jargon creeping into labels | "Re-read docs/11_USABILITY.md test 2 and rewrite every string on this screen." |
| Hand-written summary numbers | "Every aggregate is computed in aggregate.ts from records. Remove the literal." |
| Framework name in the UI or a comment that ships | "CLAUDE.md §1.1. Remove it and grep for others." |
| `ignoreBuildErrors` added to unblock | "Never. Fix the types. Revert that config change." |
| A screen with three competing buttons | "One primary action per screen. Demote the others to secondary or ghost." |
