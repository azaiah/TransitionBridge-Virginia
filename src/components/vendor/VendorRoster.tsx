'use client';

import { useRoleOptional } from '@/context/RoleContext';
import { getPersonaById, demoData } from '@/data';
import { referrals, students } from '@/data/records';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { ACTIVITY_LABELS } from '@/data/types';
import { formatDate, formatFullDate } from '@/lib/dates';
import Link from 'next/link';

export function VendorRoster() {
  const roleCtx = useRoleOptional();
  const personaId = roleCtx?.personaId;
  const persona = personaId ? getPersonaById(personaId) : null;
  
  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find(v => v.id === vendorId);

  if (!vendor) return null;

  const activeStudents = referrals.filter(r => 
    r.assignedVendorId === vendorId && 
    (r.status === 'ASSIGNED' || r.status === 'IN_SERVICE')
  );

  const data = activeStudents.map(ref => {
    const student = students.find(s => s.id === ref.studentId);
    return {
      id: ref.id,
      studentId: student?.id ?? '',
      name: student?.displayName ?? 'Unknown',
      age: student?.age ?? 0,
      status: ref.status,
      assignedAt: ref.assignedAt ?? ref.submittedAt,
      activities: ref.requestedActivities,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 text-ink">My roster</h1>
        <p className="mt-2 text-body text-ink-2">
          Students currently assigned to {vendor.name} for Pre-ETS services.
        </p>
      </div>

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Student',
            render: (r) => (
              <div>
                <div className="font-medium text-ink">{r.name}</div>
                <div className="font-mono text-caption text-ink-3">{r.studentId}</div>
              </div>
            ),
            sortValue: (r) => r.name,
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
            key: 'activities',
            header: 'Requested activities',
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                {r.activities.map(act => (
                  <span key={act} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-ink-2" title={ACTIVITY_LABELS[act]}>
                    {ACTIVITY_LABELS[act].split(' ')[0]}
                  </span>
                ))}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => <StatusPill status={r.status as any} />,
            sortValue: (r) => r.status,
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
        csvFilename="vendor-roster.csv"
        caption="Students assigned to this provider"
        emptyTitle="No students are assigned to you right now"
        emptyDescription="Students appear here as soon as you accept a referral offer. Your inbox is where those offers arrive."
        emptyActionLabel="Open my referral inbox"
        emptyActionHref="/vendor/inbox/"
      />
    </div>
  );
}
