import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { StateFunding } from '@/components/funding/StateFunding';
import { Button } from '@/components/ui/Button';
import { FEDERAL_FY_LABEL } from '@/lib/fiscal';

export const metadata: Metadata = {
  title: 'Funding by source',
};

export default function StateFundingPage() {
  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Who is paying</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            Authorized, utilized, and remaining for {FEDERAL_FY_LABEL}, by funder and by district.
            Amounts are illustrative.
          </p>
        </div>
        <Button variant="ghost" href="/state/">
          Back to the statewide view
        </Button>
      </div>
      <div className="mt-8">
        <StateFunding />
      </div>
    </ProductLayout>
  );
}
