import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { ReportBuilder } from '@/components/state/ReportBuilder';

export const metadata: Metadata = {
  title: 'Report builder',
};

export default function StateReportsPage() {
  return (
    <ProductLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 text-ink">Report builder</h1>
          <p className="mt-2 max-w-xl text-body text-ink-2">
            Generate a branded, dated report for any scope and period. Export to CSV or print to PDF.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <ReportBuilder />
      </div>
    </ProductLayout>
  );
}
