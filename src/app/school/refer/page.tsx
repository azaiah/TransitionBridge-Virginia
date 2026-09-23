import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { ReferralFormFromUrl } from '@/components/school/ReferralFormFromUrl';

export const metadata: Metadata = {
  title: 'Submit a referral',
};

export default function SchoolReferPage() {
  return (
    <ProductLayout>
      <div className="mb-8 max-w-3xl mx-auto">
        <h1 className="text-h1 text-ink">Submit a referral</h1>
        <p className="mt-2 text-body text-ink-2">
          The anti-paperwork screen. We never ask for the same fact twice.
        </p>
      </div>
      
      <ReferralFormFromUrl />
    </ProductLayout>
  );
}
