# 11 — Usability: Built for People Who Are Not Technical

This is the hardest requirement in the project and the one most likely to be quietly ignored.
Read it before every build prompt.

## Who actually uses this

Not analysts. Not data people. The real users are:

- A **transition coordinator** with 40 students, three IEP meetings today, and eleven minutes
  between them. She is not going to read documentation. She will try the thing once, and if
  it confuses her she will go back to her spreadsheet forever.
- A **DARS counselor** carrying a caseload, working in an existing system all day, who is
  being asked to open one more tab.
- A **vendor coordinator** at a small nonprofit who logs services on paper and types them up
  on Friday.
- A **Commissioner or District Director** who will look at this for ninety seconds, twice a
  month, and needs to leave knowing one thing that matters.

None of them will be trained. None of them will read a manual. Design as if the only
onboarding is the screen itself.

---

## The five tests

Every screen must pass all five. If it fails one, it isn't done.

### 1. The five-second test
Open the screen cold. Within five seconds, can you say what this screen is for and what the
single most important number on it is? If your eye has to hunt, the hierarchy is wrong.

### 2. The no-jargon test
Read every visible word aloud. Would a school coordinator with no VR background understand
it? Some vocabulary is unavoidable and correct — *Pre-ETS*, *IEP*, *504*, the five activity
names — because those are the words users already use daily. But everything **we** invent
must be plain:

| Never write | Write |
|---|---|
| "Referral throughput velocity" | "How long referrals take" |
| "Utilization coefficient" | "How full this vendor is" |
| "Non-terminal pipeline state" | "Still open" |
| "Aggregate cohort outcome index" | "How many got jobs" |
| "Fill rate" (unexplained) | "Referrals that reached a provider" |
| "MSG" | "Measurable skill gains" *(then define it)* |
| "Null result set" | "No referrals match these filters" |

Statutory terms stay statutory — but every one gets an explain-this affordance the first
time it appears on a screen.

### 3. The one-obvious-next-action test
Every screen has exactly one primary action, and it is visually unmistakable — the only
orange filled button in view. Secondary actions are outlined or ghost. If a screen has three
things competing to be the main action, the user does none of them.

### 4. The dead-end test
No screen may leave a user stuck. Every empty state, every error, every zero-results filter
says **what happened, why, and what to do next**, with a button that does it.

| Bad | Good |
|---|---|
| "No data" | "No referrals match these filters. **Clear filters** or **change the date range**." |
| "Error 500" | "We couldn't load this. **Try again** — if it keeps happening, nothing you did caused it." |
| "0 results" | "No students in this division are awaiting assignment. That's good news. **See all referrals**" |

### 5. The reversibility test
Nothing destructive happens without a confirm, and nothing at all happens without an undo or
an obvious back. A user who is afraid of breaking something will not explore, and a user who
does not explore never adopts.

---

## Concrete rules

### Language
- **Second person, active voice.** "You have 12 referrals waiting" not "12 referrals are pending assignment."
- **Complete sentences in alerts.** "17 referrals in Southwest District have been waiting more than 14 days." Not "Southwest: 17 >14d."
- **Numbers get units and context.** Not `34%` alone — `34% of students who completed services` with the denominator visible on hover.
- **Dates are human.** "March 4" and "12 days ago", not `2026-03-04T00:00:00Z`. Absolute date on hover.
- **Never blame the user.** "That date range doesn't have any records" not "Invalid input."

### The explain-this affordance
Every metric that isn't self-evident gets a small `?` that opens a short panel with:
1. A one-sentence plain-language definition
2. The exact formula in words — "referrals assigned to a provider ÷ referrals accepted"
3. The statutory citation, where one exists
4. Why it matters, in one line

This single component does more for adoption than any chart. Agencies are precise about
definitions, and a non-technical user who can self-serve an answer never has to ask anyone.

### Progressive disclosure
Show the answer first, the detail on demand.
- KPI tile → click → the records behind it
- Chart → "View as table" → the numbers
- Table row → expand in place, or slide-in drawer — **never a full page navigation that
  loses their place**
- Filters collapsed by default with active filters shown as removable chips

### Forms — especially `/school/refer`
This screen decides adoption. Rules:
- **One screen.** Progressive disclosure, never a multi-step wizard with a progress bar.
- **Never ask twice.** Anything already known is pre-filled and visibly marked as such
  ("From student record — edit if wrong"). The duplicate-data-entry complaint was the
  loudest thing in the field research.
- **Validate inline, on blur, in plain language.** "This needs to be a date in the past" not
  "Invalid format."
- **Autosave the draft** and say so. "Saved just now."
- **State the time cost honestly** — "About 90 seconds" — then meet it. Time yourself.
- **Confirm concretely.** Not "Success!" but "Referral submitted for J. Martinez. Reference
  DEMO-REF-2026-004182. A DARS counselor typically reviews within 3 days — you'll see the
  status change here."
- **Every input has a real `<label>`.** Placeholder text is not a label; it disappears the
  moment someone starts typing, which is exactly when they need it.

### Tables
- Sort and filter are the only two controls that matter. Make them obvious and make the
  active state visible.
- Default sort should encode the priority: the referral queue sorts oldest-first because
  oldest is most urgent. Defaults are a form of guidance.
- Column headers in plain words: "Waiting (days)" not "age_days".
- Row click opens a drawer, not a navigation.
- Always show "Showing 24 of 1,180" — users need to know what they're not seeing.

### Charts
- Title states the finding, not the variable: **"Work-based learning is 8% of services
  delivered"** beats "Activity mix by type."
- Direct-label the series where possible; legends are a lookup task.
- Never more than 6 series. Above that, use a table.
- Always paired with "View as table" — some people simply think in numbers, and it's an
  accessibility requirement besides.

### Navigation
- Maximum two levels. If you need three, the information architecture is wrong.
- Current location always visible in the rail and in the page title.
- The product logo always returns to that role's home.
- Global search reachable by `/` and by a visible field — not everyone knows keyboard shortcuts.

### First-run
On first entry to any role, a **three-step** coach mark sequence — no more — pointing at:
(1) where you are, (2) the one number that matters here, (3) the one action you'd take.
Dismissible forever, replayable from a `?` in the top bar. Three steps, not twelve.

---

## What to actively avoid

- Dashboards that show everything and prioritize nothing
- Acronyms without expansion on first use, anywhere
- Modals stacked on modals
- Hover-only interactions — they don't exist on touch and they're invisible to keyboard users
- Icon-only buttons without a text label or an accessible name
- Infinite scroll in an operational table — people need to know the size of their problem
- "Advanced" tabs that hide the thing people actually need
- Any interaction that requires knowing what a filter query is
- Density so tight it becomes unreadable — compact is not cramped; 40px rows, real gutters

---

## The final check

Before calling any screen done, answer honestly:

> *Could a transition coordinator with eleven minutes between IEP meetings, who has never
> seen this before and will not read anything, accomplish the one thing this screen exists
> for — on her first try, without asking anyone?*

If the answer is no, the screen is not done, regardless of how good it looks.
