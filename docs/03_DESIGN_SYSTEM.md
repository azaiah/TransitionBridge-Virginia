# 03 — Design System

## The direction, in one paragraph

TransitionBridge looks like a **warm, confident, precision instrument** — not a government
portal and not a consumer SaaS toy. The canvas is warm cream, cards float in white above it,
and exactly one orange carries every action and accent. Marketing surfaces breathe;
operational dashboards are tight and dense. Type is a clean geometric sans with a single
serif reserved for the largest hero moment. Nothing is gray-on-gray, nothing is neon,
nothing is decorative for its own sake.

The reason this matters commercially: every dashboard DARS leadership has ever been shown is
gray, blue, and cold. Ours will be the only one in their memory that felt made by people who
cared how it looked. That is a real, unfair advantage, and it costs nothing.

**References (from refero.design, as requested):**
- **Harvest** — `https://styles.refero.design/style/1eee9aa2-1e23-4675-9f6e-fb98c93969bd`
  → the warm cream + single orange system, the shape language, the marketing surfaces.
- **ClickUp** — `https://styles.refero.design/style/efcb73cb-b84a-4ae7-9a2b-e1116f79f130`
  → the compact operational density, 4px base unit, pill status badges, hairline elevation.
- Principles: [Dashboard UI Best Practices](https://refero.design/p/dashboard-ui-best-practices/),
  [Dashboard Design Prompts for AI](https://styles.refero.design/ai-agents/dashboard-design-prompts).

Harvest is adapted rather than copied: its orange is shifted to the IEP Partners brand
orange, and the IEP journey palette (bridge-blue → orange → growth-green) is retained as the
**data visualization** palette so charts have a meaningful multi-hue range without breaking
the single-accent discipline in the UI chrome.

---

## 1. Color tokens

> **These values are sampled directly from the IEP Partners logo files**
> (`iep-partners-logo.png`, `iep-bridge.png`, `iep-text.png`), not estimated. The earlier
> build-plan palette (`#E8871E` orange, `#4E9B3F` green, `#10314B` navy) was a reasonable
> guess but is **wrong** against the actual artwork: the real bridge orange is a deeper,
> redder burnt orange, and the real green is olive rather than grass. Use these.

```css
:root {
  /* ---- Brand: sampled from the logo ---- */
  --tb-orange:            #CE5500;  /* THE brand orange — bridge centre. Accents, active state, charts. */
  --tb-orange-deep:       #A84300;  /* button fill when WHITE text sits on it (6.1:1) */
  --tb-orange-bright:     #E8871E;  /* lighter tint — hover glow, washes, viz mid-stop */
  --tb-orange-subtle:     #FBEADB;  /* selected rows, active tab wash, quiet badges */
  --tb-orange-ring:       rgba(206,85,0,0.40);

  /* ---- Surfaces ---- */
  --tb-canvas:            #FBF7F1;  /* page background — warm, NOT white. This is the brand. */
  --tb-surface:           #FFFFFF;  /* cards, tables, panels */
  --tb-surface-sunken:    #F5EFE6;  /* table headers, section bands, inset wells */
  --tb-navy:              #10213C;  /* sampled from the "IEP" wordmark — nav rail, dark panels */
  --tb-navy-soft:         #1B3559;

  /* ---- Text ---- */
  --tb-ink:               #1E2733;  /* primary text — warm near-black, never #000 */
  --tb-ink-2:             #45525F;  /* secondary */
  --tb-ink-3:             #6B7885;  /* tertiary, metadata, helper */
  --tb-ink-disabled:      #9AA4AE;

  /* ---- Borders ---- */
  --tb-border:            #E4DACB;  /* default — warm-tinted, not neutral gray */
  --tb-border-strong:     #CFC2AE;
  --tb-hairline:          #EFE7DA;

  /* ---- Data visualization: the literal bridge gradient, blue → orange → green ---- */
  --tb-viz-1:             #0D4A72;  /* bridge blue    — start / referred      (sampled) */
  --tb-viz-2:             #3C7FA0;
  --tb-viz-3:             #CE5500;  /* bridge orange  — in progress / crossing (sampled) */
  --tb-viz-4:             #E8871E;
  --tb-viz-5:             #3C6D0F;  /* bridge green   — arrived / employed     (sampled) */
  --tb-viz-6:             #6FA33A;
  --tb-viz-neutral:       #B6A992;

  /* ---- Semantic status (paired ALWAYS with text + icon) ---- */
  --tb-ok:                #2F7D32;  --tb-ok-bg:      #E9F3E9;
  --tb-warn:              #B26A00;  --tb-warn-bg:    #FCF0DC;
  --tb-risk:              #B3261E;  --tb-risk-bg:    #FBE9E7;
  --tb-info:              #2C6E8F;  --tb-info-bg:    #E6EFF3;
  --tb-neutral:           #5C6672;  --tb-neutral-bg: #EFEAE2;

  /* ---- Elevation: warm-tinted only ---- */
  --tb-shadow-sm:  0 1px 2px rgba(30,39,51,0.06);
  --tb-shadow-md:  0 2px 8px rgba(30,39,51,0.08);
  --tb-shadow-lg:  0 6px 24px rgba(232,135,30,0.16);   /* the warm brand glow */
  --tb-shadow-pop: 0 12px 40px rgba(30,39,51,0.14);    /* modals, command palette */
}
```

### Colour rules
1. **Never use `#FFFFFF` as the page background.** The cream canvas is the identity.
2. **One accent only.** Orange is actions, active states, and brand. It is never body text,
   never a large fill, never decoration.
3. **Never encode meaning in color alone.** Every status carries color + text + icon.
   Non-negotiable — this is a disability services product.
4. **Warm borders and warm shadows.** A cold gray border against cream reads as a mistake.
5. **Verified vs. illustrative:** verified figures may carry a small orange source marker;
   illustrative figures live inside the demonstration-data frame. Never style them alike.

### Contrast verification (computed from the sampled values, not estimated)
| Pair | Ratio | Verdict |
|---|---|---|
| `--tb-ink` #1E2733 on `--tb-canvas` #FBF7F1 | **14.1 : 1** | ✓ body text |
| `#FFFFFF` on `--tb-navy` #10213C | **16.1 : 1** | ✓ nav rail |
| `#FFFFFF` on `--tb-orange-deep` #A84300 | **6.1 : 1** | ✓ **primary button** |
| `#FFFFFF` on `--tb-viz-1` #0D4A72 | **9.4 : 1** | ✓ |
| `#FFFFFF` on `--tb-viz-5` #3C6D0F | **6.2 : 1** | ✓ |
| `--tb-ink-3` #6B7885 on `--tb-surface` #FFFFFF | **4.5 : 1** | ✓ metadata — do not go lighter |
| `#FFFFFF` on `--tb-orange` #CE5500 | **4.3 : 1** | ⚠ large/bold text only (≥18.66px) |
| `--tb-ink` #1E2733 on `--tb-orange` #CE5500 | **3.5 : 1** | ✗ fails for normal text |
| `#FFFFFF` on `--tb-orange-bright` #E8871E | **2.7 : 1** | ✗ **never put text on this** |

> ⚠️ **The rule that follows from this:** the primary button fill is `--tb-orange-deep`
> (#A84300) with white text at 6.1:1. `--tb-orange` (#CE5500) is the brand accent — borders,
> icons, active indicators, chart series, underlines — and carries text only at ≥18.66px bold.
> `--tb-orange-bright` (#E8871E) is decorative only: glows, washes, hover states, and one
> data-viz stop. **No text ever sits on it.** Recompute any new pairing; do not eyeball it.

### The bridge gradient
The logo is literally a blue → orange → green gradient. Reproduce it exactly once, as the
section divider rule and the funnel/journey chart progression:
```css
--tb-bridge: linear-gradient(90deg, #0D4A72 0%, #CE5500 50%, #3C6D0F 100%);
```
Once per page. It's a signature, not a pattern.

---

## 2. Typography

```css
--tb-font-sans:  'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--tb-font-serif: 'Fraunces', 'GT Super', Georgia, serif;   /* hero display ONLY */
--tb-font-mono:  'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

- **Inter** carries everything functional: nav, tables, labels, body, all headings ≤ 40px.
  Enable tabular figures (`font-variant-numeric: tabular-nums`) on **every** numeric column
  and KPI value. Non-aligned digits in a data table look amateur instantly.
- **Fraunces** appears only in the marketing hero (56–72px). One moment of warmth, then
  discipline. Never in the product UI.
- **JetBrains Mono** for identifiers, reference codes, and 10–11px uppercase meta labels
  with `letter-spacing: 0.08em`.

### Scale
| Role | Size / LH / Weight | Where |
|---|---|---|
| `display` | 64 / 1.1 / 400 serif | Marketing hero only |
| `h1` | 40 / 1.15 / 600 | Page titles |
| `h2` | 28 / 1.2 / 600 | Section titles |
| `h3` | 20 / 1.3 / 600 | Card titles |
| `body` | 15 / 1.55 / 400 | Default UI body |
| `body-lg` | 17 / 1.6 / 400 | Marketing body |
| `label` | 13 / 1.4 / 500 | Form labels, table headers |
| `caption` | 12 / 1.4 / 400 | Metadata, helper text |
| `meta` | 10 / 1.3 / 500 mono, +0.08em, uppercase | Eyebrows, status micro-labels |
| `kpi` | 34 / 1.0 / 650, tabular | KPI tile values |
| `kpi-lg` | 48 / 1.0 / 650, tabular | Hero statistics |

---

## 3. Space, shape, density

**Base unit: 4px.** Every padding and margin snaps to a multiple of 4.

### Two densities — this is the core structural decision
| | Marketing (`comfortable`) | Product (`compact`) |
|---|---|---|
| Section gap | 80px | 32px |
| Card padding | 32–40px | 16–20px |
| Element gap | 20–24px | 8–12px |
| Table row height | — | 40px (44px touch) |
| Max width | 1200px | fluid to 1680px |

Dashboards must feel like **tools**, not brochures. If a dashboard looks like the landing
page, it is wrong. Refero's guidance is exact on this: a dashboard that photographs well can
still be slow to use — optimize for scanning speed.

### Radius
| Element | Value |
|---|---|
| Cards, panels | 16px |
| Buttons, inputs, selects | 10px |
| Table containers | 12px |
| Status pills, chips, tags | 999px |
| Modals | 20px |
| Map regions | native |

Pills are fully round; everything else is softly round. Do not mix radii within a tier.

### Layout
- **Marketing:** centered 1200px, full-bleed cream.
- **Product:** persistent left nav rail (240px, collapsible to 64px, `--tb-navy`) + fluid
  content to 1680px + optional 360px right detail drawer that slides rather than navigates.
  Keeping context while inspecting a record is what makes the tool feel fast.
- **Grid:** 12-column, 24px gutter (16px in compact).
- **Breakpoints:** 390 / 768 / 1024 / 1440 / 1680.
  Below 1024 the nav rail becomes a bottom bar and tables become stacked record cards —
  never a horizontally scrolling table on mobile.

---

## 4. Components

### 4.1 Button
| Variant | Fill | Text | Border |
|---|---|---|---|
| Primary | `--tb-orange` | `--tb-ink` | none |
| Secondary | `--tb-surface` | `--tb-ink` | 1px `--tb-border-strong` |
| Ghost | transparent | `--tb-ink-2` | none |
| Danger | `--tb-risk-bg` | `--tb-risk` | 1px `--tb-risk` |

10px radius · 15px/600 label · padding 10px 18px (compact: 8px 14px, 14px label) ·
focus ring 2px `--tb-orange-ring` at 2px offset, always visible, never removed.

### 4.2 Status pill
999px radius · 11px/600 · padding 3px 10px · **icon + text + tinted background**.
Fixed vocabulary — do not invent new statuses:

| Status | Token | Icon |
|---|---|---|
| New | info | ● |
| Under review | warn | ◐ |
| Awaiting consent | warn | ✎ |
| Ready to assign | info | ▲ |
| Assigned | info | → |
| In service | ok | ▶ |
| Completed | ok | ✓ |
| Closed — not served | neutral | ✕ |
| Overdue | risk | ! |

### 4.3 KPI tile
White surface · 16px radius · 1px `--tb-border` · 20px padding · `--tb-shadow-sm`.
Structure top to bottom: `meta` label → `kpi` value (tabular) → delta row (arrow + tabular
number + **text** direction) → 40px sparkline. Whole tile is a link.
An alerting tile gains a 3px left border in the semantic color plus an icon — never a
color-only change.

### 4.4 Data table
- Sticky header, `--tb-surface-sunken`, `label` type, sortable with a visible indicator.
- 40px rows, 1px `--tb-hairline` separators, hover `--tb-orange-subtle` at 40%.
- Numeric columns right-aligned, tabular figures.
- Row selection via checkbox column; selection opens a bulk action bar.
- Virtualize above 100 rows.
- Every table: column visibility toggle, CSV export, result count, and a designed empty state.
- Below 1024px the table becomes stacked cards.

### 4.5 Chart
Every chart is wrapped in a `<ChartFrame>` providing: title, `?` explain affordance, legend,
**"View as table"** toggle rendering a real `<table>`, and CSV download.
No chart may exist outside this frame. Palette `--tb-viz-1..6`. Gridlines `--tb-hairline`.
Axis labels `caption` in `--tb-ink-3`. Tooltips: white, 10px radius, `--tb-shadow-md`,
tabular figures.

### 4.6 Demonstration-data banner
Full width under the top bar. `--tb-orange-subtle` background, 1px `--tb-orange` bottom
border, `--tb-ink` text, info icon, and a **View sources** link. Confident, not apologetic.
Collapses to a single-line chip on scroll but never disappears entirely.

### 4.7 Role switcher
Top-right. Shows current role and synthetic persona. Opens a menu of the four roles with
one-line descriptions. Switching animates a brief crossfade so the audience registers that
the perspective changed — this is a designed presentation moment, not just a state change.

### 4.8 Alert row
Left border 3px semantic · icon · plain-language sentence · age chip · owner chip ·
`→ View records` action. Never a bare colored box with a number in it.

---

## 5. Motion

| Interaction | Duration | Easing |
|---|---|---|
| Hover / focus | 120ms | ease-out |
| Panel / drawer | 240ms | cubic-bezier(0.32, 0.72, 0, 1) |
| Chart entrance | 400ms staggered 40ms | ease-out |
| Role switch crossfade | 320ms | ease-in-out |
| Map layer change | 300ms | ease-in-out |

One continuous animation per viewport maximum. Under `prefers-reduced-motion: reduce`,
all of the above become instant — not shortened. Charts render in final state.

---

## 6. Iconography & imagery

- Single icon set, outline, 1.5px stroke, 20px default / 16px compact. `--tb-ink-2` at rest.
- **No stock photography anywhere.** Product UI is the imagery — screenshots of the real
  dashboards floating in white cards over the cream canvas with a warm glow shadow.
- The bridge motif appears once, as a subtle blue→orange→green gradient rule used as a
  section divider. Once. It is a signature, not a pattern.
- Partner and certification logos in grayscale so nothing competes with the orange.

---

## 7. Anti-patterns — reject these on sight

- White page background
- A second accent color introduced "for variety"
- Status shown as a colored dot with no text
- A chart with no accessible table
- Gray-on-gray "enterprise" styling
- Airy, marketing-density dashboards
- Non-tabular figures in a numeric column
- Cold gray borders or blue-tinted shadows on the cream canvas
- Any technology, framework, or host name visible to a user
- Invented statistics presented with the same treatment as sourced ones
