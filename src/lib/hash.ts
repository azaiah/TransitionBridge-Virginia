/**
 * Stable, seedable randomness for values DERIVED in the browser.
 *
 * Some record-level detail — a student's readiness profile, the documents in their secure
 * folder — is derived on demand from the record rather than shipped, exactly as referral
 * timelines are (src/lib/timeline.ts). Deriving it needs randomness that is identical on
 * every laptop and every build, so it is keyed on the record id, never on Math.random().
 */

/** FNV-1a over a string. 32-bit, unsigned. */
export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  }
  return h >>> 0;
}

/** A small deterministic generator (mulberry32) seeded from a key. Returns 0 ≤ n < 1. */
export function keyedRandom(key: string): () => number {
  let a = hashString(key);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One stable number in [0, 1) for a key. */
export function unitFor(key: string): number {
  return keyedRandom(key)();
}

/** Weighted choice with a caller-supplied random source. */
export function weightedChoice<T>(
  random: () => number,
  entries: readonly (readonly [T, number])[],
): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1]![0];
}
