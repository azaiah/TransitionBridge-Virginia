'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock, MapPin, OctagonAlert, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useViewer } from '@/context/useViewer';
import { demoData } from '@/data';
import { getPreEtsAuthorization } from '@/data/funding';
import { transitionIdFor } from '@/data/identity';
import { referrals, students } from '@/data/records';
import type { PreEtsActivity } from '@/data/types';
import { ACTIVITY_LABELS } from '@/data/types';
import { checkNewService, formatHours, hoursRemaining } from '@/lib/funding';
import {
  addLoggedMinutes,
  adjustAuthorization,
  recordAudit,
  useAuthorizationAdjustments,
} from '@/lib/session-store';
import { cn } from '@/lib/utils';

type Setting = 'SCHOOL' | 'COMMUNITY' | 'WORKPLACE' | 'VIRTUAL';

/**
 * Log a Pre-ETS session — one student or a whole group at once. Before anything is saved,
 * every student's hours are checked against their authorization: a session that would take
 * a student past what DARS authorized is refused for that student, with the reason and the
 * next step, so over-billing is stopped at the moment of entry, not found in an audit later.
 */
export function VendorLogService() {
  const { role, persona } = useViewer();
  const adjustments = useAuthorizationAdjustments();
  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find((v) => v.id === vendorId);

  const activeStudents = useMemo(() => {
    const studentById = new Map(students.map((s) => [s.id, s]));
    return referrals
      .filter((r) => r.assignedVendorId === vendorId && (r.status === 'ASSIGNED' || r.status === 'IN_SERVICE'))
      .map((r) => {
        const student = studentById.get(r.studentId);
        const base = getPreEtsAuthorization(r.id);
        return {
          referralId: r.id,
          studentId: r.studentId,
          transitionId: transitionIdFor({ id: r.studentId, schoolId: student?.schoolId ?? r.schoolId }),
          auth: base ? adjustAuthorization(base, adjustments) : undefined,
        };
      })
      .sort((a, b) => a.transitionId.localeCompare(b.transitionId));
  }, [vendorId, adjustments]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activity, setActivity] = useState<PreEtsActivity | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]!);
  const [duration, setDuration] = useState<string>('60');
  const [setting, setSetting] = useState<Setting>('SCHOOL');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<{ logged: string[]; refused: { id: string; overBy: number }[] } | null>(null);

  if (!vendor) return null;

  const minutes = Math.max(0, Number(duration) || 0);
  const selectedRows = activeStudents.filter((s) => selected.has(s.referralId));
  const checks = selectedRows.map((s) => ({
    row: s,
    check: s.auth ? checkNewService(s.auth, minutes) : { allowed: false, remainingAfter: 0, overBy: minutes / 60 },
  }));
  const blocked = checks.filter((c) => !c.check.allowed);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const logged: string[] = [];
    const refused: { id: string; overBy: number }[] = [];
    for (const { row, check } of checks) {
      if (check.allowed && row.auth) {
        addLoggedMinutes(row.auth.id, minutes);
        logged.push(row.transitionId);
      } else {
        refused.push({ id: row.transitionId, overBy: check.overBy });
        if (role && persona) {
          recordAudit({
            actorRole: role,
            actorPersonaId: persona.id,
            action: 'SERVICE_REFUSED',
            studentId: row.studentId,
            subject: row.transitionId,
            detail: row.auth
              ? `${minutes} min would exceed the authorization by ${formatHours(check.overBy)}`
              : 'No open authorization for this student',
          });
        }
      }
    }
    if (logged.length > 0 && role && persona) {
      recordAudit({
        actorRole: role,
        actorPersonaId: persona.id,
        action: 'SERVICE_LOGGED',
        subject: logged.length === 1 ? logged[0]! : `${logged.length} students (group session)`,
        detail: `${activity ? ACTIVITY_LABELS[activity] : 'Service'} · ${minutes} min`,
      });
    }
    setResult({ logged, refused });
  }

  if (result) {
    const allRefused = result.logged.length === 0;
    return (
      <div className={cn('mx-auto max-w-2xl rounded-card border-2 bg-surface p-8 text-center', allRefused ? 'border-risk' : 'border-ok')}>
        {allRefused ? (
          <OctagonAlert className="mx-auto h-12 w-12 text-risk" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mx-auto h-12 w-12 text-ok" aria-hidden="true" />
        )}
        <h2 className="mt-4 text-h2 text-ink" role="status">
          {allRefused
            ? 'Nothing was logged'
            : `Logged ${result.logged.length} service record${result.logged.length === 1 ? '' : 's'}`}
        </h2>
        {result.logged.length > 0 && (
          <p className="mt-2 text-body text-ink-2">
            {activity ? ACTIVITY_LABELS[activity] : ''} · {minutes} minutes · hours drawn from each student’s
            authorization.
          </p>
        )}
        {result.refused.length > 0 && (
          <div className="mt-6 rounded-control border border-risk/30 bg-risk-bg p-4 text-left">
            <p className="text-body font-medium text-ink">
              Refused for {result.refused.length} {result.refused.length === 1 ? 'student' : 'students'} — over
              authorization
            </p>
            <ul className="mt-2 space-y-1 text-caption text-ink">
              {result.refused.map((r) => (
                <li key={r.id}>
                  <span className="font-mono">{r.id}</span> would go {formatHours(r.overBy)} past the hours DARS
                  authorized.
                </li>
              ))}
            </ul>
            <p className="mt-2 text-caption text-ink-2">
              Ask the student’s DARS counselor to extend the authorization, then log the session. The refusal is
              recorded in the audit trail.
            </p>
          </div>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button variant="secondary" href="/vendor/roster/">
            Back to roster
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setResult(null);
              setSelected(new Set());
              setNotes('');
            }}
          >
            Log another session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-h1 text-ink">Log services</h1>
        <p className="mt-2 text-body text-ink-2">
          Select several students to log a group session in one go. Each student’s authorized hours are
          checked before anything is saved.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-8">
        <section className="rounded-card border border-line bg-surface p-6 shadow-sm" data-coach="select-students">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-h2 text-ink">
              <Users className="h-5 w-5 text-ink-3" aria-hidden="true" />
              1. Select students
            </h2>
            <span className="text-caption font-medium text-ink-2">{selected.size} selected</span>
          </div>
          <p className="mb-3 text-caption text-ink-2">Students appear by Transition ID. Hours left are this fiscal year’s Pre-ETS authorization.</p>

          <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2 md:grid-cols-3">
            {activeStudents.map((s) => {
              const left = s.auth ? hoursRemaining(s.auth) : null;
              const short = left !== null && left < minutes / 60;
              return (
                <label
                  key={s.referralId}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-surface-sunken',
                    selected.has(s.referralId) ? 'border-orange bg-orange-subtle/20' : 'border-line',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.referralId)}
                    onChange={() => toggle(s.referralId)}
                    className="mt-0.5 h-4 w-4 rounded border-line text-orange-deep focus:ring-orange"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-body font-medium text-ink">{s.transitionId}</span>
                    <span className={cn('flex items-center gap-1 text-caption', short ? 'font-medium text-risk' : 'text-ink-2')}>
                      {short && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                      {left === null
                        ? 'No authorization'
                        : left < 0
                          ? `${formatHours(-left)} over`
                          : `${formatHours(left)} left`}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-6 shadow-sm" data-coach="session-details">
          <h2 className="mb-6 text-h2 text-ink">2. Session details</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="log-activity" className="mb-2 block text-label font-medium text-ink">
                Pre-ETS activity
              </label>
              <select
                id="log-activity"
                required
                value={activity}
                onChange={(e) => setActivity(e.target.value as PreEtsActivity)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              >
                <option value="" disabled>
                  Select activity...
                </option>
                {vendor.activitiesOffered.map((act) => (
                  <option key={act} value={act}>
                    {ACTIVITY_LABELS[act]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="log-date" className="mb-2 flex items-center gap-2 text-label font-medium text-ink">
                <Calendar className="h-4 w-4 text-ink-3" aria-hidden="true" />
                Date of service
              </label>
              <input
                id="log-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            <div>
              <label htmlFor="log-duration" className="mb-2 flex items-center gap-2 text-label font-medium text-ink">
                <Clock className="h-4 w-4 text-ink-3" aria-hidden="true" />
                Duration (minutes)
              </label>
              <input
                id="log-duration"
                type="number"
                required
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 flex items-center gap-2 text-label font-medium text-ink">
                <MapPin className="h-4 w-4 text-ink-3" aria-hidden="true" />
                Setting
              </legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(['SCHOOL', 'COMMUNITY', 'WORKPLACE', 'VIRTUAL'] as const).map((s) => (
                  <label key={s} className="flex min-h-11 items-center gap-2 sm:min-h-0">
                    <input
                      type="radio"
                      name="setting"
                      checked={setting === s}
                      onChange={() => setSetting(s)}
                      className="h-4 w-4 border-line text-orange-deep focus:ring-orange"
                    />
                    <span className="text-body capitalize text-ink">{s.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="sm:col-span-2">
              <label htmlFor="log-notes" className="mb-2 block text-label font-medium text-ink">
                Notes (optional)
              </label>
              <textarea
                id="log-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief description of the session..."
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
          </div>
        </section>

        {/* The over-billing guard, shown before submitting, not after. */}
        {selected.size > 0 && minutes > 0 && (
          <section
            aria-live="polite"
            data-coach="auth-check"
            className={cn(
              'rounded-card border p-4',
              blocked.length > 0 ? 'border-risk/40 bg-risk-bg' : 'border-ok/30 bg-ok-bg',
            )}
          >
            {blocked.length === 0 ? (
              <p className="flex items-start gap-2 text-body text-ink">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
                Every selected student has enough authorized hours for a {minutes}-minute session.
              </p>
            ) : (
              <div className="flex items-start gap-2 text-body text-ink">
                <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0 text-risk" aria-hidden="true" />
                <div>
                  <p className="font-medium">
                    {blocked.length} of {selected.size} selected {blocked.length === 1 ? 'student does' : 'students do'} not
                    have enough authorized hours.
                  </p>
                  <p className="mt-1 text-caption text-ink-2">
                    {blocked
                      .slice(0, 4)
                      .map((b) => `${b.row.transitionId} (${formatHours(b.check.overBy)} over)`)
                      .join(' · ')}
                    {blocked.length > 4 ? ` · and ${blocked.length - 4} more` : ''}. The session will be logged for the
                    others and refused for these — ask their DARS counselor to extend the authorization.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="flex justify-end">
          <Button variant="primary" type="submit" disabled={selected.size === 0 || !activity || !date || minutes <= 0}>
            Log {selected.size} service record{selected.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </form>
    </div>
  );
}
