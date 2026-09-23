/**
 * Global search — ranking rules, kept as pure functions so they can be unit tested.
 *
 * The rules are deliberately simple, because a person typing "portsm" in a meeting wants
 * Portsmouth at the top and does not care about fuzzy matching. Exact beats prefix, prefix
 * beats word-start, word-start beats anywhere.
 */

export type SearchKind = 'student' | 'division' | 'school' | 'vendor' | 'district';

export interface SearchEntry {
  kind: SearchKind;
  id: string;
  /** What the user reads first — a name. */
  label: string;
  /** The line underneath: where it sits, so two similar names are tellable apart. */
  sub: string;
  href: string;
}

/** How the student slice of the index is stored on disk. See scripts/lib/search-index.ts. */
export interface StudentIndexPayload {
  idPrefix: string;
  divisions: string[];
  /** [display name, id without the shared prefix, index into `divisions`] */
  rows: [string, string, number][];
}

/** Rebuild full search entries from the compact student payload. */
export function expandStudentIndex(payload: StudentIndexPayload): SearchEntry[] {
  return payload.rows.map(([name, idSuffix, divisionIdx]) => {
    const id = `${payload.idPrefix}${idSuffix}`;
    const division = payload.divisions[divisionIdx] ?? 'Unknown division';
    return {
      kind: 'student',
      id,
      label: name,
      sub: `${id} · ${division}`,
      href: `/dars/students/detail/?id=${id}`,
    };
  });
}

/** Plain-English group headings, in the order results are shown. */
export const SEARCH_GROUPS: { kind: SearchKind; heading: string }[] = [
  { kind: 'student', heading: 'Students' },
  { kind: 'division', heading: 'School divisions' },
  { kind: 'school', heading: 'High schools' },
  { kind: 'vendor', heading: 'Providers' },
  { kind: 'district', heading: 'DARS districts' },
];

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * 0 means no match. Higher is better. Matching the id exactly wins outright, because
 * somebody pasting a record number wants that record and nothing else.
 */
export function scoreEntry(entry: SearchEntry, query: string): number {
  const q = normalize(query);
  if (q.length === 0) return 0;

  const label = normalize(entry.label);
  const id = normalize(entry.id);
  const sub = normalize(entry.sub);

  if (id === q) return 100;
  if (label === q) return 90;
  if (label.startsWith(q)) return 70;
  if (label.includes(` ${q}`)) return 50; // start of any word in the name
  if (label.includes(q)) return 30;
  if (id.includes(q)) return 20;
  if (sub.includes(q)) return 10;
  return 0;
}

/**
 * Top matches, best first, alphabetical within an equal score so results never reshuffle
 * between keystrokes for no visible reason.
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string,
  limit = 12,
): SearchEntry[] {
  if (normalize(query).length < 2) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of entries) {
    const score = scoreEntry(entry, query);
    if (score > 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label));
  return scored.slice(0, limit).map((s) => s.entry);
}

/**
 * Results grouped for display. Groups appear in the order their best match appeared, so
 * typing a division name puts School divisions at the top rather than burying it under
 * every student who happens to attend there.
 */
export function groupResults(
  results: SearchEntry[],
): { heading: string; entries: SearchEntry[] }[] {
  const headingFor = new Map(SEARCH_GROUPS.map((g) => [g.kind, g.heading]));
  const groups: { heading: string; entries: SearchEntry[] }[] = [];

  for (const result of results) {
    const heading = headingFor.get(result.kind) ?? 'Other';
    const existing = groups.find((g) => g.heading === heading);
    if (existing) existing.entries.push(result);
    else groups.push({ heading, entries: [result] });
  }

  return groups;
}
