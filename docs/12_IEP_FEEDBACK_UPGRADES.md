# 12 — IEP Partners feedback round (September 2026)

Michelle (IEP Partners, LLC) reviewed the demonstration and sent handwritten notes asking
for a set of upgrades. This document records what the notes say, the decisions made where
the notes left a choice open, what was built, and where each piece lives in the code.

Everything here is still **synthetic demonstration data**. No real student, referral, case,
funding, or employer record is present. Every new screen carries the DEMONSTRATION DATA
marker, and every funding amount is illustrative.

---

## 1. What the notes ask for

Transcribed independently and compared line by line with a second (Gemini) transcription.
Where the two readings differed, the reading used for the build is noted.

| Topic in the notes | What was built from it |
|---|---|
| Restricted identity — students shown by an ID, not a name | Transition ID on every screen; names only on request, with a reason, and recorded |
| Standardized profile — the same fields for every student | Transition readiness profile: five areas, one status scale, career interest, support level |
| Career interest (example in the notes: **Health**) | Career interest on every profile; drives employer matching |
| Support level **"Moderate — attach"** | Support level with documentation required; the profile says when it is missing |
| Accommodations — documentation attached | Accommodations shown as "Documented" or "Not yet documented" |
| Secure document folder — owner, date, expiry, who can see it | Secure documents panel with access levels, expiry, version, and per-document history |
| Payroll paperwork (read as **W-9 / W-4**) | Document type "Payroll document (W-9 / W-4)"; appears only after paid work-based learning |
| Who did what — audit | Audit trail on every record, plus a statewide Access and audit log |
| **Escalation / expectation & risk** — 14, 30, 90 days | Early warning system for **past-due referrals** at 14, 30, and 90 days |
| Funding — who pays; authorized / used / remaining | Funding layer with seven funders, per-student hours, and an over-billing guard |
| Partner funders including **"VA Work"** (read as **Virginia Works**) | Funders: DARS Pre-ETS, DMAS, Virginia Works, school division, grant, local workforce board, other agency |
| Need → intervention → progress → outcome | Journey strip at the top of every record |
| Employers | Job board and employer matches (see decisions) |
| Downloads — who can take data out | Guarded downloads: purpose required, names removed, file stamped, providers refused |

### Where the two transcriptions differed

1. **Career example** — read as *Health* (a career interest), not a medical field.
2. **Support level** — read as *"Moderate, attach"* (attach the documentation), not "medical".
3. **Page heading** — read as *"escalation / expectation & risk"*; the 14/30/90 alerts apply to
   **past-due referrals**.
4. **"VA Work"** — read as **Virginia Works**, the state workforce program.
5. **W-9 vs W-4 / I-9** — the handwriting is ambiguous. A W-9 is for contractors; a student in
   paid work experience normally completes a W-4 (and an I-9). The document is labeled
   **"Payroll document (W-9 / W-4)"** so either reading holds. **Confirm with Michelle.**

---

## 2. Decisions

| Question | Decision |
|---|---|
| Who may see a student's name? | **The referring school and the student's DARS counselor**, on request, with a reason. The request is recorded. Providers and state leadership never see names. |
| How do employers take part? | **Job board + matches** in the counselor and provider portals, and employer matches on each student's record. **No employer login** — employers never see a student. |
| Coach marks | Every new feature has coach-mark cards, in the same style as the original tours. |

---

## 3. What was built

### 3.1 Restricted identity — Transition IDs

- Format `AN-VA-004661`: school code · state · six-digit student number.
- Shown everywhere a student appears: queue, lists, rosters, records, search, downloads,
  the RSA-911 export (student identifier column).
- **Show name** (school and DARS only): pick a reason → the name shows on that screen only →
  an audit entry records who, when, and why. Everyone else sees "Name restricted".
- Search finds a student by Transition ID; the name is searchable only in the portals that
  may reveal it.

Code: `src/lib/identity.ts`, `src/data/identity.ts`, `src/components/identity/StudentIdentity.tsx`.

### 3.2 The transition record (one secure record per student)

Opened from any list at `/{portal}/students/detail/?id=…`. Sections:

- **Journey** — need → intervention → progress → outcome.
- **Transition readiness profile** — workplace readiness, transportation, communication,
  independent living, education after high school; career interest; support level;
  accommodations; employer-match count. Documentation status is shown, never assumed.
- **Secure documents** — owner, date added, expiry (current / expiring / expired), version,
  who can open it, and history. Adding a document in the demonstration adds a placeholder
  only; the dialog warns never to add a real document.
