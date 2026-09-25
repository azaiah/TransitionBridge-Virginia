'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useViewer } from '@/context/useViewer';
import { demoData } from '@/data';
import { referrals, students } from '@/data/records';
import { getPreEtsAuthorization } from '@/data/funding';
import { transitionIdFor } from '@/data/identity';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { AuthorizationStatusPill } from '@/components/funding/AuthorizationMeter';
import { EscalationPill } from '@/components/record/EscalationPill';
import { STATUS_LABELS } from '@/data/types';
import { formatDate, formatFullDate } from '@/lib/dates';
import { escalationFor } from '@/lib/escalation';
import { AUTHORIZATION_STATUS_LABELS, authorizationStatus, formatHours, hoursRemaining } from '@/lib/funding';
import { adjustAuthorization, useAuthorizationAdjustments } from '@/lib/session-store';

/**
 * The provider's roster: every student assigned to this organization, by Transition ID —
 * providers never see a name — with the Pre-ETS hours still authorized for each, so nobody
 * schedules a session the authorization cannot cover.
 */
export function VendorRoster() {
  const { persona } = useViewer();
  const adjustments = useAuthorizationAdjustments();
  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find((v) => v.id === vendorId);

  const data = useMemo(() => {
    const studentById = new Map(students.map((s) => [s.id, s]));
    return referrals
      .filter((r) => r.assignedVendorId === vendorId && (r.status === 'ASSIGNED' || r.status === 'IN_SERVICE'))
      .map((ref) => {
        const student = studentById.get(ref.studentId);
        const base = getPreEtsAuthorization(ref.id);
        const auth = base ? adjustAuthorization(base, adjustments) : undefined;
        return {
          id: ref.id,
          studentId: ref.studentId,
          transitionId: transitionIdFor({ id: ref.studentId, schoolId: student?.schoolId ?? ref.schoolId }),
          age: student?.age ?? 0,
          status: ref.status,
          escalation: escalationFor(ref),
          assignedAt: ref.assignedAt ?? ref.submittedAt,
          auth,
        };
      });
  }, [vendorId, adjustments]);

  if (!vendor) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 text-ink">My roster</h1>
        <p className="mt-2 max-w-2xl text-body text-ink-2">
          Students currently assigned to {vendor.name}, by Transition ID, with the Pre-ETS hours
          each one still has authorized.
        </p>
      </div>

      <div data-coach="roster">
        <DataTable
          columns={[
            {
              key: 'student',
              header: 'Transition ID',
              render: (r) => (
                <Link href={`/vendor/students/detail/?id=${r.studentId}`} className="font-mono font-medium text-orange-deep hover:underline">
                  {r.transitionId}
                </Link>
              ),
              sortValue: (r) => r.transitionId,
            },
            {
              key: 'age',
              header: 'Age',
              render: (r) => r.age,
              sortValue: (r) => r.age,
              numeric: true,
            },
            {
              key: 'assignedAt',
              header: 'Assigned on',
              render: (r) => (
                <time dateTime={r.assignedAt} title={formatFullDate(r.assignedAt)}>
                  {formatDate(r.assignedAt)}
                </time>
              ),
              sortValue: (r) => r.assignedAt,
            },
            {
              key: 'hours',
              header: 'Hours left',
              numeric: true,
              render: (r) => {
                if (!r.auth) return <span className="text-ink-3">No authorization</span>;
                const left = hoursRemaining(r.auth);
                return left < 0 ? (
                  <span className="font-medium text-risk">{formatHours(-left)} over</span>
                ) : (
                  <span className="tabular">{formatHours(left)}</span>
                );
              },
              sortValue: (r) => (r.auth ? Math.round(hoursRemaining(r.auth) * 10) / 10 : -999),
            },
            {
              key: 'authStatus',
              header: 'Authorization',
              render: (r) => (r.auth ? <AuthorizationStatusPill auth={r.auth} /> : '—'),
              sortValue: (r) => (r.auth ? authorizationStatus(r.auth) : ''),
              csvValue: (r) => (r.auth ? AUTHORIZATION_STATUS_LABELS[authorizationStatus(r.auth)] : 'No authorization'),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <StatusPill status={r.status} />
                  {r.escalation && <EscalationPill escalation={r.escalation} />}
                </span>
              ),
              sortValue: (r) => STATUS_LABELS[r.status],
            },
            {
              key: 'action',
              header: 'Action',
              render: () => (
                <Link href="/vendor/log/" className="text-label font-medium text-orange-deep hover:underline">
                  Log service
                </Link>
              ),
            },
          ]}
          rows={data}
          rowKey={(r) => r.id}
          exportKind="records"
          csvFilename="vendor-roster.csv"
          caption="Students assigned to this provider"
          emptyTitle="No students are assigned to you right now"
          emptyDescription="Students appear here as soon as you accept a referral offer. Your inbox is where those offers arrive."
          emptyActionLabel="Open my referral inbox"
          emptyActionHref="/vendor/inbox/"
        />
      </div>
    </div>
  );
}
