import { ProductLayout } from '@/components/layout/ProductLayout';
import { VendorScorecardView } from '@/components/vendor/VendorScorecardView';

export const metadata = {
  title: 'My scorecard',
};

export default function VendorScorecardPage() {
  return (
    <ProductLayout>
      <VendorScorecardView />
    </ProductLayout>
  );
}
