import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { CoverageMap } from '@/components/state/CoverageMap';

export const metadata: Metadata = {
  title: 'Coverage map',
};

export default function StateMapPage() {
  return (
    <ProductLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 text-ink">Virginia coverage map</h1>
          <p className="mt-2 max-w-xl text-body text-ink-2">
            Interactive choropleth of all 133 Virginia localities. Toggle between referral volume,
            vendor coverage, service gaps, and outcomes.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <CoverageMap />
      </div>
    </ProductLayout>
  );
}
