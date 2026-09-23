import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { Button } from '@/components/ui/Button';
import { VendorsTable } from '@/components/state/VendorsTable';
import { demoData } from '@/data';

export const metadata: Metadata = {
  title: 'Provider capacity',
};

export default function StateVendorsPage() {
  const scorecards = demoData.vendorScorecards;

  return (
    <ProductLayout>
      <h1 className="text-h1 text-ink">Provider capacity and performance</h1>
      <p className="mt-2 max-w-xl text-body text-ink-2">
        All {scorecards.length} approved Pre-ETS providers, with acceptance rate, response
        time, and how much of their stated capacity is in use.
      </p>

      <div className="mt-12">
        <VendorsTable scorecards={scorecards} />
      </div>

      <div className="mt-8">
        <Button variant="primary" href="/state/">
          Back to statewide view
        </Button>
      </div>
    </ProductLayout>
  );
}
