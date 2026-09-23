'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { demoData, getCurrentStateMetrics } from '@/data';
import { Stat } from '@/components/ui/Stat';
import { cn } from '@/lib/utils';

/**
 * Live hero preview of the statewide command view — the product IS the hero image.
 * Animated KPI pulse; respects prefers-reduced-motion via global CSS.
 */
export function HeroPreview({ className }: { className?: string }) {
  const state = getCurrentStateMetrics();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, []);

  const chartData = demoData.districts.slice(0, 6).map((d) => {
    const m = demoData.districtMetrics.find(
      (x) => x.darsDistrictId === d.id && x.period === state?.period,
    );
    return {
      name: d.name.replace(' District', '').split(' ')[0] ?? d.name,
      referrals: m?.referralsSubmitted ?? 0,
    };
  });

  const kpis = [
    { label: 'Active referrals', value: state?.totals.referralsInService ?? 0 },
    { label: 'Unassigned >14 days', value: state?.unassignedOver14Days ?? 0, alert: true },
    { label: 'Zero-referral divisions', value: state?.divisionsWithZeroReferrals ?? 0, alert: true },
  ];

  return (
    <div
      className={cn(
        'card overflow-hidden shadow-lg ring-1 ring-orange-bright/20',
        className,
      )}
      aria-label="Live preview of the statewide command view (demonstration data)"
    >
      <div className="border-b border-line bg-surface-sunken px-4 py-2">
        <p className="meta-label">Statewide command view · demonstration data</p>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={cn(
              'rounded-control border border-line bg-surface px-3 py-2 transition-opacity duration-[var(--tb-dur-chart)]',
              kpi.alert && 'border-l-[3px] border-l-warn',
              tick % 3 === i && 'opacity-100 ring-1 ring-orange-subtle',
            )}
          >
            <p className="text-meta uppercase tracking-wide text-ink-3">{kpi.label}</p>
            <p className="mt-1 text-kpi tabular text-ink">
              <Stat value={kpi.value} provenance={{ kind: 'illustrative' }} />
            </p>
          </div>
        ))}
      </div>
      <div className="h-36 border-t border-line px-2 pb-3 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
            <YAxis tick={{ fontSize: 10 }} width={32} />
            <Bar dataKey="referrals" fill="var(--tb-viz-3)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
