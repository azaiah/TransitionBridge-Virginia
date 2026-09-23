'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { explainChart } from '@/lib/definitions';
import type { StateHeadline } from '@/data/types';
import { ACTIVITY_LABELS } from '@/data/types';

export function ActivityMix({ headline }: { headline: StateHeadline }) {
  const mix = headline.activityMix;
  const wblPct = Math.round(mix.work_based_learning * 100);
  
  const chartData = Object.entries(mix)
    .map(([key, share]) => ({
      key,
      name: ACTIVITY_LABELS[key as keyof typeof ACTIVITY_LABELS],
      share: share * 100,
    }))
    .sort((a, b) => b.share - a.share);

  return (
    <ChartFrame
      title={`Work-based learning is ${wblPct}% of services delivered`}
      tableHeaders={['Activity', 'Share']}
      tableRows={chartData.map((r) => [r.name, `${r.share.toFixed(1)}%`])}
      csvFilename="activity-mix.csv"
      explain={explainChart('workBasedLearningShare')}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical">
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
            axisLine={false}
            tickLine={false}
            width={180}
          />
          <Tooltip
            cursor={{ fill: 'var(--tb-surface-sunken)' }}
            contentStyle={{
              backgroundColor: 'var(--tb-surface)',
              border: '1px solid var(--tb-border)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Share of services']}
          />
          <Bar
            dataKey="share"
            fill="var(--tb-viz-2)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
