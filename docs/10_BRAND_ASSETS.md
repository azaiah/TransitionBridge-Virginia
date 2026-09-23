# 10 — Brand Assets

## Files and where they go

Copy these four files from
`C:\Users\azaia\Videos\Captures\Gedji\Logos\Gedji PNG.s\DataIsData\Clients\IEP Partners\IEP Concept Logos\`
into `public/brand/` in the repo, renamed as below. Use these exact names — the build
prompts reference them.

| Source file | Rename to | Used for |
|---|---|---|
| `iep-partners-logo.png` | `iep-lockup.png` | Full lockup (bridge + wordmark) — marketing hero, print/PDF header, `/enter` screen |
| `iep-bridge.png` | `iep-mark.png` | Bridge only — favicon, nav rail collapsed state, app icon, social card |
| `iep-text.png` | `iep-wordmark.png` | Wordmark only — top bar, footer, anywhere the mark is too tall |
| — | `iep-mark-mono.svg` | **To be produced** — see §3 |

Add a `public/brand/README.txt` noting these are IEP Partners' marks, used under the
DataIsData engagement, and are not to be modified or recolored.

---

## Colors sampled from the artwork

These were read pixel-by-pixel out of the logo files, not estimated. They supersede the
palette in the original build plan.

| Role | Hex | Where it came from |
|---|---|---|
| Bridge blue | `#0D4A72` | Left span of the bridge |
| Bridge orange | `#CE5500` | Centre span — **the brand orange** |
| Bridge green | `#3C6D0F` | Right span |
| Wordmark navy | `#10213C` | The "IEP" |
| Wordmark green | `#3C6D0F` | The "PARTNERS" |
| Gold undertone | `#917602` | Water reflection — decorative only, not a UI color |

**The original build plan was wrong on two of three.** It assumed `#E8871E` orange,
`#4E9B3F` green, and `#10314B` navy. The real orange is materially deeper and redder; the
real green is olive, not grass. Only the navy was close. `03_DESIGN_SYSTEM.md` has been
corrected and the contrast table recomputed against the true values.

`#E8871E` is retained in the system as `--tb-orange-bright` — a decorative tint for glows,
washes, and hover states. **No text sits on it at any size.**

---

## Logo usage rules

1. **Clear space** — minimum half the mark's height on all sides. The bridge needs room.
2. **Minimum size** — lockup 140px wide; mark alone 32px; wordmark 100px. Below that the
   figures on the bridge turn to mush.
3. **Never** recolor, add effects to, rotate, stretch, or place the logo on a busy background.
4. **Backgrounds** — the artwork is designed for light. On `--tb-canvas` and `--tb-surface`
   it sits naturally. On `--tb-navy` (the nav rail), use the mono version (§3), never the
   full-color PNG.
5. **Pairing with DataIsData** — the DataIsData mark appears **only** on internal documents
   and invoices, never in the product UI or on any surface a Virginia agency sees. IEP
   Partners is the vendor of record.

### The DataIsData mark
Source: `C:\Users\azaia\Videos\Captures\Gedji\Logos\Gedji PNG.s\DataIsData\dataisdata icon.png`

**Do not copy this file into `public/`.** If it lives in the deployed site's asset folder,
someone will eventually find it, and the whole point of the vendor-of-record positioning is
that IEP Partners is the name on the platform.

Its correct homes are: internal build documentation, the SOW and invoices, and the branded
HTML client-update deliverable for Rhonda and Michelle. Nowhere a Virginia agency looks.

If a co-branded surface is ever genuinely wanted, that is a decision for Tony and a
conversation with IEP Partners — not a default, and not something to slip into a footer.

---

## 3. What still needs producing

The PNGs are raster and have a visible white matte. Two things to fix before the demo:

- **`iep-mark-mono.svg`** — a single-color version of the bridge for the dark nav rail and
  for the favicon at 16px. A flat white silhouette is fine. Without it, the collapsed nav
  rail will show a white-boxed PNG against navy, which looks broken.
- **Transparent-background versions.** The current files carry a white matte that will show
  as a rectangle against the cream canvas. Either export with alpha or key out the white.
  This is a five-minute job and it's the difference between polished and homemade.

If SVG originals exist anywhere, use those instead of any of the above — vector will hold up
on a projector where a 544px-wide PNG will not.

---

## Favicon and social

- Favicon: `iep-mark.png` → 32×32 and 16×16 ICO, plus a 180×180 apple-touch-icon.
- Open Graph image, 1200×630: cream `#FBF7F1` background, lockup centered, the bridge
  gradient rule beneath it, and the words *TransitionBridge — Virginia Statewide Pre-ETS
  Referral & Outcomes Platform*. This is what appears when the demo link is pasted into an
  email to a Commissioner, so it's worth building properly rather than letting it default.
