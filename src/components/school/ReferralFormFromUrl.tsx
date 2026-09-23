'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReferralForm } from './ReferralForm';

/**
 * Reads `?studentId=` on the client and prefills the form with it.
 *
 * The read has to happen in the browser: the site is served as static files, so there is
 * no server left at run time to hand the query string to the page.
 */
function FormWithUrlStudent() {
  const studentId = useSearchParams().get('studentId') ?? undefined;
  return <ReferralForm initialStudentId={studentId} />;
}

export function ReferralFormFromUrl() {
  return (
    <Suspense fallback={<p className="text-body text-ink-2">Loading the referral form…</p>}>
      <FormWithUrlStudent />
    </Suspense>
  );
}
