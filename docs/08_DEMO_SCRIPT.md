# 08 — Demo Script

Twelve minutes. Eight beats. Rehearse it out loud, twice, with a timer.

The audience is DARS leadership and possibly school division and state leadership. They have
sat through a lot of vendor demos. What they have never seen is their own problem, in their
own vocabulary, already solved on screen.

---

## Before you begin

- Deployed URL open, demo mode on, laptop plugged in, notifications off.
- Offline copy ready as a fallback.
- **Do not open with your company.** Open with their problem.
- Verify the two flagged research items (`02_RESEARCH_AND_SOURCES.md` §C1 and §C5) first.

---

## Beat 1 — The four questions (90 seconds)

Land on `/`. Do not scroll past the four question cards.

> "Before I show you anything, four questions. Which of your school divisions sent no
> Pre-ETS referrals last quarter? How many referrals are sitting unassigned right now, and
> for how long? Which Virginia counties have no Pre-ETS vendor coverage at all? And of the
> students who completed services, how many are employed?
>
> Every one of those answers exists somewhere in the Commonwealth today. It's in your
> counselors' records, in the divisions' files, in the vendors' logs. The reason it takes
> weeks to assemble is that no two of those live in the same place."

Pause. Let them agree. They will.

> "Nothing about that is anyone doing a bad job. It's four groups of people working hard
> inside four systems that were never designed to talk to each other."

That sentence matters. Never let this sound like criticism of their agency.

---

## Beat 2 — This is your own assessment (60 seconds)

Scroll to the sourced section.

> "We didn't invent this problem. Your 2025 Comprehensive Statewide Needs Assessment found
> Pre-ETS service gaps across the state, especially rural. It found transportation is a
> barrier. It found providers describing the documentation requirements as burdensome, and
> recommended you streamline them. We built to those findings. Every source on this page
> is linked."

Click through to `/sources` for two seconds. Do not read it. The existence of the page is
the point — it says *we did the reading*.

---

## Beat 3 — The command view (2 minutes)

`/state`. Let it land before you speak. Then walk the top row left to right.

> "This is the Commonwealth, live. Active referrals. Referrals unassigned more than
> fourteen days —" *(click the tile)* "— and here they are. Every one, oldest first, with
> the division that sent it and the district it's sitting in."

Back. Then the one that lands hardest:

> "Divisions that submitted zero referrals this quarter." *(click)* "There they are by name."

Pause here. This is the moment. Nobody in the room has ever had this list.

> "Not a report you request. Not a data pull that takes three weeks. This is Tuesday morning."

---

## Beat 4 — The map (90 seconds)

`/state/map`. Start on referral volume, then switch to service gap.

> "Referral demand. Now vendor coverage. Now the difference between them — that's the
> service gap. The red is where students are being referred and there is no capacity within
> a reasonable distance."

Hover a rural locality.

> "This county has no approved Pre-ETS vendor. Your assessment said rural gaps exist. This
> is which ones, by name, today."

Then toggle the table view for two seconds.

> "And because this is a platform for a disability services agency, every map, chart, and
> visual in this system has a full accessible equivalent. That was a requirement from the
> first line of code, not an afterthought."

That line will be noticed. It is worth the eight seconds.

---

## Beat 5 — The closed loop, from four chairs (2.5 minutes)

The best interaction in the demo. Pick one referral and stay on it.

Start as the **school coordinator**:
> "A transition coordinator in Portsmouth refers a student. Ninety seconds, one screen, and
> nothing they've already told the system gets asked again."

Switch role → **DARS counselor**:
> "It arrives in the counselor's queue. Oldest first. She assigns a vendor — and the system
> shows her *why* each vendor is ranked: distance, open capacity, whether they actually
> deliver the activities requested, their completion rate. No black box."

Switch role → **vendor**:
> "The vendor accepts, or declines with a reason. And those reasons roll up — when eighteen
> percent of declines statewide are 'transportation not feasible', that stops being an
> anecdote and becomes a budget line you can argue for."

Switch role → back to **school coordinator**, open the timeline:
> "And here's the part that doesn't exist anywhere today. The coordinator who sent that
> referral can see exactly what happened to it. Who accepted it. When services started.
> What was delivered. Whether that student got a job. She has never been able to see that."

