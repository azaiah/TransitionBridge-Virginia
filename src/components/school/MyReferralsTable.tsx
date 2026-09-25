'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReferralTimeline } from '@/components/shared/ReferralTimeline';
import { useViewer } from '@/context/useViewer';
import { demoData } from '@/data';
import { getReferralsForDivision, students } from '@/data/records';
import { isOpen, isStale } from '@/lib/metrics';
import Link from 'next/link';
import { transitionIdFor } from '@/data/identity';
import { EscalationPill } from '@/components/record/EscalationPill';
import { escalationFor } from '@/lib/escalation';
import { formatDate, formatFullDate, formatRelative } from '@/lib/dates';
import { cn } from '@/lib/utils';

/** The statuses a coordinator asks about, in the words they use. */
const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'All open referrals' },
  { value: 'ALL', label: 'Everything, including closed' },
  { value: 'STUCK', label: 'Stuck more than 14 days' },
  { value: 'PAST_DUE', label: 'Early warning: past due 14+ days' },
  { value: 'NEW', label: 'New' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'AWAITING_CONSENT', label: 'Awaiting consent' },
  { value: 'READY_TO_ASSIGN', label: 'Ready to assign' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_SERVICE', label: 'In service' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED_NOT_SERVED', label: 'Closed — not served' },
];

const PAGE = 25;

export function MyReferralsTable() {
  const { persona } = useViewer();
  const searchParams = useSearchParams();
  const personaId = persona?.id;

  const divisionId = persona?.scopeId ?? demoData.divisions[0].id;
  const allDivisionReferrals = getReferralsForDivision(divisionId);

  const myReferrals = personaId
    ? allDivisionReferrals.filter((r) => r.submittedByPersonaId === personaId)
    : allDivisionReferrals;

  // The dashboard tiles link here with ?status= and ?stuck=true, so the tile and this
  // screen always agree on what the user just clicked.
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (searchParams.get('stuck') === 'true') return 'STUCK';
    if (searchParams.get('pastDue') === 'true') return 'PAST_DUE';
    return searchParams.get('status') ?? 'OPEN';
  });
  const [limit, setLimit] = useState(PAGE);
  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredReferrals = useMemo(() => {
    const sorted = [...myReferrals].sort(
      (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
    );
    if (statusFilter === 'ALL') return sorted;
    if (statusFilter === 'OPEN') return sorted.filter((r) => isOpen(r.status));
    if (statusFilter === 'STUCK') return sorted.filter((r) => isStale(r));
    if (statusFilter === 'PAST_DUE') return sorted.filter((r) => escalationFor(r) !== null);
    return sorted.filter((r) => r.status === statusFilter);
  }, [myReferrals, statusFilter]);

  const filterLabel =
    STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All statuses';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-4" data-coach="referral-filter">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="referral-status" className="text-label font-medium text-ink">
            Show me
          </label>
          <select
            id="referral-status"
            className="rounded-control border border-line bg-surface px-3 py-1.5 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setLimit(PAGE);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-caption text-ink-2" role="status" aria-live="polite">
          {`Showing ${Math.min(limit, filteredReferrals.length).toLocaleString()} of ${filteredReferrals.length.toLocaleString()} matching · ${myReferrals.length.toLocaleString()} referrals submitted in all`}
        </p>
      </div>

      {filteredReferrals.length === 0 ? (
        <EmptyState
          title={`No referrals are ${filterLabel.toLowerCase()}`}
          description="Nothing is sitting in that state right now. Switch back to all statuses to see everything you have submitted."
          actionLabel="Show all statuses"
          onAction={() => setStatusFilter('ALL')}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm" data-coach="referral-list">
          <table className="w-full border-collapse text-left text-body">
            <caption className="sr-only">
              Referrals you submitted. Select a row to see what has happened to it.
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken">
                <th scope="col" className="px-3 py-2 text-label font-medium text-ink-2">
                  Student (Transition ID)
                </th>
                <th scope="col" className="px-3 py-2 text-label font-medium text-ink-2">
                  Submitted
                </th>
                <th scope="col" className="hidden px-3 py-2 text-label font-medium text-ink-2 sm:table-cell">
                  Activities requested
                </th>
                <th scope="col" className="px-3 py-2 text-label font-medium text-ink-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredReferrals.slice(0, limit).map((ref) => {
                const student = studentById.get(ref.studentId);
                const isExpanded = expandedId === ref.id;
                const transitionId = transitionIdFor({ id: ref.studentId, schoolId: student?.schoolId ?? ref.schoolId });
                const escalation = escalationFor(ref);

                return (
                  <React.Fragment key={ref.id}>
                    <tr className={cn('transition-colors', isExpanded && 'bg-surface-sunken')}>
                      <td className="px-3 py-3">
                        {/* The whole name is the control, so it is reachable by keyboard. */}
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : ref.id)}
                          aria-expanded={isExpanded}
                          className="flex items-center gap-2 text-left"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-ink-3" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-ink-3" aria-hidden="true" />
                          )}
                          <span className="block font-mono font-medium text-ink">{transitionId}</span>
                        </button>
                        <Link
                          href={`/school/students/detail/?id=${ref.studentId}`}
                          className="ml-6 text-caption text-orange-deep underline underline-offset-2"
                        >
                          Open record<span className="sr-only"> {transitionId}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-ink">
                        <time dateTime={ref.submittedAt} title={formatFullDate(ref.submittedAt)}>
                          {formatDate(ref.submittedAt)}
                        </time>
                        <span className="block text-caption text-ink-3">
                          {formatRelative(ref.submittedAt)}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 text-caption text-ink-2 sm:table-cell">
                        {`${ref.requestedActivities.length} of 5 required activities`}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusPill status={ref.status} />
                          {escalation && <EscalationPill escalation={escalation} />}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="bg-canvas p-0">
                          <div className="border-b border-line p-6">
                            <h3 className="mb-4 text-h3 text-ink">
                              What has happened to this referral
                            </h3>
                            <ReferralTimeline referralId={ref.id} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredReferrals.length > limit && (
            <div className="border-t border-line bg-surface-sunken p-3 text-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="text-label font-medium text-orange-deep underline underline-offset-2"
              >
                Show {Math.min(PAGE, filteredReferrals.length - limit)} more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
