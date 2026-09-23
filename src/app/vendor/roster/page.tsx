import { ProductLayout } from '@/components/layout/ProductLayout';
import { VendorRoster } from '@/components/vendor/VendorRoster';

export const metadata = {
  title: 'My roster',
};

export default function VendorRosterPage() {
  return (
    <ProductLayout>
      <VendorRoster />
    </ProductLayout>
  );
}
