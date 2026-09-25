'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import placesJson from '@/data/generated/search-places.json';
import { useViewer } from '@/context/useViewer';
import { demoData, getDivisionById } from '@/data';
import { recordHref } from '@/lib/portal';
import {
  expandStudentIndex,
  groupResults,
  searchEntries,
  type SearchEntry,
  type StudentIndexPayload,
} from '@/lib/search';

// Places (divisions, schools, providers, districts) are small and ship with the page, so
// the first keystroke always returns something even if nothing else has loaded yet.
const PLACES = placesJson as unknown as SearchEntry[];

const KIND_LABELS: Record<SearchEntry['kind'], string> = {
  student: 'Student',
  division: 'School division',
  school: 'High school',
  vendor: 'Provider',
  district: 'DARS district',
};

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Nine thousand students are fetched once, the first time somebody uses search.
  const [students, setStudents] = useState<SearchEntry[]>([]);
  const [studentsState, setStudentsState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );

  const loadStudents = useCallback(() => {
    if (studentsState !== 'idle') return;
    setStudentsState('loading');
    import('@/data/generated/search-students.json')
      .then((mod) => {
        setStudents(expandStudentIndex(mod.default as unknown as StudentIndexPayload));
        setStudentsState('ready');
      })
      .catch(() => setStudentsState('error'));
  }, [studentsState]);

  // Warm the student list while the user is reading the page, so search feels instant.
  useEffect(() => {
    const idle = window.setTimeout(loadStudents, 1200);
    return () => window.clearTimeout(idle);
  }, [loadStudents]);

  // The identity layer applies to search too. Students are listed by Transition ID for
  // everyone; only the school (its own division) and the counselor (their district) can
  // find a student by typing a name, and even then the result shows the ID, not the name.
  const { role, persona } = useViewer();
  const viewerStudents = useMemo(() => {
    if (!role) return students.map((s) => ({ ...s, alias: undefined }));
    let nameScope: Set<string> | null = null;
    if (role === 'school_coordinator' && persona) {
      const division = getDivisionById(persona.scopeId);
      nameScope = new Set(division ? [division.name] : []);
    } else if (role === 'dars_counselor' && persona) {
      nameScope = new Set(
        demoData.divisions.filter((d) => d.darsDistrictId === persona.scopeId).map((d) => d.name),
      );
    }
    return students.map((s) => ({
      ...s,
      href: recordHref(role, s.id),
      alias: nameScope && nameScope.has(s.sub) ? s.alias : undefined,
    }));
  }, [students, role, persona]);

  const results = useMemo(
    () => searchEntries([...viewerStudents, ...PLACES], query),
    [viewerStudents, query],
  );
  const groups = useMemo(() => groupResults(results), [results]);
  // Flat order matches what the arrow keys walk through.
  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // "/" focuses search from anywhere, unless the user is already typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Clicking anywhere else closes the results, the way every other search box behaves.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function go(entry: SearchEntry) {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    router.push(entry.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
      return;
    }
    if (flat.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = flat[activeIndex];
      if (entry) go(entry);
    }
  }

  const showPanel = open && query.trim().length >= 2;
  const noMatches = showPanel && flat.length === 0;

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <label className="sr-only" htmlFor="global-search">
        Search by Transition ID, school division, high school, or provider
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
          aria-hidden
        />
        <input
          ref={inputRef}
          id="global-search"
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && flat.length > 0 ? `search-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          value={query}
          placeholder="Search records"
          title="Search a Transition ID, division, school, or provider"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            loadStudents();
            setOpen(true);
          }}
          onKeyDown={onInputKeyDown}
          className="w-full min-w-0 rounded-control border border-line bg-surface-sunken py-2 pl-9 pr-3 text-body text-ink placeholder:text-ink-3 lg:pr-14"
        />
        <kbd
          className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-meta text-ink-3 lg:block"
          aria-hidden
        >
          /
        </kbd>
      </div>

      {/* Result count is announced without stealing focus from the input. */}
      <p className="sr-only" role="status" aria-live="polite">
        {showPanel ? `${flat.length} results for ${query}` : ''}
      </p>

      {showPanel && (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-card border border-line bg-surface p-2 shadow-pop"
        >
          {noMatches ? (
            <div className="px-3 py-4">
              <p className="text-body text-ink">Nothing matches “{query}”.</p>
              <p className="mt-1 text-caption text-ink-2">
                Try a division name, a provider name, or a Transition ID like
                AN-VA-000412.
              </p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Search results" className="space-y-1">
              {groups.map((group) => (
                <li key={group.heading}>
                  <p className="meta-label px-3 pb-1 pt-2">{group.heading}</p>
                  <ul>
                    {group.entries.map((entry) => {
                      const index = flat.indexOf(entry);
                      const isActive = index === activeIndex;
                      return (
                        <li key={`${entry.kind}-${entry.id}`}>
                          <button
                            type="button"
                            id={`search-option-${index}`}
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => go(entry)}
                            className={`flex w-full items-baseline justify-between gap-3 rounded-control px-3 py-2 text-left ${
                              isActive ? 'bg-orange-subtle' : 'hover:bg-surface-sunken'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-body text-ink">
                                {entry.label}
                              </span>
                              <span className="block truncate text-caption text-ink-2">
                                {entry.sub}
                              </span>
                            </span>
                            <span className="shrink-0 text-caption text-ink-3">
                              {KIND_LABELS[entry.kind]}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {studentsState === 'loading' && (
            <p className="px-3 py-2 text-caption text-ink-3">Still loading students…</p>
          )}
          {studentsState === 'error' && (
            <p className="px-3 py-2 text-caption text-ink-2">
              Student records are unavailable right now. Divisions, schools, and providers still
              search normally.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
