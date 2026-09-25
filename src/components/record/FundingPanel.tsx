'use client';

import { useState } from 'react';
import { CalendarRange, PlusCircle } from 'lucide-react';
import { AuthorizationMeter, AuthorizationStatusPill } from '@/components/funding/AuthorizationMeter';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Authorization, Persona, Role } from '@/data/types';
import { FUNDING_SOURCE_LABELS } from '@/data/types';
import type { SectionAccess } from '@/lib/access';
import { formatFullDate } from '@/lib/dates';
import { formatDollars } from '@/lib/fiscal';
import { EXTEND_REASONS, FUNDING_SOURCE_DESCRIPTIONS, dollarsRemaining, formatHours } from '@/lib/funding';
import { extendAuthorization, recordAudit } from '@/lib/session-store';
import { RecordCard, RestrictedNote } from './RecordCard';


/**
 * Who is paying for this student's services, and how much of each authorization is left.
 * Counselors can extend an authorization — with a reason, recorded — which is the only way
 * past the limit. Providers see their own Pre-ETS hours but not dollars.
 */
export function FundingPanel({
  authorizations,
  access,
  role,
  persona,
  studentId,
  transitionId,
  vendorId,
  providerAssigned = false,
}: {
  authorizations: Authorization[];
  access: SectionAccess;
  role: Role;
  persona: Persona | undefined;
  studentId: string;
  transitionId: string;
  /** The provider viewing, if any — providers see only their own authorization. */
  vendorId?: string;
  /** A provider is on the case, so a missing authorization is something to act on. */
  providerAssigned?: boolean;
}) {
  const [extending, setExtending] = useState<Authorization | null>(null);
  const [extraHours, setExtraHours] = useState(5);
  const [reason, setReason] = useState<string>(EXTEND_REASONS[0]);

  if (access === 'none') {
    return (
      <RecordCard id="funding" title="Funding and hours">
        <RestrictedNote>Funding is managed by DARS and the providers delivering services.</RestrictedNote>
      </RecordCard>
    );
  }

  const shown = access === 'summary' ? authorizations.filter((a) => a.source === 'DARS') : authorizations;
  const showDollars = role === 'dars_counselor' || role === 'state_leadership';

  function confirmExtend() {
    if (!extending || !persona) return;
    extendAuthorization(extending.id, extraHours);
    recordAudit({
      actorRole: role,
      actorPersonaId: persona.id,
      action: 'AUTHORIZATION_EXTENDED',
      studentId,
      subject: `${FUNDING_SOURCE_LABELS[extending.source]} · ${transitionId}`,
      reason,
      detail: `+${extraHours} hours (${extending.id})`,
    });
    setExtending(null);
  }

  return (
    <RecordCard
      id="funding"
      coach="funding"
      title="Funding and hours"
      description={
        vendorId
          ? 'The Pre-ETS hours your organization can still deliver for this student this year.'
          : 'Who is paying for each service this fiscal year, and how much is left.'
      }
    >
      {shown.length === 0 ? (
        providerAssigned ? (
          <p className="text-body text-ink-2">
            No authorization is open for this student this fiscal year. The assigned provider
            cannot log a session until DARS issues one — the service log checks for it.
          </p>
        ) : (
          <p className="text-body text-ink-2">
            No authorization is open for this student this fiscal year. One is issued when a
            provider is assigned.
          </p>
        )
      ) : (
        <ul className="space-y-4">
          {shown.map((auth) => (
            <li key={auth.id} className="rounded-control border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="meta-label">Paid by</p>
                  <p className="text-body font-semibold text-ink">{FUNDING_SOURCE_LABELS[auth.source]}</p>
                  <p className="text-caption text-ink-2">{auth.service}</p>
                </div>
                <AuthorizationStatusPill auth={auth} />
              </div>
              <div className="mt-3">
                <AuthorizationMeter auth={auth} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-caption text-ink-2">
                <span className="inline-flex items-center gap-1">
                  <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatFullDate(auth.startDate)} to {formatFullDate(auth.endDate)}
                </span>
                {showDollars && (
                  <span className="tabular">
                    {formatDollars(auth.dollarsUsed)} of {formatDollars(auth.dollarsAuthorized)} used ·{' '}
                    {formatDollars(Math.max(0, dollarsRemaining(auth)))} left
                  </span>
                )}
              </div>
              {role === 'dars_counselor' && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="secondary"
                    className="!px-3 !py-1.5 text-caption"
                    onClick={() => {
                      setExtending(auth);
                      setExtraHours(5);
                    }}
                    data-coach="extend"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    Extend authorization
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {access === 'summary' && (
        <p className="mt-3 text-caption text-ink-2">
          Showing the Pre-ETS hours your organization draws on. Other funders’ authorizations are
          visible to DARS.
        </p>
      )}

      <Modal
        open={extending !== null}
        title="Extend this authorization"
        description={
          extending
            ? `${FUNDING_SOURCE_LABELS[extending.source]} — ${extending.service}. ${FUNDING_SOURCE_DESCRIPTIONS[extending.source]}`
            : undefined
        }
        onClose={() => setExtending(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtending(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmExtend}>
              Add {formatHours(extraHours)}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="extend-hours" className="text-label font-medium text-ink">
              Hours to add
            </label>
            <input
              id="extend-hours"
              type="number"
              min={1}
              max={80}
              value={extraHours}
              onChange={(e) => setExtraHours(Math.max(1, Math.min(80, Number(e.target.value) || 1)))}
              className="mt-1 w-32 rounded-control border border-line bg-surface px-3 py-2 text-body tabular"
            />
          </div>
          <div>
            <label htmlFor="extend-reason" className="text-label font-medium text-ink">
              Reason
            </label>
            <select
              id="extend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-body"
            >
              {EXTEND_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <p className="rounded-control bg-surface-sunken p-3 text-caption text-ink-2">
            The change, the reason, and your name are recorded in the audit trail.
          </p>
        </div>
      </Modal>
    </RecordCard>
  );
}
