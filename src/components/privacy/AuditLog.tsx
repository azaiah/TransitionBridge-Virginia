'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Download, Eye, FileText, FolderOpen, PenLine, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ROLE_NAMES } from '@/context/useViewer';
import { getPersonaById } from '@/data';
import { auditHistory } from '@/data/audit-history';
import type { AuditAction, AuditEvent, Role } from '@/data/types';
import { AUDIT_ACTION_LABELS, REFUSAL_ACTIONS } from '@/lib/audit';
import { formatDateTime } from '@/lib/dates';
import { formatSessionTime, resetSessionActivity, useAuditLog } from '@/lib/session-store';
import { cn } from '@/lib/utils';

type Group = 'all' | 'identity' | 'documents' | 'downloads' | 'refusals' | 'changes';

const GROUPS: { id: Group; label: string; actions: AuditAction[] | null }[] = [
  { id: 'all', label: 'Everything', actions: null },
  { id: 'identity', label: 'Names and records opened', actions: ['NAME_VIEWED', 'RECORD_OPENED'] },
  { id: 'documents', label: 'Documents', actions: ['DOCUMENT_VIEWED', 'DOCUMENT_ADDED', 'DOCUMENT_DOWNLOADED'] },
  { id: 'downloads', label: 'Downloads', actions: ['EXPORT_DOWNLOADED'] },
  { id: 'refusals', label: 'Refused', actions: ['EXPORT_REFUSED', 'DOCUMENT_REFUSED', 'RECORD_REFUSED', 'SERVICE_REFUSED'] },
  { id: 'changes', label: 'Changes', actions: ['AUTHORIZATION_EXTENDED', 'SERVICE_LOGGED', 'JOB_SHARED', 'DOCUMENT_ADDED'] },
];

const ROLE_FILTERS: { id: Role | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Everyone' },
  { id: 'state_leadership', label: 'State leadership' },
  { id: 'dars_counselor', label: 'DARS counselors' },
  { id: 'school_coordinator', label: 'School coordinators' },
  { id: 'vendor', label: 'Providers' },
];

const RECORDED = [
  { icon: Eye, text: 'Every time a student’s name is shown — who, when, and why.' },
  { icon: FileText, text: 'Every document opened, added, or downloaded, and by whom.' },
  { icon: Download, text: 'Every list downloaded, with its size and the reason given.' },
  { icon: AlertTriangle, text: 'Every refusal: a blocked download, a record outside someone’s caseload, a service over its authorization.' },
  { icon: PenLine, text: 'Every change to an authorization, with the reason.' },
];

const PAGE = 50;

interface Row {
  event: AuditEvent;
  live: boolean;
}

/**
 * The statewide access and audit log — "who did what". It opens on the month before the
 * demonstration (built from the same synthetic records every other screen shows), and
 * anything done in this browser during the demonstration appears at the top, marked, a
 * moment later.
 */
