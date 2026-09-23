import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { ComplianceView } from '@/components/school/ComplianceView';

export const metadata: Metadata = {
  title: 'Compliance & documentation',
};

export default function SchoolCompliancePage() {
  return (
    <ProductLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 text-ink">Compliance & documentation</h1>
          <p className="mt-2 max-w-xl text-body text-ink-2">
            Consent forms outstanding, documentation gaps, and students approaching age-out.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <ComplianceView />
      </div>
    </ProductLayout>
  );
}
