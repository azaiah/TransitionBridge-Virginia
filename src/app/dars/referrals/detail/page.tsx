'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { ReferralDetail } from '@/components/dars/ReferralDetail';
import { EmptyState } from '@/components/ui/EmptyState';
import { getReferralWithTimeline } from '@/data/records';

/**
 * One referral, chosen by `?id=`.
 *
 * The record id travels in the query string rather than the path because the whole product
 * is served as static files — a path segment per referral would mean eleven thousand
 * prebuilt pages, and a demo that takes an hour to build is a demo nobody rebuilds.
 */
function ReferralFromUrl() {
  const id = useSearchParams().get('id') ?? '';
  const referral = id ? getReferralWithTimeline(id) : undefined;

  if (!referral) {
    return (
      <EmptyState
        title="That referral could not be found"
        description="The record may have been closed, or the link may be incomplete. The queue lists every open referral."
        actionLabel="Back to the referral queue"
        actionHref="/dars/queue/"
      />
    );
  }

  return <ReferralDetail referral={referral} />;
}

export default function ReferralDetailPage() {
  return (
    <ProductLayout>
      <Suspense fallback={<p className="text-body text-ink-2">Loading the referral…</p>}>
        <ReferralFromUrl />
      </Suspense>
    </ProductLayout>
  );
}
