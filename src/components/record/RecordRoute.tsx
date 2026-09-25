'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { TransitionRecord } from './TransitionRecord';

/**
 * The record, chosen by `?id=`. Every portal serves the same component at its own path, so
 * the portal decides whose view it is (src/lib/portal.ts) and the access rules follow.
 * The id travels in the query string because the product is served as static files.
 */
function RecordFromUrl() {
  const id = useSearchParams().get('id') ?? '';
  return <TransitionRecord studentId={id} />;
}

export function RecordRoute() {
  return (
    <ProductLayout>
      <Suspense fallback={<p className="text-body text-ink-2">Loading the transition record…</p>}>
        <RecordFromUrl />
      </Suspense>
    </ProductLayout>
  );
}
