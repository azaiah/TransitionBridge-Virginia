'use client';

import { ProductLayout } from '@/components/layout/ProductLayout';
import { AuditLog } from '@/components/privacy/AuditLog';
import { Button } from '@/components/ui/Button';

export default function StateAuditPage() {
  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Access and audit log</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            Who did what, across every portal: names shown, documents opened, lists downloaded,
            and every attempt that was refused.
          </p>
        </div>
        <Button variant="ghost" href="/state/">
          Back to the statewide view
        </Button>
      </div>
      <div className="mt-8">
        <AuditLog />
      </div>
    </ProductLayout>
  );
}
