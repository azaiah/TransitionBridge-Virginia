'use client';

import { Suspense } from 'react';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { CounselorFunding } from '@/components/funding/CounselorFunding';
import { Button } from '@/components/ui/Button';

export default function DarsFundingPage() {
  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Funding and hours</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            Who is paying for each student’s services this fiscal year, how many hours were
            authorized, and how many are left. Not a billing system — the guard that stops
            over-billing before it happens.
          </p>
        </div>
        <Button variant="ghost" href="/dars/">
          Back to dashboard
        </Button>
      </div>
      <div className="mt-8">
        <Suspense fallback={<p className="text-body text-ink-2">Loading authorizations…</p>}>
          <CounselorFunding />
        </Suspense>
      </div>
    </ProductLayout>
  );
}
