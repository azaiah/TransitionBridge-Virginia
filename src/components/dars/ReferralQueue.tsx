'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { ageDays, isStale, UNASSIGNED_STATUSES } from '@/lib/metrics';
import { getDivisionById } from '@/data';
import type { StoredReferral } from '@/data/types';
import { PLAN_TYPE_LABELS } from '@/data/types';

/** The saved views a counselor actually asks for, in plain words. */
const VIEWS = [
  { id: 'ALL', label: 'All referrals' },
  { id: 'UNASSIGNED', label: 'Waiting for me to triage' },
  { id: 'STALE', label: 'Waiting more than 14 days' },
  { id: 'ASSIGNED', label: 'Assigned to a provider' },
  { id: 'IN_SERVICE', label: 'Receiving services' },
] as const;

type ViewId = (typeof VIEWS)[number]['id'];

/** KPI tiles link here with ?status= and ?waiting=, so the tile and the queue agree. */
function initialView(status: string | null, waiting: string | null): ViewId {
  if (waiting === 'over14') return 'STALE';
  if (status === 'unassigned') return 'UNASSIGNED';
  if (status === 'ASSIGNED' || status === 'IN_SERVICE') return status;
  return 'ALL';
}

export function ReferralQueue({ initialReferrals }: { initialReferrals: StoredReferral[] }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewId>(() =>
    initialView(searchParams.get('status'), searchParams.get('waiting')),
  );

  // Oldest first, always. The queue should feel like a responsibility.
  const sorted = useMemo(
    () => [...initialReferrals].sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt)),
    [initialReferrals],
  );

  const rows = useMemo(() => {
    const filtered =
      view === 'ALL'
        ? sorted
        : view === 'UNASSIGNED'
          ? sorted.filter((r) => (UNASSIGNED_STATUSES as readonly string[]).includes(r.status))
          : view === 'STALE'
            ? sorted.filter((r) => isStale(r))
            : sorted.filter((r) => r.status === view);

    return filtered.map((r) => ({
      referral: r,
      waitingDays: Math.round(ageDays(r)),
      stale: isStale(r),
      divisionName: getDivisionById(r.divisionId)?.name ?? 'Unknown division',
      detailHref: `/dars/referrals/detail/?id=${r.id}`,
    }));
  }, [sorted, view]);

  const viewLabel = VIEWS.find((v) => v.id === view)?.label ?? 'All referrals';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
        <label htmlFor="queue-view" className="text-label font-medium text-ink">
          Show me
        </label>
        <select
          id="queue-view"
          className="rounded-control border border-line bg-surface px-3 py-1.5 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
          value={view}
          onChange={(e) => setView(e.target.value as ViewId)}
        >
          {VIEWS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        {/* Announced when the view changes, so the count is not a silent update. */}
        <p className="text-caption text-ink-2" role="status" aria-live="polite">
          {`${rows.length.toLocaleString()} ${rows.length === 1 ? 'referral' : 'referrals'} — ${viewLabel.toLowerCase()}`}
        </p>
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.referral.id}
        csvFilename="referral-queue.csv"
        caption="Referral queue"
        // Waiting over 14 days is marked three ways: a left border, an icon, and the word.
        rowClassName={(r) => (r.stale ? 'border-l-[3px] border-l-warn bg-warn-bg/30' : undefined)}
        emptyTitle={`No referrals are ${viewLabel.toLowerCase()}`}
        emptyDescription="That is good news, not a problem. Switch to all referrals to see the rest of your queue."
        emptyActionLabel="Show all referrals"
        onEmptyAction={() => setView('ALL')}
        columns={[
          {
            key: 'waiting',
            header: 'Waiting (days)',
            numeric: true,
            sortValue: (r) => r.waitingDays,
            render: (r) =>
              r.stale ? (
                <span className="inline-flex items-center gap-1 font-medium text-warn">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {r.waitingDays} — overdue
                </span>
              ) : (
                <span className="tabular text-ink">{r.waitingDays}</span>
              ),
          },
          {
            key: 'student',
            header: 'Student reference',
            sortValue: (r) => r.referral.studentId,
            render: (r) => (
              <Link href={r.detailHref} className="font-mono text-caption text-ink-2 hover:text-orange-deep hover:underline">
                {r.referral.studentId}
              </Link>
            ),
          },
          {
            key: 'division',
            header: 'School division',
            sortValue: (r) => r.divisionName,
            render: (r) => <span className="text-ink">{r.divisionName}</span>,
          },
          {
            key: 'plan',
            header: 'Plan',
            sortValue: (r) => PLAN_TYPE_LABELS[r.referral.planType],
            render: (r) => PLAN_TYPE_LABELS[r.referral.planType],
          },
          {
            key: 'grade',
            header: 'Grade',
            numeric: true,
            defaultVisible: false,
            sortValue: (r) => r.referral.gradeLevel,
            render: (r) => r.referral.gradeLevel,
          },
          {
            key: 'activities',
            header: 'Activities requested',
            numeric: true,
            sortValue: (r) => r.referral.requestedActivities.length,
            render: (r) => r.referral.requestedActivities.length,
          },
          {
            key: 'transport',
            header: 'Transportation barrier',
            defaultVisible: false,
            sortValue: (r) => (r.referral.transportationBarrier ? 'Yes' : 'No'),
            render: (r) => (r.referral.transportationBarrier ? 'Yes' : 'No'),
          },
          {
            key: 'status',
            header: 'Status',
            sortValue: (r) => r.referral.status,
            render: (r) => <StatusPill status={r.referral.status} />,
          },
          {
            key: 'action',
            header: 'Actions',
            render: (r) => (
              <Link href={r.detailHref} className="text-label font-medium text-orange-deep hover:underline">
                Open<span className="sr-only"> referral {r.referral.id}</span>
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
