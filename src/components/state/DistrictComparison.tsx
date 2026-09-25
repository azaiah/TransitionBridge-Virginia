'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { DataTable } from '@/components/ui/DataTable';
import { MetricLegend } from '@/components/ui/MetricLegend';
import { ChartFrame } from '@/components/ui/ChartFrame';
import type { DistrictMetrics } from '@/data/types';
import { demoData, getDistrictById } from '@/data';
import { explainChart } from '@/lib/definitions';
import { outcomeRates } from '@/lib/metrics';

export function DistrictComparison({ metrics }: { metrics: DistrictMetrics[] }) {
  const data = metrics.map((m) => {
    const district = getDistrictById(m.darsDistrictId);
    return {
      id: m.darsDistrictId,
      name: district?.name ?? m.darsDistrictId,
      referralsSubmitted: m.referralsSubmitted,
      fillRate: m.referralsSubmitted > 0 ? m.referralsAssigned / m.referralsSubmitted : 0,
      medianDaysToAssignment: m.medianDaysToAssignment,
      ...(() => {
        const o = outcomeRates(demoData.districtMetrics.filter((x) => x.darsDistrictId === m.darsDistrictId));
        return {
          completionRate: o.completionRate ?? 0,
          employmentOutcomeRate: o.employmentOutcomeRate,
          referralsCompleted: o.completed,
        };
      })(),
      vendorCount: m.vendorCount,
      preEtsSpend: m.preEtsSpend,
    };
  });

  const chartData = [...data].sort((a, b) => b.referralsSubmitted - a.referralsSubmitted);

  return (
    <div className="space-y-6">
      <ChartFrame
        title="District performance comparison"
        explain={explainChart('fillRate')}
        tableHeaders={['District', 'Referrals in', 'Fill rate', 'Completion rate (2 years)']}
        tableRows={chartData.map((r) => [
          r.name,
          r.referralsSubmitted,
          `${Math.round(r.fillRate * 100)}%`,
          `${Math.round(r.completionRate * 100)}%`,
        ])}
        csvFilename="district-performance.csv"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="h-48">
            <p className="mb-2 text-label text-ink-2">Referrals in</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 'dataMax']} />
                <Tooltip
                  cursor={{ fill: 'var(--tb-surface-sunken)' }}
                  contentStyle={{
                    backgroundColor: 'var(--tb-surface)',
                    border: '1px solid var(--tb-border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="referralsSubmitted" name="Referrals" fill="var(--tb-viz-1)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-48">
            <p className="mb-2 text-label text-ink-2">Fill rate</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 1]} />
                <Tooltip
                  cursor={{ fill: 'var(--tb-surface-sunken)' }}
                  contentStyle={{
                    backgroundColor: 'var(--tb-surface)',
                    border: '1px solid var(--tb-border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(v: number) => [`${Math.round(v * 100)}%`, 'Fill rate']}
                />
                <Bar dataKey="fillRate" fill="var(--tb-viz-2)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-48">
            <p className="mb-2 text-label text-ink-2">Completion rate (2 years)</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 1]} />
                <Tooltip
                  cursor={{ fill: 'var(--tb-surface-sunken)' }}
                  contentStyle={{
                    backgroundColor: 'var(--tb-surface)',
                    border: '1px solid var(--tb-border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(v: number) => [`${Math.round(v * 100)}%`, 'Completion rate']}
                />
                <Bar dataKey="completionRate" fill="var(--tb-viz-3)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartFrame>

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'District',
            render: (r) => <span className="font-medium text-ink">{r.name}</span>,
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
            sortValue: (r) => r.employmentOutcomeRate ?? -1,
            numeric: true,
          },
          {
            key: 'vendorCount',
            header: 'Vendors',
            render: (r) => r.vendorCount,
            sortValue: (r) => r.vendorCount,
            numeric: true,
          },
          {
            key: 'preEtsSpend',
            header: 'Reserve spend',
            render: (r) => `$${(r.preEtsSpend / 1000000).toFixed(1)}M`,
            sortValue: (r) => r.preEtsSpend,
            numeric: true,
          },
        ]}
        rows={data}
        rowKey={(r) => r.id}
        csvFilename="district-comparison.csv"
        caption="Districts compared"
      />

      <MetricLegend
        keys={[
          'fillRate',
          'daysToAssignment',
          'completionRate',
          'employmentOutcomeRate',
          'reserveSpentToDate',
        ]}
      />
    </div>
  );
}
