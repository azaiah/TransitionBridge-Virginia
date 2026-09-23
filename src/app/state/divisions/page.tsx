import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { Button } from '@/components/ui/Button';
import { DivisionsTable } from '@/components/state/DivisionsTable';
import { demoData, CURRENT_PERIOD } from '@/data';

export const metadata: Metadata = {
  title: 'School divisions',
};

export default function StateDivisionsPage() {
  const divisionMetrics = demoData.divisionMetrics.filter((m) => m.period === CURRENT_PERIOD);

  return (
    <ProductLayout>
      <h1 className="text-h1 text-ink">School divisions</h1>
      <p className="mt-2 max-w-xl text-body text-ink-2">
        Comparing referral volume, fill rates, and outcomes across all {demoData.divisions.length} Virginia school divisions.
      </p>

      <div className="mt-12">
        <DivisionsTable metrics={divisionMetrics} />
      </div>

      <div className="mt-8">
        <Button variant="primary" href="/state/">
          Back to statewide view
        </Button>
      </div>
    </ProductLayout>
  );
}
