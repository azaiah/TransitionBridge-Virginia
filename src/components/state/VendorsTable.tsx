'use client';

import { DataTable } from '@/components/ui/DataTable';
import type { VendorScorecard } from '@/data/types';
import { getDistrictById } from '@/data';
import { reportableRate } from '@/lib/metrics';

export function VendorsTable({ scorecards }: { scorecards: VendorScorecard[] }) {
  const data = scorecards.map((s) => {
    const district = getDistrictById(s.darsDistrictId);
    return {
      id: s.vendorId,
      name: s.vendorName,
      districtName: district?.name ?? s.darsDistrictId,
      capacityUsedPct: s.capacityUsedPct,
      offersReceived: s.offersReceived,
      acceptanceRate: s.acceptanceRate,
      medianResponseHours: s.medianResponseHours,
      studentsServed: s.studentsServed,
      completionRate: s.completionRate,
      // A provider that served four students has no employment rate worth publishing.
      employmentOutcomeRate: reportableRate(s.employmentOutcomeRate, s.studentsServed),
      medianPlacementWage: s.medianPlacementWage,
      retention90DayRate: s.retention90DayRate,
    };
  });

  return (
    <DataTable
      columns={[
        {
          key: 'name',
          header: 'Provider',
          render: (r) => (
            <div>
              <div className="font-medium text-ink">{r.name}</div>
              <div className="text-caption text-ink-3">{r.districtName}</div>
            </div>
          ),
          sortValue: (r) => r.name,
        },
        {
          key: 'capacityUsedPct',
          header: 'Capacity used',
          render: (r) => (
            <span className={r.capacityUsedPct > 0.85 ? 'font-medium text-warn' : ''}>
              {Math.round(r.capacityUsedPct * 100)}%
            </span>
          ),
          sortValue: (r) => r.capacityUsedPct,
          numeric: true,
        },
        {
          key: 'acceptanceRate',
          header: 'Acceptance',
          render: (r) => `${Math.round(r.acceptanceRate * 100)}%`,
          sortValue: (r) => r.acceptanceRate,
          numeric: true,
        },
        {
          key: 'medianResponseHours',
          header: 'Response time',
          render: (r) => `${r.medianResponseHours}h`,
          sortValue: (r) => r.medianResponseHours,
          numeric: true,
        },
        {
          key: 'studentsServed',
          header: 'Students served',
          render: (r) => r.studentsServed.toLocaleString(),
          sortValue: (r) => r.studentsServed,
          numeric: true,
        },
        {
          key: 'completionRate',
          header: 'Completion',
          render: (r) => `${Math.round(r.completionRate * 100)}%`,
          sortValue: (r) => r.completionRate,
          numeric: true,
        },
        {
          key: 'employmentOutcomeRate',
          header: 'Employment',
          render: (r) =>
            r.employmentOutcomeRate === null ? (
              <span className="text-ink-3" title={`Only ${r.studentsServed} students served — too few to report a rate`}>
                Too few
              </span>
            ) : (
              `${Math.round(r.employmentOutcomeRate * 100)}%`
            ),
          sortValue: (r) => r.employmentOutcomeRate ?? -1,
          numeric: true,
        },
        {
          key: 'medianPlacementWage',
          header: 'Median wage',
          render: (r) => (r.medianPlacementWage ? `$${r.medianPlacementWage.toFixed(2)}` : '—'),
          sortValue: (r) => r.medianPlacementWage ?? 0,
          numeric: true,
        },
        {
          key: 'retention90DayRate',
          header: '90-day retention',
          render: (r) => (r.retention90DayRate !== null ? `${Math.round(r.retention90DayRate * 100)}%` : '—'),
          sortValue: (r) => r.retention90DayRate ?? 0,
          numeric: true,
        },
      ]}
      rows={data}
      rowKey={(r) => r.id}
      csvFilename="provider-scorecards.csv"
      caption="Provider scorecards"
      emptyTitle="No providers found"
      emptyDescription="No providers match the current filters."
    />
  );
}
