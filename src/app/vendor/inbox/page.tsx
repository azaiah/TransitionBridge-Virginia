import { ProductLayout } from '@/components/layout/ProductLayout';
import { VendorInbox } from '@/components/vendor/VendorInbox';

export const metadata = {
  title: 'Referral inbox',
};

export default function VendorInboxPage() {
  return (
    <ProductLayout>
      <VendorInbox />
    </ProductLayout>
  );
}
