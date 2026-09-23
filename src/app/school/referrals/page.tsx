import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { MyReferralsTable } from '@/components/school/MyReferralsTable';

export const metadata: Metadata = {
  title: 'My referrals',
};

export default function SchoolReferralsPage() {
  return (
    <ProductLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 text-ink">My referrals</h1>
          <p className="mt-2 max-w-xl text-body text-ink-2">
            Live status for every referral you&apos;ve submitted. Full transparency across the boundary.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <MyReferralsTable />
      </div>
    </ProductLayout>
  );
}