export function AuditLog() {
  const liveEvents = useAuditLog();
  const [group, setGroup] = useState<Group>('all');
  const [who, setWho] = useState<Role | 'ALL'>('ALL');
  const [limit, setLimit] = useState(PAGE);
  const [confirming, setConfirming] = useState(false);

  const rows: Row[] = useMemo(
    () => [
      ...liveEvents.map((event) => ({ event, live: true })),
      ...auditHistory.map((event) => ({ event, live: false })),
    ],
    [liveEvents],
  );

  const filtered = useMemo(() => {
    const actions = GROUPS.find((g) => g.id === group)?.actions;
    return rows.filter(
      ({ event }) =>
        (!actions || actions.includes(event.action)) && (who === 'ALL' || event.actorRole === who),
    );
  }, [rows, group, who]);

  const counts = useMemo(() => {
    const count = (fn: (a: AuditAction) => boolean) => rows.filter((r) => fn(r.event.action)).length;
    return {
      names: count((a) => a === 'NAME_VIEWED'),
      records: count((a) => a === 'RECORD_OPENED'),
      downloads: count((a) => a === 'EXPORT_DOWNLOADED' || a === 'DOCUMENT_DOWNLOADED'),
      refused: count((a) => REFUSAL_ACTIONS.has(a)),
    };
  }, [rows]);

  const visible = filtered.slice(0, limit);
  const stats = [
    { icon: Eye, label: 'Names shown', value: counts.names, group: 'identity' as Group },
    { icon: FolderOpen, label: 'Records opened', value: counts.records, group: 'identity' as Group },
    { icon: Download, label: 'Downloads', value: counts.downloads, group: 'downloads' as Group },
    { icon: AlertTriangle, label: 'Refused', value: counts.refused, group: 'refusals' as Group, alert: true },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-line bg-surface p-[var(--tb-card-pad)]" data-coach="recorded">
        <h2 className="text-h3 text-ink">What is recorded</h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RECORDED.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2 text-body text-ink-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-orange-deep" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-caption text-ink-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
          Entries cannot be edited or deleted by the people they describe. Each student’s record
          carries its own trail, back to the day it was referred.
        </p>
      </section>

      <section aria-labelledby="audit-summary-title">
        <h2 id="audit-summary-title" className="sr-only">
          The last 30 days at a glance
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => {
                  setGroup(s.group);
                  setLimit(PAGE);
                }}
                className={cn(
                  'w-full rounded-card border bg-surface p-4 text-left hover:border-orange-deep',
                  s.alert && s.value > 0 ? 'border-l-[3px] border-line border-l-warn' : 'border-line',
                )}
              >
                <span className="flex items-center gap-2 text-caption text-ink-2">
                  <s.icon className={cn('h-4 w-4', s.alert ? 'text-warn' : 'text-orange-deep')} aria-hidden="true" />
                  {s.label}
                </span>
                <span className="mt-1 block text-h2 tabular text-ink">{s.value.toLocaleString()}</span>
                <span className="block text-caption text-ink-3">Last 30 days, all portals</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="session-log-title" data-coach="metric">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="session-log-title" className="text-h2 text-ink">
              Activity log
            </h2>
            <p className="mt-1 text-caption text-ink-2">
              {auditHistory.length.toLocaleString()} entries from the last 30 days
              {liveEvents.length > 0
                ? ` · ${liveEvents.length.toLocaleString()} from this demonstration, marked at the top`
                : ' · anything you do in this demonstration appears at the top'}
              .
            </p>
          </div>
          {liveEvents.length > 0 && (
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Clear demonstration activity
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filter the log by kind" className="flex flex-wrap gap-2" data-coach="action">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={group === g.id}
                onClick={() => {
                  setGroup(g.id);
                  setLimit(PAGE);
                }}
                className={cn(
                  'rounded-pill border px-3 py-1 text-caption',
                  group === g.id ? 'border-orange-deep bg-orange-subtle text-ink' : 'border-line text-ink-2 hover:bg-surface-sunken',
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          <label htmlFor="audit-who" className="ml-auto text-label font-medium text-ink">
            Who
          </label>
          <select
            id="audit-who"
            value={who}
            onChange={(e) => {
              setWho(e.target.value as Role | 'ALL');
              setLimit(PAGE);
            }}
            className="rounded-control border border-line bg-surface px-3 py-1.5 text-body"
          >
            {ROLE_FILTERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              title="No entries of that kind"
              description="Switch back to everything, or to everyone, to see the whole log."
              actionLabel="Show everything"
              onAction={() => {
                setGroup('all');
                setWho('ALL');
              }}
            />
          ) : (
            <>
              <p className="mb-2 text-caption text-ink-3" role="status" aria-live="polite">
                {`Showing ${visible.length.toLocaleString()} of ${filtered.length.toLocaleString()} entries`}
              </p>
              <div className="overflow-x-auto rounded-table border border-line bg-surface">
                <table className="w-full min-w-[760px] border-collapse text-body">
                  <caption className="sr-only">Access and audit log, newest first</caption>
                  <thead className="bg-surface-sunken">
                    <tr>
                      {['When', 'Who', 'What', 'Record or file', 'Reason'].map((h) => (
                        <th key={h} scope="col" className="h-row border-b border-line px-4 text-left text-label font-semibold text-ink-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(({ event: e, live }) => {
                      const persona = getPersonaById(e.actorPersonaId);
                      const refused = REFUSAL_ACTIONS.has(e.action);
                      return (
                        <tr
                          key={e.id}
                          className={cn(
                            'border-b border-line-hair align-top',
                            refused && 'border-l-[3px] border-l-warn bg-warn-bg/30',
                            live && !refused && 'bg-orange-subtle/40',
                          )}
                        >
                          <td className="whitespace-nowrap px-4 py-2 text-caption text-ink-2">
                            {live ? (
                              <>
                                <time dateTime={e.at} title={new Date(e.at).toLocaleString()}>
                                  {formatSessionTime(e.at)}
                                </time>
                                <span className="block font-medium text-ink">This demonstration</span>
                              </>
                            ) : (
                              <time dateTime={e.at}>{formatDateTime(e.at)}</time>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="block text-ink">{persona?.displayName ?? 'Unknown'}</span>
                            <span className="block text-caption text-ink-3">{ROLE_NAMES[e.actorRole]}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1 text-ink">
                              {refused && <AlertTriangle className="h-4 w-4 text-warn" aria-hidden="true" />}
                              {AUDIT_ACTION_LABELS[e.action]}
                            </span>
                            {e.detail && !e.detail.includes('-DOC-') && (
                              <span className="block text-caption text-ink-3">{e.detail}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-caption text-ink">
                            {e.studentId ? (
                              <Link
                                href={`/state/students/detail/?id=${e.studentId}#audit`}
                                className="text-orange-deep underline underline-offset-2"
                              >
                                {e.subject}
                              </Link>
                            ) : (
                              e.subject
                            )}
                          </td>
                          <td className="px-4 py-2 text-caption text-ink-2">{e.reason ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length > limit && (
                <button
                  type="button"
                  onClick={() => setLimit((n) => n + PAGE)}
                  className="mt-3 text-label font-medium text-orange-deep underline underline-offset-2"
                >
                  Show {Math.min(PAGE, filtered.length - limit)} more
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <Modal
        open={confirming}
        title="Clear this demonstration’s activity?"
        description="Removes what was done in this browser — entries, documents added, and authorization changes — so the next demonstration starts clean. The 30 days of history and the synthetic records are not affected."
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetSessionActivity();
                setConfirming(false);
              }}
            >
              Clear activity
            </Button>
          </>
        }
      >
        <p className="text-caption text-ink-2">In a live deployment, audit entries can never be cleared. This button exists only in the demonstration.</p>
      </Modal>
    </div>
  );
}
