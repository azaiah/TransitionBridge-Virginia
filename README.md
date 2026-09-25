# TransitionBridge™ — Virginia Statewide Pre-ETS Referral & Outcomes Platform

**A product of IEP Partners, LLC · Built by DataIsData**

> Every referral. Every student. Every division. One live view.

---

## What this is

TransitionBridge is a statewide referral-intelligence and service-delivery platform for
Virginia's Pre-Employment Transition Services (Pre-ETS) ecosystem. It connects the four
parties that currently cannot see each other:

| Who | What they can't see today | What TransitionBridge gives them |
|---|---|---|
| **DARS counselors & district leadership** | Where referrals are sitting, which schools send none, which vendors have capacity | A live referral queue and district heat map |
| **School transition coordinators** | Whether a referral they sent was ever accepted or served | Submission-to-outcome tracking on every student they refer |
| **Pre-ETS vendors (ESOs)** | Their own performance vs. peers; unmet demand near them | A capacity board, service log, and scorecard |
| **State leadership (DARS / Secretariat)** | A macro view of demand, coverage gaps, and outcomes in real time | A statewide command view with coverage-gap detection |

This repository is the **demonstration environment**. It is a self-contained, fully seeded
showcase built to present to Virginia DARS leadership, school divisions, and state
leadership. It carries realistic synthetic data for all 132 Virginia school divisions and
every DARS district — no live participant data, no PII, no FERPA exposure.

---

## Read these in order

| File | What it covers |
|---|---|
| [`docs/00_START_HERE.md`](docs/00_START_HERE.md) | Orientation, build order, and the one-page summary |
| [`docs/01_PRODUCT_SPEC.md`](docs/01_PRODUCT_SPEC.md) | Every screen, every role, every feature |
| [`docs/02_RESEARCH_AND_SOURCES.md`](docs/02_RESEARCH_AND_SOURCES.md) | The verified research and citations behind every claim |
| [`docs/03_DESIGN_SYSTEM.md`](docs/03_DESIGN_SYSTEM.md) | Tokens, components, layout rules, and the refero.design reference |
| [`docs/04_DATA_MODEL.md`](docs/04_DATA_MODEL.md) | TypeScript types and the full domain model |
| [`docs/05_DEMO_DATA.md`](docs/05_DEMO_DATA.md) | How the synthetic statewide dataset is generated |
| [`docs/06_BUILD_PROMPTS.md`](docs/06_BUILD_PROMPTS.md) | Copy-paste prompts for Claude Code, in order |
| [`docs/07_DEPLOY_NETLIFY.md`](docs/07_DEPLOY_NETLIFY.md) | Deployment |
| [`docs/08_DEMO_SCRIPT.md`](docs/08_DEMO_SCRIPT.md) | The 12-minute live presentation script |
| [`docs/09_OPEN_ITEMS.md`](docs/09_OPEN_ITEMS.md) | What must be resolved before presenting |
| [`docs/10_BRAND_ASSETS.md`](docs/10_BRAND_ASSETS.md) | Logo files, sampled colors, usage rules |
| [`docs/11_USABILITY.md`](docs/11_USABILITY.md) | **Designing for non-technical users — read before every prompt** |
| [`docs/12_IEP_FEEDBACK_UPGRADES.md`](docs/12_IEP_FEEDBACK_UPGRADES.md) | The IEP Partners feedback round: restricted identity, transition record, early warnings, funding, employers, audit log |
| `docs/TransitionBridge-Virginia-Demo-Handout.pdf` | Four-page handout for demo audiences |
| `docs/TransitionBridge-Virginia-Upgrades-Handout.pdf` | Four-page handout covering the feedback-round upgrades |
| [`CLAUDE.md`](CLAUDE.md) | Standing rules for any AI agent working in this repo |

**Repository:** https://github.com/azaiah/TransitionBridge-Virginia

---

## Status

- [x] Prompt 1 — Foundation, design system, data layer
- [x] Prompt 2 — Public site + role selector
- [x] Prompt 3 — Full statewide dataset + validation suite
- [x] Prompt 4 — State leadership command view
- [x] Prompt 5 — DARS counselor workspace
- [x] Prompt 6 — School coordinator workspace
- [x] Prompt 7 — Vendor workspace
- [x] Prompt 8 — Coverage map + report builder
- [x] Prompt 9 — Compliance, reporting, explain-this
- [x] Prompt 10 — Polish, audits, demo mode
- [x] Deployed to Netlify
- [x] IEP Partners feedback round (September 2026) — see `docs/12_IEP_FEEDBACK_UPGRADES.md`

### Before every push

```
npm run generate   # rebuild the synthetic dataset (identical every time)
npm run verify     # typecheck, lint, contrast, tests
npm run assets     # brand images and icons
npm run build      # static export to out/
npm run sweep      # no stack names on any page
```

---

## Confidentiality

Nothing in this repository describing implementation, tooling, or infrastructure is to be
shared with IEP Partners' clients or with any Virginia agency. See [`CLAUDE.md`](CLAUDE.md).