The role switching, done smoothly, is what makes people believe this is real software.
Rehearse the transitions until they're seamless.

---

## Beat 6 — The insight they can't get anywhere else (60 seconds)

`/state` activity mix.

> "The five required Pre-ETS activities. Look at the distribution. Workplace readiness and
> job exploration are the bulk. Work-based learning experiences — the most resource-intensive
> and the one most predictive of employment — is eight percent statewide, and it varies
> enormously by district."

Pause.

> "I'm not going to tell you what to do about that. I'm telling you that right now, that
> number is not visible to anyone in the Commonwealth. It should be."

---

## Beat 7 — Federal reporting and the 15% reserve (90 seconds)

`/state/outcomes`, then `/state/reserve`.

> "The six WIOA primary indicators, by their statutory names, by district and by division.
> And the export is shaped to RSA-911 — identifier, plan type, required activities delivered,
> Pre-ETS service start date, provider, service dates."

Then the reserve view.

> "Federal law requires you reserve at least fifteen percent of your VR grant for Pre-ETS.
> This tracks spend against that reserve, by district, by activity, with a projection to
> year end. Reserved money that doesn't get spent is money at risk — and this is the view
> that tells you in March instead of September."

For a CFO or a Commissioner, this is the beat that pays for the pilot.

---

## Beat 8 — Close (90 seconds)

> "Everything you've seen is running now. It's not a mockup and it's not a roadmap — it's
> the same platform we built and shipped for a workforce program, pointed at Pre-ETS.
>
> All of the data is synthetic. There's no student record and no case data in this system,
> which is exactly why we could bring it into this room without a data agreement.
>
> This doesn't replace your case management system. It sits above it. Your counselors keep
> working the way they work. What changes is that the schools, the vendors, the districts,
> and you can finally all see the same picture at the same time.
>
> What we'd like is a pilot. One district, one semester. If at the end of it you can answer
> those four questions from the first slide in ten seconds instead of three weeks, we'll
> talk about the Commonwealth."

Stop talking. Let them ask.

---

## Anticipated questions — prepare these

**"Does this replace Aware?"**
> "No. Aware is your system of record and should stay that way. This is the coordination
> and visibility layer above it — the thing case management systems were never designed to
> be. We'd expect to consume referral and service metadata from it, not compete with it."

**"What about student privacy and FERPA? CJIS?"**
> "Today, nothing. Everything here is synthetic — that's deliberate. Before any real student
> data enters the system, a compliance review comes first, covering FERPA, state data
> requirements, and any agency-specific standards. The data layer is built to be portable to
> whatever hosting posture the contract requires."
> **Do not improvise beyond this.** Do not claim any certification.

**"Where does the data come from in production?"**
> "Three paths, and we'd scope which in the pilot: direct entry by schools and vendors on the
> platform, scheduled import from your existing systems, or a live integration. The pilot is
> how we find out which is right for you — not something we should guess at today."

**"How long to stand this up for a district?"**
> Give a range you can actually meet, and no shorter. Under-promising here costs nothing;
> over-promising ends the relationship at month two.

**"What does it cost?"**
> Have a number. Do not improvise pricing in the room. If you're not ready, say: "I'd rather
> scope the pilot with you and put a real number in writing than guess at one now."

**"Who built this?"**
> "IEP Partners — a Virginia small business, woman-owned, service-disabled veteran-owned,
> registered federal contractor — with our technology partner."
> **Nothing further.** No stack, no tools, no infrastructure. If pressed: "enterprise cloud
> infrastructure, and I'd rather show you what it does than bore you with how it's built."

---

## Rules for the room

1. Never say a number that isn't on the screen or in `02_RESEARCH_AND_SOURCES.md`.
2. Never criticize DARS, a division, or a vendor. The enemy is fragmentation, not people.
3. Never name a real ESO, a real student, or a real staff member.
4. When you don't know, say "I don't know — I'll find out and send it." Then actually send
   it within 48 hours. That follow-through will do more for the pilot than any feature.
5. Stop talking after the ask.
