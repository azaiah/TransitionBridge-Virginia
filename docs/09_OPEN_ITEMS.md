# 09 — Open Items

Things that must be resolved. Nothing here blocks the build — the demo can be built and
deployed while these are settled — but items in §1 **must** be closed before a live
presentation to DARS.

---

## 1. Must close before presenting

| # | Item | Why it matters | Owner |
|---|---|---|---|
| 1.1 | **Verify the Pre-ETS volume figure** — the "16,006 in-house services / ~412 via vendors" number attributed to the PY2024–27 state plan. The primary document would not open during research. | Saying an unverified number to DARS leadership costs credibility we can't buy back. Either read it in the primary source or don't say it. | Azaiah / Michelle |
| 1.2 | **Confirm the current DRS district structure.** The map we have is dated 09/25/2021 (6 districts). Michelle can confirm with her DARS contacts in one call. | The demo is organized by district. Presenting a stale org structure to the people who work in it is an unforced error. | Michelle |
| 1.3 | **Confirm IEP Partners' SAM registration status.** Internal notes flag it as expired. | The trust strip claims federal registration. Don't display it if it isn't current. | Azaiah |
| 1.4 | **Pricing for the pilot.** Have a real number, in writing, before the meeting. | "What does it cost" will be asked. Improvising is worse than deferring, and deferring twice looks unprepared. | Tony |
| 1.5 | **Decide who presents and rehearse.** | The role-switching sequence (Beat 5) only lands if the transitions are smooth. | Team |

---

## 2. Decisions I made on your behalf — override if you disagree

| Decision | What I chose | Why | Reversible? |
|---|---|---|---|
| Product name | **TransitionBridge** | Extends the IEP bridge identity into DARS' own daily vocabulary ("transition coordinator", "transition specialist"); descriptive enough that a Commissioner gets it from the name; neutral enough to white-label to another state without a rebrand. | Easily — one find/replace before build |
| Repo / folder | `TransitionBridge-Virginia` | Omits "DARS" deliberately: naming a repo after an agency that hasn't signed anything can read as presumptuous if the URL is ever seen, and it makes the second state a rename. | Easily |
| Positioning vs. incumbent | **Layer above** their case management system, never a replacement | Aware and Libera together cover ~2/3 of US VR agencies. "We replace Aware" starts a procurement fight we lose. "We complement your system of record" keeps us in the room. | This is the single most important strategic call in the document — but I'd argue hard for it |
| Design anchor | Harvest (warm cream + one orange) for surfaces, ClickUp for dashboard density | Near-exact match to the existing IEP brand at world-class execution, and the only warm dashboard in a room full of gray ones. | Yes, but this one is genuinely good |
| Demo honesty | A "Choose your view" selector, explicitly not a login | A fake login on a demo is read as dishonest by any technical evaluator, and the role *switcher* is a better demo moment than a login screen ever is. | Yes |
| Data posture | 100% synthetic, prefixed `DEMO-`, visible banner | Makes the demo presentable with no data agreement — and turn that into a selling point rather than a caveat. | No — don't reverse this |

---

## 3. Things I'd like from you before Prompt 3

- ~~**The IEP Partners logo files**~~ ✅ **Received.** See `10_BRAND_ASSETS.md`.
- ~~**Confirmation of the orange**~~ ✅ **Resolved — and the build plan was wrong.** Colors
  are now sampled directly from the artwork: orange `#CE5500` (not `#E8871E`), green
  `#3C6D0F` (not `#4E9B3F`), navy `#10213C`. `03_DESIGN_SYSTEM.md` is corrected and the
  contrast table recomputed.
- **Still needed: a mono SVG of the bridge mark + transparent-background exports.** The PNGs
  have a white matte that will show as a box against the cream canvas and against the navy
  nav rail. Five-minute job, but it's the difference between polished and homemade. If
  vector originals exist anywhere, those are better than everything we have.
- **Whether Michelle can name one pilot district** she'd realistically propose. If we seed that district with visibly richer detail, the ask at the end becomes concrete instead of abstract.
- **Any DARS documents Michelle has that aren't public** — a fee schedule, an ESO scorecard PDF, a referral form. Even one real form makes `/school/refer` demonstrably faster than what they do today, which is the whole adoption argument.

---

## 3b. From the IEP Partners feedback round (September 2026)

Built and documented in `12_IEP_FEEDBACK_UPGRADES.md`. Four questions to confirm with Michelle:

| # | Question | Where it shows |
|---|---|---|
| 3b.1 | **W-9 or W-4?** Her note is ambiguous. A student in paid work experience normally completes a W-4 (and an I-9); a W-9 is for contractors. Labeled "Payroll document (W-9 / W-4)" until confirmed. | Secure documents on each record |
| 3b.2 | **Escalation recipients** — "district manager" at 30 days and "state office" at 90. Confirm the titles DARS uses. | Early warnings everywhere |
| 3b.3 | **Partner funders** — DARS, DMAS, Virginia Works, school division, grant, local workforce board, other agency. Confirm the list and names. | Funding screens and records |
| 3b.4 | **Reasons for showing a name** — a starting list; confirm with DARS privacy staff. | "Show name" dialog |

---

## 4. Deliberately deferred

Not in this build. Don't let scope creep pull them in.

- Real authentication and multi-tenant data isolation → pilot phase
- Integration or import from any DARS system → scoped during the pilot
- DBHDS as a second tenant → after DARS. One agency, one story. Two agencies in one demo dilutes both.
- Employer and student/family portals → phase 2. Four roles is already a lot to hold in a 12-minute demo.
  (Employers now appear through the job board and employer matches — September 2026 — with
  no employer login and no student names shown to them.)
- Mobile app → the responsive web views are sufficient and a native app invites questions we don't want yet.
- CJIS / FedRAMP claims → **never improvise these.** Compliance review precedes real data. That's the whole answer.

---

## 5. Risks worth naming out loud

**The strongest objection we will face** is not technical — it's *"we already have systems for
this."* The answer has to be immediate and specific: name Aware, acknowledge it's good at what
it does, and draw the line clearly between a system of record and a coordination layer. If
that answer is fumbled, the meeting ends politely and nothing happens.

**The second** is procurement. A pilot with a state agency has a path, and it isn't "they liked
the demo." Michelle's Secretariat-level guidance — identify the gap, network the agencies,
present a pilot — is the right sequence, but somebody should find out what the actual
contracting vehicle would be before the meeting, so the answer to "how would we even buy
this?" isn't a shrug. IEP Partners' set-aside eligibility (WOSB, SDVOSB, small disadvantaged)
is a real advantage here and is worth knowing how to invoke precisely.

**The third** is that a great demo raises expectations about delivery timelines. Be honest
about what a pilot takes. Winning the room and then missing the date is worse than a
slightly less exciting meeting.
