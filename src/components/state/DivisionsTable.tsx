'use client';

import { DataTable } from '@/components/ui/DataTable';
import { MetricLegend } from '@/components/ui/MetricLegend';
import { demoData, getDivisionById } from '@/data';
import { outcomeRates } from '@/lib/metrics';
import type { DivisionMetrics } from '@/data/types';

/** Column definitions users may not share a definition of, explained under the table. */
const LEGEND_KEYS = [
  'referralsReceived',
  'fillRate',
  'daysToAssignment',
  'completionRate',
  'employmentOutcomeRate',
];

export function DivisionsTable({ metrics }: { metrics: DivisionMetrics[] }) {
  const data = metrics.map((m) => {
    const division = getDivisionById(m.divisionId);
    return {
      id: m.divisionId,
      name: division?.name ?? m.divisionId,
      referralsSubmitted: m.referralsSubmitted,
      fillRate: m.referralsSubmitted > 0 ? m.referralsAssigned / m.referralsSubmitted : 0,
      medianDaysToAssignment: m.medianDaysToAssignment,
      ...(() => {
        const o = outcomeRates(demoData.divisionMetrics.filter((x) => x.divisionId === m.divisionId));
        return {
          completionRate: o.completionRate ?? 0,
          employmentOutcomeRate: o.employmentOutcomeRate,
          referralsCompleted: o.completed,
        };
      })(),
      zeroReferralQuarter: m.zeroReferralQuarter,
    };
  });

  return (
    <div className="space-y-3">
      <DataTable
        columns={[
        {
          key: 'name',
          header: 'School division',
          render: (r) => (
            <span className="font-medium text-ink">
              {r.name}
              {r.zeroReferralQuarter && (
                <span className="ml-2 inline-flex items-center rounded-full bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn">
                  Zero referrals
                </span>
              )}
            </span>
          ),
          sortValue: (r) => r.name,
        },
        {
          key: 'referralsSubmitted',
          header: 'Referrals in',
          render: (r) => r.referralsSubmitted.toLocaleString(),
          sortValue: (r) => r.referralsSubmitted,
          numeric: true,
        },
        {
          key: 'fillRate',
          header: 'Fill rate',
          render: (r) => `${Math.round(r.fillRate * 100)}%`,
          sortValue: (r) => r.fillRate,
          numeric: true,
        },
        {
          key: 'medianDaysToAssignment',
          header: 'Days to assign',
          render: (r) => r.medianDaysToAssignment ?? '—',
          sortValue: (r) => r.medianDaysToAssignment ?? 0,
          numeric: true,
        },
        {
          key: 'completionRate',
          header: 'Completion rate (2 years)',
          render: (r) => `${Math.round(r.completionRate * 100)}%`,
          sortValue: (r) => r.completionRate,
          numeric: true,
        },
        {
          key: 'employmentOutcomeRate',
          header: 'Employment rate (2 years)',
          render: (r) =>
            r.employmentOutcomeRate === null ? (
              <span className="text-ink-3" title={`Only ${r.referralsCompleted} completed cases in two years — too few to report a rate`}>
                Too few cases
              </span>
            ) : (
              `${Math.round(r.employmentOutcomeRate * 100)}%`
            ),
          // Unreportable rows sort below every real rate rather than beside 0%.
          sortValue: (r) => r.employmentOutcomeRate ?? -1,
          numeric: true,
        },
        ]}
        rows={data}
        rowKey={(r) => r.id}
        csvFilename="divisions-comparison.csv"
        caption="School divisions compared"
        emptyTitle="No divisions found"
        emptyDescription="No school divisions match the current filters."
      />
      <MetricLegend keys={LEGEND_KEYS} />
    </div>
  );
}
