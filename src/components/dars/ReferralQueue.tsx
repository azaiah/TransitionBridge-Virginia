'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { ageDays, isStale, UNASSIGNED_STATUSES } from '@/lib/metrics';
import { getDistrictById, getDivisionById } from '@/data';
import { useViewer } from '@/context/useViewer';
import { transitionIdFor } from '@/data/identity';
import { EscalationPill } from '@/components/record/EscalationPill';
import { STALL_STAGE_LABELS, escalationFor, type StallStage } from '@/lib/escalation';
import type { StoredReferral } from '@/data/types';
import { PLAN_TYPE_LABELS, STATUS_LABELS } from '@/data/types';

/** The saved views a counselor actually asks for, in plain words. */
const VIEWS = [
  { id: 'OPEN', label: 'All open referrals' },
  { id: 'ALL', label: 'Everything, including closed' },
  { id: 'UNASSIGNED', label: 'Waiting for me to triage' },
  { id: 'STALE', label: 'Waiting more than 14 days' },
  { id: 'ASSIGNED', label: 'Assigned to a provider' },
  { id: 'IN_SERVICE', label: 'Receiving services' },
  { id: 'BARRIER', label: 'Transportation barrier flagged' },
  { id: 'TIER_14', label: 'Early warning: past due 14+ days' },
  { id: 'TIER_30', label: 'Early warning: past due 30+ days' },
  { id: 'TIER_90', label: 'Early warning: past due 90+ days' },
] as const;

const FINISHED = new Set(['COMPLETED', 'CLOSED_NOT_SERVED']);

const TIERS: Record<string, 14 | 30 | 90> = { TIER_14: 14, TIER_30: 30, TIER_90: 90 };
const STAGES: readonly StallStage[] = ['WAITING_FOR_PROVIDER', 'WAITING_ON_CONSENT', 'WAITING_TO_START'];

type ViewId = (typeof VIEWS)[number]['id'];

/** KPI tiles link here with ?status=, ?waiting=, and ?tier=, so the tile and the queue agree. */
function initialView(
  status: string | null,
  waiting: string | null,
  tier: string | null,
  filter: string | null,
): ViewId {
  if (filter === 'transportation-barrier') return 'BARRIER';
  if (tier === '14' || tier === '30' || tier === '90') return `TIER_${tier}` as ViewId;
  if (waiting === 'over14') return 'STALE';
  if (status === 'unassigned') return 'UNASSIGNED';
  if (status === 'ASSIGNED' || status === 'IN_SERVICE') return status;
  if (status === 'all') return 'ALL';
  return 'OPEN';
}

