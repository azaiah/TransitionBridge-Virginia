/**
 * Deterministic seeded PRNG (mulberry32) plus the distributions the generator needs.
 * Same seed → same sequence, every build, every machine.
 * Math.random() is forbidden in this codebase (docs/05_DEMO_DATA.md §1).
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive an independent, reproducible sub-stream from a string key.
 * Lets us re-simulate one referral later without disturbing every other draw —
 * which is what makes the calibration pass in referrals.ts deterministic.
 */
export function subRng(seed: number, key: string): Rng {
  let h = seed >>> 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0;
  }
  return mulberry32(h);
}

/** Uniform integer in [min, max] inclusive. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Uniform float in [min, max). */
export function randFloat(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** True with probability p. */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Pick one element from a non-empty array. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

/** Pick one element using explicit weights. Weights need not sum to 1. */
export function weightedPick<T>(rng: Rng, entries: readonly (readonly [T, number])[]): T {
  let total = 0;
  for (const [, w] of entries) total += w;
  let roll = rng() * total;
  for (const [value, w] of entries) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1]![0];
}

/** Standard normal via Box-Muller, scaled to mean/sd. */
export function normal(rng: Rng, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sd;
}

/**
 * Log-normal with an explicit median. sigma controls the length of the right tail —
 * exactly the shape referral volume and waiting times have in the real world.
 */
export function lognormal(rng: Rng, median: number, sigma: number): number {
  return median * Math.exp(normal(rng, 0, sigma));
}

/** Log-normal, clamped to a sane range so no single draw produces an absurd outlier. */
export function lognormalClamped(
  rng: Rng,
  median: number,
  sigma: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, lognormal(rng, median, sigma)));
}

/** Poisson draw (Knuth). Used for per-quarter referral counts. */
export function poisson(rng: Rng, lambda: number): number {
  if (lambda <= 0) return 0;
  // Knuth's method is stable at the small lambdas we use (< 250).
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > limit);
  return k - 1;
}

/** Fisher-Yates. Returns a new array; does not mutate the input. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Median of a numeric array. Returns null for an empty array. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
    : (sorted[mid] as number);
}
