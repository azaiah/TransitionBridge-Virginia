# 00 — Start Here

## The one-page version

Virginia's Pre-Employment Transition Services system is made of four groups who cannot see
each other's work:

1. **School transition coordinators** refer students with disabilities to DARS.
2. **DARS counselors** receive those referrals and arrange services.
3. **Vendors (Employment Service Organizations)** deliver the five required Pre-ETS activities.
4. **State leadership** is accountable for the outcomes and the federal reporting.

Every one of those groups keeps its own records. There is no shared, real-time view. So no
one can answer, today, in under a week: *Which divisions are sending no referrals? Which
referrals are sitting unassigned? Which counties have no vendor coverage? Which students
actually got a job?*

**TransitionBridge is that shared view.** It does not replace anyone's case management
system. It sits above the ecosystem and makes it legible.

This repository is the **demonstration environment** — statewide, fully seeded with
synthetic data, self-contained, and built to survive a live presentation to agency
leadership without a network connection to anything.

---

## Why this wins

Three things make this credible rather than another vendor pitch deck:

1. **It already exists.** The underlying platform was built and shipped for IEP Partners'
   workforce reintegration program. This is a re-skin and re-point of proven infrastructure,
   not a concept. Say "here is the working system" not "here is what we could build."

2. **The problem is documented by the agency itself.** DARS' own 2025 Comprehensive
   Statewide Needs Assessment names Pre-ETS service gaps (especially rural), transportation
   barriers, and burdensome documentation requirements. We are not telling DARS something
   they don't believe — we are showing them their own stated problem, solved. See
   `02_RESEARCH_AND_SOURCES.md`.

3. **It speaks the federal language.** The platform is organized around the five statutory
   Pre-ETS activities and the WIOA §116 primary performance indicators, and exports
   RSA-911-shaped records. This is the difference between "a nice dashboard" and "a system
   that reduces our federal reporting risk."

---

## Positioning: what this is NOT

Be precise about this in every conversation, because it removes the two objections that
would otherwise kill the deal:

- **Not a replacement for their case management system.** State VR agencies run
  well-entrenched COTS case management (Aware and Libera together cover roughly two-thirds
  of the nation's ~80 VR agencies). Proposing to replace it is proposing a multi-year
  procurement fight we lose. TransitionBridge is the **visibility and coordination layer
  above** it — the thing those systems were never designed to be.
- **Not a system of record for protected data (yet).** In the pilot framing, TransitionBridge
  consumes referral and service-event metadata. When the conversation turns to production
  and real student data, the answer is: a compliance review precedes any live data, and the
  data layer is portable to whatever hosting posture the contract requires. Do not
  improvise a compliance claim in a meeting.

---

## Build order

Work through `06_BUILD_PROMPTS.md` sequentially. Do not skip ahead; each prompt assumes the
previous one compiles and runs.

| # | Prompt | Produces |
|---|---|---|
| 1 | Foundation | Project scaffold, design tokens, layout shell, data layer types |
| 2 | Public site + role selector | The front door and the "Choose your view" screen |
| 3 | State leadership command view | The screen that wins the room |
| 4 | DARS counselor workspace | Referral queue, triage, assignment, case detail |
| 5 | School coordinator workspace | Referral submission and tracking |
| 6 | Vendor workspace | Capacity, accepted referrals, service logging |
| 7 | Coverage map + analytics | The Virginia map and the comparison analytics |
| 8 | Compliance & reporting | WIOA/RSA-911 aligned reporting and exports |
| 9 | Polish | Accessibility audit, empty states, motion, demo mode, print |

Then `07_DEPLOY_NETLIFY.md`, then rehearse with `08_DEMO_SCRIPT.md`.

---

## Naming and identity

| Thing | Value |
|---|---|
| Product name | **TransitionBridge** |
| Positioning line | Virginia's Statewide Pre-ETS Referral & Outcomes Platform |
| Tagline | Every referral. Every student. Every division. One live view. |
| Vendor of record | IEP Partners, LLC (Petersburg, VA) |
| Built by | DataIsData |
| Repository | `TransitionBridge-Virginia` |
| Local folder | `C:\Users\azaia\OneDrive\TransitionBridge-Virginia` |
| Deploy target | Netlify — suggested site name `transitionbridge-va` |

Why this name: it extends the IEP Partners bridge identity (education → transition →
employment) into the exact vocabulary DARS and school divisions already use every day —
"transition services," "transition coordinator," "transition specialist." It is descriptive
enough that a Commissioner understands it from the name alone, and neutral enough to
white-label to another state without a rebrand.
