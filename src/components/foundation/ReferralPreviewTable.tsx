'use client';

import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import type { ReferralStatus } from '@/data/types';

type Row = {
  id: string;
  status: ReferralStatus;
  division: string;
  waiting: number;
};

export function ReferralPreviewTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      columns={[
        { key: 'id', header: 'Reference', render: (r) => r.id, sortValue: (r) => r.id },
        {
          key: 'division',
          header: 'School division',
          render: (r) => r.division,
          sortValue: (r) => r.division,
        },
        {
          key: 'status',
          header: 'Status',
          render: (r) => <StatusPill status={r.status} />,
          sortValue: (r) => r.status,
        },
        {
          key: 'waiting',
          header: 'Waiting (days)',
          render: (r) => r.waiting,
          sortValue: (r) => r.waiting,
          numeric: true,
        },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      csvFilename="referrals-preview.csv"
      caption="Recent referrals"
      emptyTitle="No referrals yet"
      emptyDescription="When referrals are submitted, they appear here oldest first."
      emptyActionLabel="See all referrals"
    />
  );
}
