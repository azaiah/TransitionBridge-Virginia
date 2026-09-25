'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { useViewer } from '@/context/useViewer';
import { demoData, getDivisionById } from '@/data';
import { transitionIdFor } from '@/data/identity';
import { getReferralsForDistrict, students } from '@/data/records';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EscalationPill } from '@/components/record/EscalationPill';
import { STATUS_LABELS } from '@/data/types';
import { STALL_STAGE_LABELS, escalationFor } from '@/lib/escalation';

export default function DarsStudentsPage() {
  const { persona } = useViewer();
  const districtId = persona?.scopeId ?? demoData.districts[0].id;

  const data = useMemo(() => {
    const allDistrictReferrals = getReferralsForDistrict(districtId);
    const byStudent = new Map<string, typeof allDistrictReferrals>();
    for (const r of allDistrictReferrals) {
      const list = byStudent.get(r.studentId) ?? [];
      list.push(r);
      byStudent.set(r.studentId, list);
    }
    return students
      .filter((s) => byStudent.has(s.id))
      .map((s) => {
        const studentReferrals = byStudent.get(s.id)!;
        const latest = [...studentReferrals].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0];
        return {
          id: s.id,
          transitionId: transitionIdFor(s),
          division: getDivisionById(s.divisionId)?.name ?? '',
          age: s.age,
          status: latest?.status ?? null,
          escalation: latest ? escalationFor(latest) : null,
          referralCount: studentReferrals.length,
        };
      });
  }, [districtId]);

  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Students</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            Everyone with a referral in your district, by Transition ID. Open a record to see the
            whole transition story — the name is available there on request, and each request is
            recorded.
          </p>
        </div>
      </div>

      <div className="mt-8" data-coach="student-list">
        <DataTable
          columns={[
            {
              key: 'id',
              header: 'Transition ID',
              render: (r) => (
                <Link href={`/dars/students/detail/?id=${r.id}`} className="font-mono font-medium text-orange-deep hover:underline">
                  {r.transitionId}
                </Link>
              ),
              sortValue: (r) => r.transitionId,
            },
            {
              key: 'division',
              header: 'School division',
              render: (r) => r.division,
              sortValue: (r) => r.division,
            },
            {
              key: 'age',
              header: 'Age',
              render: (r) => r.age,
              sortValue: (r) => r.age,
              numeric: true,
            },
            {
              key: 'status',
              header: 'Latest status',
              // The pill carries the plain-English label, an icon, and a colour together.
              render: (r) => (r.status ? <StatusPill status={r.status} /> : 'No referral yet'),
              sortValue: (r) => (r.status ? STATUS_LABELS[r.status] : 'No referral yet'),
            },
            {
              key: 'warning',
              header: 'Early warning',
              render: (r) => (r.escalation ? <EscalationPill escalation={r.escalation} /> : <span className="text-ink-3">None</span>),
              sortValue: (r) => r.escalation?.tier ?? 0,
              csvValue: (r) => (r.escalation ? `${r.escalation.tier}+ days — ${STALL_STAGE_LABELS[r.escalation.stage]}` : 'None'),
            },
            {
              key: 'referralCount',
              header: 'Referrals',
              render: (r) => r.referralCount,
              sortValue: (r) => r.referralCount,
              numeric: true,
            },
          ]}
          rows={data}
          rowKey={(r) => r.id}
          exportKind="records"
          csvFilename="district-students.csv"
          caption="Students in this district"
          emptyTitle="No students to show yet"
          emptyDescription="Students appear here as soon as a school division refers them to your district."
          emptyActionLabel="Open my referral queue"
          emptyActionHref="/dars/queue/"
        />
      </div>
    </ProductLayout>
  );
}
