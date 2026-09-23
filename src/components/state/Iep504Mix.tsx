'use client';

import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { Button } from '@/components/ui/Button';
import { explainChart } from '@/lib/definitions';
import type { DistrictMetrics, DivisionMetrics } from '@/data/types';
import { PLAN_TYPE_LABELS } from '@/data/types';
import { getDistrictById, getDivisionById } from '@/data';

export function Iep504Mix({
  districtMetrics,
  divisionMetrics,
}: {
  districtMetrics: DistrictMetrics[];
  divisionMetrics: DivisionMetrics[];
}) {
  const [view, setView] = useState<'district' | 'division'>('district');

  const data = view === 'district'
    ? districtMetrics.map((m) => {
        const district = getDistrictById(m.darsDistrictId);
        const total = m.planTypeMix.IEP + m.planTypeMix.SECTION_504 + m.planTypeMix.DOCUMENTED_OTHER;
        return {
          id: m.darsDistrictId,
          name: district?.name ?? m.darsDistrictId,
          IEP: total > 0 ? (m.planTypeMix.IEP / total) * 100 : 0,
          SECTION_504: total > 0 ? (m.planTypeMix.SECTION_504 / total) * 100 : 0,
          DOCUMENTED_OTHER: total > 0 ? (m.planTypeMix.DOCUMENTED_OTHER / total) * 100 : 0,
        };
      })
    : divisionMetrics
        .map((m) => {
          const division = getDivisionById(m.divisionId);
          const total = m.planTypeMix.IEP + m.planTypeMix.SECTION_504 + m.planTypeMix.DOCUMENTED_OTHER;
          return {
            id: m.divisionId,
            name: division?.name ?? m.divisionId,
            IEP: total > 0 ? (m.planTypeMix.IEP / total) * 100 : 0,
            SECTION_504: total > 0 ? (m.planTypeMix.SECTION_504 / total) * 100 : 0,
            DOCUMENTED_OTHER: total > 0 ? (m.planTypeMix.DOCUMENTED_OTHER / total) * 100 : 0,
          };
        })
        // Only show top 15 divisions by 504 share to keep chart readable
        .sort((a, b) => b.SECTION_504 - a.SECTION_504)
        .slice(0, 15);

  const chartData = [...data].sort((a, b) => b.SECTION_504 - a.SECTION_504);

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-10 flex gap-1">
        <Button
          variant={view === 'district' ? 'primary' : 'ghost'}
          className="!py-1 !px-2 text-xs"
          onClick={() => setView('district')}
        >
          Districts
        </Button>
        <Button
          variant={view === 'division' ? 'primary' : 'ghost'}
          className="!py-1 !px-2 text-xs"
          onClick={() => setView('division')}
        >
          Divisions (Top 15)
        </Button>
      </div>
      <ChartFrame
        title="Referral composition: IEP vs. 504"
        tableHeaders={['Region', 'IEP', 'Section 504', 'Other']}
        tableRows={chartData.map((r) => [
          r.name,
          `${r.IEP.toFixed(1)}%`,
          `${r.SECTION_504.toFixed(1)}%`,
          `${r.DOCUMENTED_OTHER.toFixed(1)}%`,
        ])}
        csvFilename="iep-504-mix.csv"
        explain={explainChart('planType')}
      >
        <ResponsiveContainer width="100%" height={view === 'district' ? 280 : 400}>
          <BarChart data={chartData} margin={{ top: 32, right: 8, left: 0, bottom: 0 }} layout="vertical">
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip
              cursor={{ fill: 'var(--tb-surface-sunken)' }}
              contentStyle={{
                backgroundColor: 'var(--tb-surface)',
                border: '1px solid var(--tb-border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`,
                PLAN_TYPE_LABELS[name as keyof typeof PLAN_TYPE_LABELS] ?? name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              formatter={(value) => PLAN_TYPE_LABELS[value as keyof typeof PLAN_TYPE_LABELS] ?? value}
            />
            <Bar dataKey="IEP" stackId="a" fill="var(--tb-viz-1)" />
            <Bar dataKey="SECTION_504" stackId="a" fill="var(--tb-viz-3)" />
            <Bar dataKey="DOCUMENTED_OTHER" stackId="a" fill="var(--tb-viz-neutral)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
