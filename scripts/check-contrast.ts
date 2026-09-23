/**
 * WCAG contrast checker for every foreground/background pair used in the app.
 * Run: `npm run contrast`
 * Fails (exit 1) if any body-text pair is below 4.5:1 or large text below 3:1.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

type Pair = {
  name: string;
  fg: string;
  bg: string;
  /** Minimum required ratio. 4.5 for body, 3 for large/bold UI. */
  min: number;
  large?: boolean;
};

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(parseHex(fg));
  const l2 = relativeLuminance(parseHex(bg));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Extract hex tokens from globals.css custom properties. */
function loadTokens(): Record<string, string> {
  const css = readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
  const tokens: Record<string, string> = {};
  const re = /--(tb-[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    tokens[m[1] as string] = (m[2] as string).toUpperCase();
  }
  return tokens;
}

function t(tokens: Record<string, string>, key: string): string {
  const v = tokens[key];
  if (!v) throw new Error(`Missing token ${key}`);
  return v;
}

function main(): void {
  const tokens = loadTokens();

  const pairs: Pair[] = [
    { name: 'Body text on canvas', fg: t(tokens, 'tb-ink'), bg: t(tokens, 'tb-canvas'), min: 4.5 },
    { name: 'Body text on surface', fg: t(tokens, 'tb-ink'), bg: t(tokens, 'tb-surface'), min: 4.5 },
    { name: 'Secondary text on canvas', fg: t(tokens, 'tb-ink-2'), bg: t(tokens, 'tb-canvas'), min: 4.5 },
    { name: 'Tertiary text on canvas', fg: t(tokens, 'tb-ink-3'), bg: t(tokens, 'tb-canvas'), min: 4.5 },
    { name: 'Disabled text on surface', fg: t(tokens, 'tb-ink-disabled'), bg: t(tokens, 'tb-surface'), min: 4.5 },
    { name: 'Primary button text', fg: '#FFFFFF', bg: t(tokens, 'tb-orange-deep'), min: 4.5 },
    { name: 'Nav text primary', fg: t(tokens, 'tb-ink-on-navy'), bg: t(tokens, 'tb-navy'), min: 4.5 },
    { name: 'Nav text secondary', fg: t(tokens, 'tb-ink-on-navy-2'), bg: t(tokens, 'tb-navy'), min: 4.5 },
    { name: 'Link / accent on canvas', fg: t(tokens, 'tb-orange-deep'), bg: t(tokens, 'tb-canvas'), min: 4.5 },
    { name: 'OK status text', fg: t(tokens, 'tb-ok'), bg: t(tokens, 'tb-ok-bg'), min: 4.5 },
    { name: 'Warn status text', fg: t(tokens, 'tb-warn'), bg: t(tokens, 'tb-warn-bg'), min: 4.5 },
    { name: 'Risk status text', fg: t(tokens, 'tb-risk'), bg: t(tokens, 'tb-risk-bg'), min: 4.5 },
    { name: 'Info status text', fg: t(tokens, 'tb-info'), bg: t(tokens, 'tb-info-bg'), min: 4.5 },
    { name: 'KPI value (large)', fg: t(tokens, 'tb-ink'), bg: t(tokens, 'tb-surface'), min: 3, large: true },
    { name: 'Meta label on surface', fg: t(tokens, 'tb-ink-3'), bg: t(tokens, 'tb-surface'), min: 4.5 },
    { name: 'Table header on sunken', fg: t(tokens, 'tb-ink-2'), bg: t(tokens, 'tb-surface-sunken'), min: 4.5 },
    { name: 'Border on canvas (UI)', fg: t(tokens, 'tb-border-strong'), bg: t(tokens, 'tb-canvas'), min: 3, large: true },
    // Added in the prompt-10 audit: pairings introduced by search, the bottom bar, and chips.
    { name: 'Accent on surface (bottom bar)', fg: t(tokens, 'tb-orange-deep'), bg: t(tokens, 'tb-surface'), min: 4.5 },
    { name: 'Body text on search highlight', fg: t(tokens, 'tb-ink'), bg: t(tokens, 'tb-orange-subtle'), min: 4.5 },
    { name: 'Secondary text on search highlight', fg: t(tokens, 'tb-ink-2'), bg: t(tokens, 'tb-orange-subtle'), min: 4.5 },
    { name: 'Tertiary text on surface (kbd hint)', fg: t(tokens, 'tb-ink-3'), bg: t(tokens, 'tb-surface'), min: 4.5 },
    { name: 'Body text on sunken (cards, chips)', fg: t(tokens, 'tb-ink'), bg: t(tokens, 'tb-surface-sunken'), min: 4.5 },
    { name: 'Secondary text on sunken', fg: t(tokens, 'tb-ink-2'), bg: t(tokens, 'tb-surface-sunken'), min: 4.5 },
    { name: 'Coach mark ring on surface', fg: t(tokens, 'tb-orange'), bg: t(tokens, 'tb-surface'), min: 3, large: true },
  ];

  console.log('\nWCAG contrast table — TransitionBridge design tokens\n');
  console.log('Pair'.padEnd(36) + 'Ratio'.padStart(8) + '  Min'.padStart(6) + '  Pass');
  console.log('-'.repeat(58));

  let failed = 0;
  for (const p of pairs) {
    const ratio = contrastRatio(p.fg, p.bg);
    const pass = ratio >= p.min;
    if (!pass) failed++;
    console.log(
      p.name.padEnd(36) +
        ratio.toFixed(2).padStart(8) +
        p.min.toFixed(1).padStart(6) +
        (pass ? '  ✓' : '  ✗ FAIL'),
    );
  }

  console.log('-'.repeat(58));
  console.log(`\n${pairs.length - failed}/${pairs.length} pairs pass.\n`);

  if (failed > 0) {
    console.error(`${failed} pair(s) below WCAG threshold. Fix tokens before shipping.`);
    process.exit(1);
  }
}

main();
