'use client';

import Link from 'next/link';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { useRoleOptional } from '@/context/RoleContext';
import { getPersonaById, demoData } from '@/data';
import { getReferralsForDistrict, students } from '@/data/records';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { STATUS_LABELS } from '@/data/types';

export default function DarsStudentsPage() {
  const roleCtx = useRoleOptional();
  const personaId = roleCtx?.personaId;
  const persona = personaId ? getPersonaById(personaId) : null;
  
  const districtId = persona?.scopeId ?? demoData.districts[0].id;
  const allDistrictReferrals = getReferralsForDistrict(districtId);
  
  // Get unique students from the district's referrals
  const districtStudentIds = new Set(allDistrictReferrals.map(r => r.studentId));
  const districtStudents = students.filter(s => districtStudentIds.has(s.id));

  const data = districtStudents.map(s => {
    // Find latest referral for status
    const studentReferrals = allDistrictReferrals.filter(r => r.studentId === s.id);
    const latestReferral = studentReferrals.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0];
    
    return {
      id: s.id,
      name: s.displayName,
      age: s.age,
      status: latestReferral?.status ?? null,
      referralCount: studentReferrals.length,
    };
  });

  return (
    <ProductLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 text-ink">Students</h1>
          <p className="mt-2 text-body text-ink-2">
            All students with referrals in your district.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Student name',
              render: (r) => (
                <Link href={`/dars/students/detail/?id=${r.id}`} className="font-medium text-orange-deep hover:underline">
                  {r.name}
                </Link>
              ),
              sortValue: (r) => r.name,
            },
            {
              key: 'id',
              header: 'Student reference',
              render: (r) => <span className="font-mono text-caption text-ink-2">{r.id}</span>,
              sortValue: (r) => r.id,
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
              render: (r) =>
                r.status ? <StatusPill status={r.status} /> : 'No referral yet',
              sortValue: (r) => (r.status ? STATUS_LABELS[r.status] : 'No referral yet'),
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
