import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { Button } from '@/components/ui/Button';
import { DistrictComparison } from '@/components/state/DistrictComparison';
import { demoData, CURRENT_PERIOD } from '@/data';

export const metadata: Metadata = {
  title: 'DARS districts',
};

export default function StateDistrictsPage() {
  const districtMetrics = demoData.districtMetrics.filter((m) => m.period === CURRENT_PERIOD);

  return (
    <ProductLayout>
      <h1 className="text-h1 text-ink">DARS districts</h1>
      <p className="mt-2 max-w-xl text-body text-ink-2">
        Comparing referral volume, fill rates, and outcomes across the {demoData.districts.length} districts.
      </p>

      <div className="mt-12">
        <DistrictComparison metrics={districtMetrics} />
      </div>

      <div className="mt-8">
        <Button variant="primary" href="/state/">
          Back to statewide view
        </Button>
      </div>
    </ProductLayout>
  );
}
