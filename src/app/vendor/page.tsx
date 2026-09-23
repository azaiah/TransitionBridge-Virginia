import { ProductLayout } from '@/components/layout/ProductLayout';
import { VendorDashboard } from '@/components/vendor/VendorDashboard';

export const metadata = {
  // The product says "provider" everywhere a user can see, including the browser tab.
  title: 'Provider workspace',
};

export default function VendorPage() {
  return (
    <ProductLayout>
      <VendorDashboard />
    </ProductLayout>
  );
}
