'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Eye, PenLine } from 'lucide-react';
import { getPersonaById } from '@/data';
import { formatFullDate } from '@/lib/dates';
import type { RecordAuditEntry } from '@/lib/record-audit';
import { ACCESS_ACTIONS, AUDIT_ACTION_LABELS, REFUSAL_ACTIONS } from '@/lib/audit';
import { formatSessionTime, type AuditEvent } from '@/lib/session-store';
import { cn } from '@/lib/utils';
import { RecordCard } from './RecordCard';

type Filter = 'all' | 'access' | 'change';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'access', label: 'Who looked' },
  { id: 'change', label: 'What changed' },
];


function actorLabel(personaId: string): string {
  const persona = getPersonaById(personaId);
  return persona ? `${persona.displayName}, ${persona.title}` : 'Recorded automatically';
}

interface Row {
  id: string;
  when: string;
  whenTitle: string;
  sortKey: number;
  actor: string;
  action: string;
  subject: string;
  reason?: string;
  kind: 'access' | 'change';
  live: boolean;
  refused: boolean;
}

/**
 * Who did what on this record, newest first: every view, every upload, every name shown,
 * every change — with a reason where one was given. This session's actions appear at the
 * top, marked, so a presenter can act and immediately show it recorded.
 */
export function AuditPanel({
  history,
  liveEvents,
}: {
  history: RecordAuditEntry[];
  liveEvents: AuditEvent[];
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(15);

  const rows: Row[] = useMemo(() => {
    const live: Row[] = liveEvents.map((e) => ({
      id: e.id,
      when: formatSessionTime(e.at),
      whenTitle: new Date(e.at).toLocaleString(),
      // Session actions happened "now", so they sort above everything derived.
      sortKey: Number.MAX_SAFE_INTEGER - (Date.now() - Date.parse(e.at)),
      actor: actorLabel(e.actorPersonaId),
      action: AUDIT_ACTION_LABELS[e.action],
      subject: e.subject,
      reason: e.reason,
      kind: ACCESS_ACTIONS.has(e.action) ? 'access' : 'change',
      live: true,
      refused: REFUSAL_ACTIONS.has(e.action),
    }));
    const past: Row[] = history.map((h) => ({
      id: h.id,
      when: formatFullDate(h.at),
      whenTitle: h.at,
      sortKey: Date.parse(h.at),
      actor: actorLabel(h.actorPersonaId),
      action: h.action,
      subject: h.subject,
      reason: h.reason,
      kind: h.kind,
      live: false,
      refused: Boolean(h.refused),
    }));
    return [...live, ...past].sort((a, b) => b.sortKey - a.sortKey);
  }, [history, liveEvents]);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.kind === filter);
  const visible = filtered.slice(0, limit);

  return (
    <RecordCard
      id="audit"
      coach="audit"
      title="Audit trail"
      description="Who did what on this record, and when. Nothing here can be edited or deleted."
    >
      <div role="group" aria-label="Filter the audit trail" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-pill border px-3 py-1 text-caption',
              filter === f.id ? 'border-orange-deep bg-orange-subtle text-ink' : 'border-line text-ink-2 hover:bg-surface-sunken',
            )}
          >
            {f.label}
          </button>
        ))}
        <p className="self-center text-caption text-ink-3" aria-live="polite">
          {filtered.length.toLocaleString()} entries
        </p>
      </div>

      <ol className="mt-4 divide-y divide-line-hair">
        {visible.map((row) => {
          const Icon = row.refused ? AlertTriangle : row.kind === 'access' ? Eye : PenLine;
          return (
            <li key={row.id} className={cn('flex gap-3 py-2.5', row.live && 'rounded-control bg-orange-subtle/50 px-2')}>
              <Icon
                className={cn('mt-0.5 h-4 w-4 shrink-0', row.refused ? 'text-warn' : 'text-ink-3')}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-body text-ink">
                  <span className="font-medium">{row.action}</span>
                  <span className="text-ink-2"> — {row.subject}</span>
                </p>
                <p className="text-caption text-ink-2">
                  {row.actor} · <time title={row.whenTitle}>{row.when}</time>
                  {row.live && <span className="font-medium text-ink"> · this session</span>}
                </p>
                {row.reason && <p className="text-caption text-ink-3">Reason: {row.reason}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + 25)}
          className="mt-3 text-label font-medium text-orange-deep underline underline-offset-2"
        >
          Show {Math.min(25, filtered.length - limit)} more
        </button>
      )}
    </RecordCard>
  );
}
