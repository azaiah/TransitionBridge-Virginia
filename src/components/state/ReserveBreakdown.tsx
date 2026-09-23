'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { explainChart } from '@/lib/definitions';
import { formatDollars, formatMillions } from '@/lib/fiscal';

export interface NamedSpend {
  name: string;
  spend: number;
}

export interface ProjectionPoint {
  period: string;
  /** Cumulative spend actually recorded. Null for quarters still ahead. */
  actual: number | null;
  /** The straight line, drawn across the whole year including the quarters ahead. */
  projected: number;
}

export interface ReserveBreakdownProps {
  byDistrict: NamedSpend[];
  byActivity: NamedSpend[];
  projection: ProjectionPoint[];
  requirement: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--tb-surface)',
  border: '1px solid var(--tb-border)',
  borderRadius: '8px',
};

/** Where the reserve went, and where it lands if nothing changes. */
export function ReserveBreakdown({
  byDistrict,
  byActivity,
  projection,
  requirement,
}: ReserveBreakdownProps) {
  const districtData = [...byDistrict].sort((a, b) => b.spend - a.spend);
  const activityData = [...byActivity].sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-6">
      <ChartFrame
        title="Pre-ETS spend to date, by DARS district"
        explain={explainChart('reserveSpentToDate')}
        tableHeaders={['District', 'Spend this fiscal year']}
        tableRows={districtData.map((r) => [r.name, formatDollars(r.spend)])}
        csvFilename="reserve-spend-by-district.csv"
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
              tickFormatter={(v: number) => formatMillions(v)}
            />
            <Tooltip
              cursor={{ fill: 'var(--tb-surface-sunken)' }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [formatDollars(v), 'Spend']}
            />
            <Bar dataKey="spend" fill="var(--tb-viz-1)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        title="Pre-ETS spend to date, by required activity"
        explain={explainChart('requiredActivities')}
        tableHeaders={['Activity', 'Spend this fiscal year']}
        tableRows={activityData.map((r) => [r.name, formatDollars(r.spend)])}
        csvFilename="reserve-spend-by-activity.csv"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={activityData}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tb-border)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
              tickFormatter={(v: number) => formatMillions(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={190}
              tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--tb-surface-sunken)' }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [formatDollars(v), 'Spend']}
            />
            <Bar dataKey="spend" fill="var(--tb-viz-2)" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        title="Straight-line projection against the 15% requirement"
        explain={explainChart('reserveProjected')}
        tableHeaders={['Quarter', 'Cumulative spend', 'Straight-line projection']}
        tableRows={projection.map((p) => [
          p.period,
          p.actual === null ? 'Not yet reached' : formatDollars(p.actual),
          formatDollars(p.projected),
        ])}
        csvFilename="reserve-projection.csv"
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={projection} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tb-border)" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
              tickFormatter={(v: number) => formatMillions(v)}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              // Quarters still ahead have no recorded spend, so they read as words.
              formatter={(value, name) => [
                typeof value === 'number' ? formatDollars(value) : 'Not yet reached',
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {/* The requirement is a line, not a color, so the gap is readable in print. */}
            <ReferenceLine
              y={requirement}
              stroke="var(--tb-ink-2)"
              strokeDasharray="6 3"
              label={{
                value: '15% requirement',
                position: 'insideTopLeft',
                fill: 'var(--tb-ink-2)',
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Recorded spend"
              stroke="var(--tb-viz-1)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="projected"
              name="Straight-line projection"
              stroke="var(--tb-viz-3)"
              strokeDasharray="5 4"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
