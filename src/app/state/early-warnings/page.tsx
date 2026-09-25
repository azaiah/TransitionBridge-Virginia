'use client';

import { Suspense } from 'react';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { StateEarlyWarnings } from '@/components/escalation/StateEarlyWarnings';
import { Button } from '@/components/ui/Button';

export default function StateEarlyWarningsPage() {
  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Early warnings</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            Referrals past due at 14, 30, and 90 days — waiting for a provider, waiting on a
            consent form, or waiting for a first service.
          </p>
        </div>
        <Button variant="ghost" href="/state/">
          Back to the statewide view
        </Button>
      </div>
      <div className="mt-8">
        <Suspense fallback={<p className="text-body text-ink-2">Loading early warnings…</p>}>
          <StateEarlyWarnings />
        </Suspense>
      </div>
    </ProductLayout>
  );
}
