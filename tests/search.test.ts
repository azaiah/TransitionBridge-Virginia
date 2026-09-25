import { describe, expect, it } from 'vitest';
import {
  expandStudentIndex,
  groupResults,
  scoreEntry,
  searchEntries,
  type SearchEntry,
} from '@/lib/search';

const entries: SearchEntry[] = [
  {
    kind: 'division',
    id: 'portsmouth-city-public-schools',
    label: 'Portsmouth City Public Schools',
    sub: 'Hampton Roads District',
    href: '/state/divisions/?find=Portsmouth%20City%20Public%20Schools',
  },
  {
    kind: 'school',
    id: 'school-1',
    label: 'Churchland High School',
    sub: 'Portsmouth City Public Schools',
    href: '/state/divisions/?find=Portsmouth%20City%20Public%20Schools',
  },
  {
    kind: 'vendor',
    id: 'vendor-4',
    label: 'Tidewater Employment Partners',
    sub: 'Serves 6 localities',
    href: '/state/vendors/?find=Tidewater%20Employment%20Partners',
  },
  {
    kind: 'student',
    id: 'DEMO-STU-000412',
    label: 'Avery Brooks',
    sub: 'DEMO-STU-000412 · Portsmouth City Public Schools',
    href: '/dars/students/detail/?id=DEMO-STU-000412',
  },
];

describe('scoreEntry', () => {
  it('ranks an exact id above everything else', () => {
    const student = entries[3]!;
    expect(scoreEntry(student, 'DEMO-STU-000412')).toBe(100);
  });

  it('ranks a name the user started typing above one that merely contains the word', () => {
    const division = entries[0]!; // starts with "Portsmouth"
    const school = entries[1]!; // "Portsmouth" only in the sub line
    expect(scoreEntry(division, 'portsm')).toBeGreaterThan(scoreEntry(school, 'portsm'));
  });

  it('matches the start of any word inside a name', () => {
    const vendor = entries[2]!;
    expect(scoreEntry(vendor, 'employment')).toBe(50);
  });

  it('returns zero when nothing matches', () => {
    expect(scoreEntry(entries[0]!, 'zzzz')).toBe(0);
  });
});

describe('searchEntries', () => {
  it('ignores queries shorter than two characters, so one keystroke does not dump the index', () => {
    expect(searchEntries(entries, 'p')).toEqual([]);
  });

  it('puts the best match first', () => {
    const results = searchEntries(entries, 'portsmouth');
    expect(results[0]?.label).toBe('Portsmouth City Public Schools');
  });

  it('respects the result limit', () => {
    expect(searchEntries(entries, 'portsmouth', 1)).toHaveLength(1);
  });
});

describe('groupResults', () => {
  it('leads with the group holding the best match and drops empty groups', () => {
    const groups = groupResults(searchEntries(entries, 'portsmouth'));
    expect(groups[0]?.heading).toBe('School divisions');
    expect(groups.map((g) => g.heading)).not.toContain('Providers');
  });
});

describe('expandStudentIndex', () => {
  it('labels students by Transition ID and keeps the name only as a hidden alias', () => {
    const [entry] = expandStudentIndex({
      idPrefix: 'DEMO-STU-',
      divisions: ['Portsmouth City Public Schools'],
      schools: ['Portsmouth Churchland High School'],
      rows: [['Avery Brooks', '000412', 0, 0]],
    });

    expect(entry).toEqual({
      kind: 'student',
      id: 'DEMO-STU-000412',
      label: 'PC-VA-000412',
      sub: 'Portsmouth City Public Schools',
      href: '/dars/students/detail/?id=DEMO-STU-000412',
      alias: 'Avery Brooks',
    });
  });

  it('finds a student by name only through the alias, below an exact id', () => {
    const [entry] = expandStudentIndex({
      idPrefix: 'DEMO-STU-',
      divisions: ['Portsmouth City Public Schools'],
      schools: ['Portsmouth Churchland High School'],
      rows: [['Avery Brooks', '000412', 0, 0]],
    });
    expect(scoreEntry(entry!, 'avery')).toBe(45);
    expect(scoreEntry({ ...entry!, alias: undefined }, 'avery')).toBe(0);
    expect(scoreEntry(entry!, 'PC-VA-000412')).toBe(90);
  });
});
