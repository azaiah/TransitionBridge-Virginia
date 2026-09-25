'use client';

import { ProductLayout } from '@/components/layout/ProductLayout';
import { JobBoard } from '@/components/jobs/JobBoard';
import { Button } from '@/components/ui/Button';

export default function VendorJobsPage() {
  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Job board</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            Open jobs, paid internships, and work-based learning sites from employer partners in
            the areas you serve — each showing which students on your roster it fits.
          </p>
        </div>
        <Button variant="ghost" href="/vendor/">
          Back to dashboard
        </Button>
      </div>
      <div className="mt-8">
        <JobBoard />
      </div>
    </ProductLayout>
  );
}
