'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { DataTable } from '@/components/ui/DataTable';
import { explainChart } from '@/lib/definitions';
import { WIOA_INDICATOR_SPECS, formatIndicator, type WioaKey } from '@/lib/wioa';
import type { WioaIndicators } from '@/data/types';

export interface BreakdownRow {
  id: string;
  name: string;
  /** District name for a division row; blank for a district row. */
  parentName?: string;
  referralsSubmitted: number;
  indicators: WioaIndicators;
}

export interface WioaBreakdownProps {
  districts: BreakdownRow[];
  divisions: BreakdownRow[];
}

/**
 * One indicator at a time, broken down by district and by division.
 *
 * Showing all six for all 132 divisions at once is unreadable, so the user picks the
 * indicator and everything below follows it. The division table stays sortable so the
 * bottom of the list — the reason anyone opens this screen — is one click away.
 */
export function WioaBreakdown({ districts, divisions }: WioaBreakdownProps) {
  const [selected, setSelected] = useState<WioaKey>('employmentRateQ2');
  const spec = WIOA_INDICATOR_SPECS.find((s) => s.key === selected)!;

  const districtData = [...districts]
    .map((row) => ({ ...row, value: row.indicators[selected] }))
    .sort((a, b) => b.value - a.value);

  const divisionData = divisions.map((row) => ({ ...row, value: row.indicators[selected] }));

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
        <label htmlFor="wioa-indicator" className="meta-label block">
          Show which indicator
        </label>
        <select
          id="wioa-indicator"
          value={selected}
          onChange={(e) => setSelected(e.target.value as WioaKey)}
          className="mt-2 w-full max-w-md rounded-control border border-line bg-surface px-3 py-2 text-body text-ink"
        >
          {WIOA_INDICATOR_SPECS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-caption text-ink-3">
          The chart and both tables below all follow this choice.
        </p>
      </div>

      <ChartFrame
        title={`${spec.label}, by DARS district`}
        explain={explainChart(selected)}
        tableHeaders={['District', spec.shortLabel, 'Referrals received']}
        tableRows={districtData.map((r) => [
          r.name,
          formatIndicator(spec.kind, r.value),
          r.referralsSubmitted,
        ])}
        csvFilename={`wioa-${selected}-by-district.csv`}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={districtData} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tb-border)" vertical={false} />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={64}
              tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
              tickFormatter={(v: number) => formatIndicator(spec.kind, v)}
            />
            <Tooltip
              cursor={{ fill: 'var(--tb-surface-sunken)' }}
              contentStyle={{
                backgroundColor: 'var(--tb-surface)',
                border: '1px solid var(--tb-border)',
                borderRadius: '8px',
              }}
              formatter={(v: number) => [formatIndicator(spec.kind, v), spec.shortLabel]}
            />
            <Bar dataKey="value" fill="var(--tb-viz-1)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <div>
        <h3 className="text-h3 text-ink">{spec.label}, by school division</h3>
        <p className="mt-1 text-caption text-ink-2">
          Sort by the indicator column to find the divisions furthest from the statewide figure.
        </p>
        <DataTable
          className="mt-3"
          columns={[
            {
              key: 'name',
              header: 'Division',
              render: (r) => <span className="font-medium text-ink">{r.name}</span>,
              sortValue: (r) => r.name,
            },
            {
              key: 'parentName',
              header: 'District',
              render: (r) => r.parentName ?? '—',
              sortValue: (r) => r.parentName ?? '',
            },
            {
              key: 'value',
              header: spec.shortLabel,
              render: (r) =>
                r.referralsSubmitted === 0 ? 'No referrals' : formatIndicator(spec.kind, r.value),
              sortValue: (r) => r.value,
              numeric: true,
            },
            {
              key: 'referralsSubmitted',
              header: 'Referrals received',
              render: (r) => r.referralsSubmitted.toLocaleString(),
              sortValue: (r) => r.referralsSubmitted,
              numeric: true,
            },
          ]}
          rows={divisionData}
          rowKey={(r) => r.id}
          csvFilename={`wioa-${selected}-by-division.csv`}
          caption="WIOA indicator by school division"
          emptyTitle="No divisions to show"
          emptyDescription="Choose a different quarter to see division-level outcomes."
        />
      </div>
    </div>
  );
}
