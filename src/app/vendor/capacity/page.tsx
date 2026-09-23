import { ProductLayout } from '@/components/layout/ProductLayout';
import { VendorCapacity } from '@/components/vendor/VendorCapacity';

export const metadata = {
  title: 'Capacity & coverage',
};

export default function VendorCapacityPage() {
  return (
    <ProductLayout>
      <VendorCapacity />
    </ProductLayout>
  );
}
