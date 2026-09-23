'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { StudentDetail } from '@/components/dars/StudentDetail';
import { EmptyState } from '@/components/ui/EmptyState';
import { getStudentById } from '@/data/records';
import { getServicesForStudent } from '@/data/services';

/** One student record, chosen by `?id=`. See the referral detail page for why. */
function StudentFromUrl() {
  const id = useSearchParams().get('id') ?? '';
  const student = id ? getStudentById(id) : undefined;

  if (!student) {
    return (
      <EmptyState
        title="That student record could not be found"
        description="The link may be incomplete. The student list shows everyone on your caseload."
        actionLabel="Back to my students"
        actionHref="/dars/students/"
      />
    );
  }

  return <StudentDetail student={student} services={getServicesForStudent(id)} />;
}

export default function StudentDetailPage() {
  return (
    <ProductLayout>
      <Suspense fallback={<p className="text-body text-ink-2">Loading the student record…</p>}>
        <StudentFromUrl />
      </Suspense>
    </ProductLayout>
  );
}