- **Funding and hours** — every authorization with its funder, hours authorized, used, left.
- **Employer matches** — postings that fit the career interest and district, with reasons.
- **Services delivered**, **Audit trail**, and **Who can see what** (the access table).

What each portal sees is set in one place (`SECTION_ACCESS` in `src/lib/access.ts`):

| Part of the record | State | DARS | School | Provider |
|---|---|---|---|---|
| Student's name | Hidden | On request, recorded | On request, recorded | Hidden |
| Readiness profile | Summary | Full | Full | Full |
| Journey | Full | Full | Full | Full |
| Services | Summary | Full | Full | Full |
| Funding and hours | Full | Full | Hidden | Summary (own hours) |
| Secure documents | Summary | Full | Full | Full (by access level) |
| Employer matches | Hidden | Full | Full | Full |
| Audit trail | Full | Full | Hidden | Hidden |

A record outside the viewer's caseload is refused, and the refusal is recorded.

Code: `src/components/record/*`, `src/lib/transition-record.ts`, `src/lib/record-audit.ts`.

### 3.3 Early warnings — 14, 30, 90 days

A referral can stall in three places, each with an owner:

| Stage | Measured from | Who moves it |
|---|---|---|
| Waiting for a provider | Submission | DARS counselor |
| Waiting on a consent form | Submission | School coordinator |
| Waiting for a first service | Assignment | Assigned provider |

Rungs: **past 14 days** → flagged to the counselor; **30** → escalated to the district
manager; **90** → escalated to the state office. Only waits that began within the last year
escalate; older open referrals are counted separately as needing a close-or-reopen decision.

Where it shows: counselor, school, provider, and state home screens; the queue's early-warning
views; My referrals ("past due" filter); the provider roster; every record; and the
statewide **Early warnings** screen (`/state/early-warnings/`).

Code: `src/lib/escalation.ts`, `scripts/lib/escalations.ts`, `src/components/escalation/*`.

### 3.4 Funding — who is paying

- Seven funders. DARS Pre-ETS dollars used **equal the 15% reserve spent to date to the
  dollar** (checked on every build and on screen).
- Per-student authorizations: hours authorized, used, remaining; "near the limit" at 90%;
  "over authorization" past 100%.
- **Over-billing guard**: the provider's service log checks each student's remaining hours
  before anything is saved. A session that would go past the limit — or a student with no
  open authorization — is refused for that student, and the refusal is recorded.
- DARS can extend an authorization, with a reason; the extension is recorded.
- Screens: counselor **Funding and hours** (`/dars/funding/`), state **Who is paying**
  (`/state/funding/`), funding sections on the dashboards, and the record.

Illustrative FY2026 totals in the dataset: $16.57M authorized, $9.00M utilized across 11,642
authorizations; DARS $13.42M authorized, $7.27M used. Every student with a provider — including
those assigned but not yet started — has an authorization, so a provider's roster and the
counselor's funding list always cover the same students.

Code: `src/lib/funding.ts`, `scripts/lib/funding.ts`, `src/components/funding/*`,
`src/components/vendor/VendorLogService.tsx`.

### 3.5 Employers — job board and matches

- 96 synthetic employer partners, 156 postings, 16 employers per DARS district.
- Filters: field, kind of job, "reachable without a car".
- Each posting lists the students it fits (by Transition ID): counselors see students with
  active referrals in their district; providers see their own roster.
- On a record, matches put car-free postings first when a transportation barrier is flagged.
  "Share with the student's team" is recorded.
- Screens: `/dars/jobs/`, `/vendor/jobs/`, and the record's Employer matches panel.

Code: `scripts/lib/employers.ts`, `src/data/employers.ts`, `src/components/jobs/JobBoard.tsx`,
`src/components/record/EmployerMatchesPanel.tsx`.

### 3.6 Guarded downloads and the audit log

- Every download of student-level rows asks for a purpose, removes names, and stamps the
  file with who, when, and why. Totals-only downloads say so.
- Provider accounts cannot download student lists; the refusal is recorded.
- **Access and audit log** (`/state/audit/`): 290 seeded entries from June 2026 (40 names
  shown, 111 records opened, 33 downloads, 23 refusals), plus everything done in the current
  demonstration at the top, marked "This demonstration". Filters by kind of action and by who.
  Every seeded entry obeys the same access rules as the live screens — a name is shown only by
  the student's school or DARS counselor, a refusal is always for a record outside the
  person's caseload — and each record's own audit trail shows its share of this history.
- Demonstration activity is kept in the presenter's browser only. "Clear demonstration
  activity" resets it before the next presentation.

Code: `src/components/privacy/*`, `src/lib/session-store.ts`, `src/lib/access.ts`.

### 3.7 Demonstration data that ties together

