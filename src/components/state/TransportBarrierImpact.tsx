'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { explainChart } from '@/lib/definitions';
import type { StateHeadline } from '@/data/types';

export function TransportBarrierImpact({ headline }: { headline: StateHeadline }) {
  const { withBarrier, withoutBarrier } = headline.transportBarrierDaysToService;
  
  const chartData = [
    {
      name: 'No transportation barrier',
      days: withoutBarrier,
    },
    {
      name: 'Transportation barrier',
      days: withBarrier,
    },
  ];

  return (
    <ChartFrame
      title="Transportation barriers delay service start"
      tableHeaders={['Student group', 'Median days to first service']}
      tableRows={chartData.map((r) => [r.name, r.days])}
      csvFilename="transport-barrier-impact.csv"
      explain={explainChart('transportationBarrier')}
    >
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical">
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
            axisLine={false}
            tickLine={false}
            width={160}
          />
          <Tooltip
            cursor={{ fill: 'var(--tb-surface-sunken)' }}
            contentStyle={{
              backgroundColor: 'var(--tb-surface)',
              border: '1px solid var(--tb-border)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [`${value} days`, 'Median wait']}
          />
          <Bar
            dataKey="days"
            fill="var(--tb-viz-4)"
            radius={[0, 4, 4, 0]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