export function ReferralQueue({ initialReferrals }: { initialReferrals: StoredReferral[] }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewId>(() =>
    initialView(
      searchParams.get('status'),
      searchParams.get('waiting'),
      searchParams.get('tier'),
      searchParams.get('filter'),
    ),
  );
  // Early-warning links can narrow to one stage, e.g. "waiting for a first service".
  const [stage, setStage] = useState<StallStage | 'ALL'>(() => {
    const fromUrl = searchParams.get('stage');
    return STAGES.includes(fromUrl as StallStage) ? (fromUrl as StallStage) : 'ALL';
  });

  // The queue is the counselor's district. A link from the state view can point at another
  // district with ?district=, which is how a state alert lands on exactly its records.
  const { persona } = useViewer();
  const districtParam = searchParams.get('district');
  const districtId = districtParam && getDistrictById(districtParam) ? districtParam : persona?.scopeId;
  const districtName = districtId ? getDistrictById(districtId)?.name : undefined;

  // Oldest first, always. The queue should feel like a responsibility.
  const sorted = useMemo(
    () =>
      initialReferrals
        .filter((r) => !districtId || r.darsDistrictId === districtId)
        .sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt)),
    [initialReferrals, districtId],
  );

  const rows = useMemo(() => {
    const filtered =
      view === 'ALL'
        ? sorted
        : view === 'OPEN'
          ? sorted.filter((r) => !FINISHED.has(r.status))
        : view === 'UNASSIGNED'
          ? sorted.filter((r) => (UNASSIGNED_STATUSES as readonly string[]).includes(r.status))
          : view === 'STALE'
            ? sorted.filter((r) => isStale(r))
            : view === 'BARRIER'
              ? sorted.filter((r) => r.transportationBarrier)
            : view in TIERS
              ? sorted.filter((r) => {
                  const e = escalationFor(r);
                  return e !== null && e.tier === TIERS[view] && (stage === 'ALL' || e.stage === stage);
                })
              : sorted.filter((r) => r.status === view);

    return filtered.map((r) => ({
      referral: r,
      // A finished referral is not waiting on anyone, so it has no wait to show.
      waitingDays: FINISHED.has(r.status) ? null : Math.round(ageDays(r)),
      stale: isStale(r),
      escalation: escalationFor(r),
      transitionId: transitionIdFor({ id: r.studentId, schoolId: r.schoolId }),
      divisionName: getDivisionById(r.divisionId)?.name ?? 'Unknown division',
      detailHref: `/dars/referrals/detail/?id=${r.id}`,
    }));
  }, [sorted, view, stage]);

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
          onChange={(e) => {
            setView(e.target.value as ViewId);
            setStage('ALL');
          }}
          data-coach="queue-views"
        >
          {VIEWS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        {view in TIERS && (
          <>
            <label htmlFor="queue-stage" className="text-label font-medium text-ink">
              Stuck at
            </label>
            <select
              id="queue-stage"
              className="rounded-control border border-line bg-surface px-3 py-1.5 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              value={stage}
              onChange={(e) => setStage(e.target.value as StallStage | 'ALL')}
            >
              <option value="ALL">Any stage</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STALL_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </>
        )}
        {/* Announced when the view changes, so the count is not a silent update. */}
        <p className="text-caption text-ink-2" role="status" aria-live="polite">
          {`${rows.length.toLocaleString()} ${rows.length === 1 ? 'referral' : 'referrals'} — ${viewLabel.toLowerCase()}${districtName ? ` · ${districtName}` : ''}`}
        </p>
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.referral.id}
        csvFilename="referral-queue.csv"
        exportKind="records"
        caption="Referral queue"
        // Waiting over 14 days is marked three ways: a left border, an icon, and the word.
        rowClassName={(r) => (r.stale ? 'border-l-[3px] border-l-warn bg-warn-bg/30' : undefined)}
        emptyTitle={`No referrals are ${viewLabel.toLowerCase()}`}
        emptyDescription="That is good news, not a problem. Switch to all referrals to see the rest of your queue."
        emptyActionLabel="Show all open referrals"
        onEmptyAction={() => setView('OPEN')}
        columns={[
          {
            key: 'waiting',
            header: 'Days since referral',
            numeric: true,
            sortValue: (r) => r.waitingDays ?? -1,
            csvValue: (r) => (r.waitingDays === null ? 'Closed' : r.waitingDays),
            render: (r) =>
              r.waitingDays === null ? (
                <span className="text-ink-3">Closed</span>
              ) : r.stale ? (
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
            header: 'Transition ID',
            sortValue: (r) => r.transitionId,
            render: (r) => (
              <Link href={r.detailHref} className="font-mono text-caption text-ink-2 hover:text-orange-deep hover:underline">
                {r.transitionId}
              </Link>
            ),
          },
          {
            key: 'warning',
            header: 'Early warning',
            sortValue: (r) => (r.escalation ? r.escalation.tier : 0),
            csvValue: (r) => (r.escalation ? `${r.escalation.tier}+ days — ${STALL_STAGE_LABELS[r.escalation.stage]}` : 'None'),
            render: (r) =>
              r.escalation ? <EscalationPill escalation={r.escalation} /> : <span className="text-ink-3">None</span>,
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
            csvValue: (r) => STATUS_LABELS[r.referral.status],
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
