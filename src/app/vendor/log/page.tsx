import { ProductLayout } from '@/components/layout/ProductLayout';
import { VendorLogService } from '@/components/vendor/VendorLogService';

export const metadata = {
  title: 'Log services',
};

export default function VendorLogPage() {
  return (
    <ProductLayout>
      <VendorLogService />
    </ProductLayout>
  );
}