The three default accounts share students, so a presenter can follow one student across
portals:

| Account | Scope |
|---|---|
| C. Smith, Transition Coordinator | Fairfax Public Schools |
| A. Davis, DARS Counselor | Northern District (which includes Fairfax) |
| R. Miller, Provider | Massanutten Employment Pathways Center (serves Northern District students) |

What was added or corrected so every screen has data and every number agrees:

- **Students the school knows but has not referred** — 467 statewide (40 in Fairfax). They fill
  the school's *Eligible, not referred*, *Missing disability documentation* (99 statewide), and
  *Approaching age-out* (24 statewide, age 20–21 on the Applied Studies track) lists. None has
  a referral, so no statewide referral count moved. Their record shows the plan the school holds,
  "Not yet documented" where the documentation is missing, and "No Pre-ETS referral yet" on the
  journey strip.
- **Profile, documents, and compliance agree** — "Documentation attached" on the readiness
  profile appears only when the document is in the secure folder; a support-level assessment
  exists only after DARS review. Tested for every student.
- **Journey strip follows the referral status** — awaiting consent, under review, waiting for a
  provider, assigned, or closed, in those words.
- **Headline ties to the lists** — "Unassigned more than 14 days" on the state view (116)
  equals the district totals, the referral queue, and the 14/30/90 "waiting for a provider"
  counts. A referral waiting on a provider is never set aside as dormant.
- **Outcome rates use two years** — employment outcomes lag referrals by months, so district,
  division, and counselor outcome rates pool the last two program years instead of showing 0%
  for this quarter's young cohort.
- **Long tables** — a display fault that left long lists (such as DARS *Students*, 3,520 rows)
  blank below the header was fixed; every long list now renders its rows at any scroll position.
- **Coverage map** — redrawn with a projection that always renders Virginia, and single-hue
  shading with a legend.

### 3.8 Coach marks for everything new

- Each portal's home screen: the original three-step tour, then **What's new** (marked
  "New") — shown once.
- Every new screen and the record page have their own short tour, shown the first time the
  screen is opened.
- The **?** menu replays the tour for the screen you are on.
- Tours scroll the thing they describe into view.

Code: `src/lib/coach.ts`, `src/components/onboarding/*`.

---

## 4. Tests added

- `tests/transition.test.ts` (32 tests): Transition IDs, the 14/30/90 ladder, funding math
  and the over-billing guard, the access rules, determinism of the derived record, and a
  check that every coach mark points at something that exists on a real screen.
- `tests/data-integrity.test.ts` (additions): unique Transition IDs; funding reconciles by
  funder and district; DARS used equals reserve spent; authorizations attach to real
  referrals; early-warning counts match a row-by-row recount; employers and postings are
  well formed; wages are at least the Virginia minimum wage; employer names pass the real-name
  blocklist; the new files regenerate byte for byte (including the access-log history);
  every district and division has students not yet referred; the state headline equals the
  district totals; every seeded access-log entry obeys the access rules and is dated on or
  before the demonstration date.
- `tests/transition.test.ts` also checks that the readiness profile, secure documents, and
  compliance lists never disagree, and that the journey wording follows the referral status.

`npm run verify` → typecheck, lint, contrast (29/29), tests (151/151) all pass.

---

## 5. Open questions for IEP Partners

1. **W-9 or W-4?** The payroll document is labeled "W-9 / W-4" until confirmed.
2. **Escalation recipients.** The 30-day rung goes to the "district manager" and the 90-day
   rung to the "state office". Confirm the job titles DARS uses.
3. **Partner funders.** Confirm the list and whether any funder should be renamed.
4. **Name reasons.** The reasons offered for showing a name are a starting list; confirm
   them with DARS privacy staff.

---

## 6. Presenting the upgrades (five minutes)

1. **Counselor home** (A. Davis, Northern District) — point at Early warnings (14 / 30 / 90) and
   Funding and hours.
2. **Students** → open a record. Show the Transition ID, then **Show name** with a reason.
3. Walk the record: journey, readiness profile (documentation attached), secure documents,
   funding, employer matches, audit trail, who can see what.
4. Switch to **Provider** → **Log services**: choose a student near their limit and a long
   session — the service is refused before it is saved.
5. Switch to **State leadership** → **Access and audit log**: the name view, the download,
   and the refused service are at the top, marked "This demonstration", above a month of
   earlier activity.
5b. Optional — **School coordinator** (C. Smith, Fairfax) → **Compliance & documentation**:
   open a student under *Missing disability documentation* to show a record before any referral.
6. Close on **Who is paying**: DARS dollars used match the 15% reserve to the dollar.
