import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { Button } from '@/components/ui/Button';
import { referrals } from '@/data/records';
import { ReferralQueue } from '@/components/dars/ReferralQueue';

export const metadata: Metadata = {
  title: 'Referral queue',
};

export default function DarsQueuePage() {
  return (
    <ProductLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 text-ink">Referral queue</h1>
          <p className="mt-2 max-w-xl text-body text-ink-2">
            The triage table — sortable, filterable, oldest first.
          </p>
        </div>
        <Button variant="ghost" href="/dars/">
          Back to dashboard
        </Button>
      </div>
      
      <div className="mt-8">
        <ReferralQueue initialReferrals={referrals} />
      </div>
    </ProductLayout>
  );
}
