'use client';

import { useRoleOptional } from '@/context/RoleContext';
import { getPersonaById, demoData } from '@/data';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { explainChart } from '@/lib/definitions';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

export function VendorScorecardView() {
  const roleCtx = useRoleOptional();
  const personaId = roleCtx?.personaId;
  const persona = personaId ? getPersonaById(personaId) : null;
  
  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find(v => v.id === vendorId);
  const scorecard = demoData.vendorScorecards.find(s => s.vendorId === vendorId);

  if (!vendor || !scorecard) return null;

  // Build anonymous peer comparison data
  const districtPeers = demoData.vendorScorecards.filter(s => s.darsDistrictId === scorecard.darsDistrictId);
  
  const buildPeerChartData = (
    key: keyof typeof scorecard,
    higherIsBetter: boolean
  ) => {
    return districtPeers
      .map(p => ({
        id: p.vendorId,
        value: (p[key] as number) ?? 0,
        isMe: p.vendorId === vendorId,
      }))
      .sort((a, b) => higherIsBetter ? b.value - a.value : a.value - b.value);
  };

  const MetricChart = ({ 
    title, 
    data, 
    format, 
    median, 
    explainKey,
  }: { 
    title: string; 
    data: any[]; 
    format: (v: number) => string;
    median: number;
    /** Key into src/lib/definitions, so the "?" panel matches the rest of the product. */
    explainKey?: string;
  }) => (
    <ChartFrame
      title={title}
      explain={explainKey ? explainChart(explainKey) : undefined}
      tableHeaders={['Provider', 'Value']}
      tableRows={data.map((r, i) => [r.isMe ? 'You' : `Peer ${i+1}`, format(r.value)])}
      csvFilename={`${title.toLowerCase().replace(/\s+/g, '-')}.csv`}
    >
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="id" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            cursor={{ fill: 'var(--tb-surface-sunken)' }}
            contentStyle={{
              backgroundColor: 'var(--tb-surface)',
              border: '1px solid var(--tb-border)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [format(value), '']}
            labelFormatter={(_label, payload) => payload[0]?.payload.isMe ? 'You' : 'Peer Provider'}
          />
          <ReferenceLine y={median} stroke="var(--tb-ink-3)" strokeDasharray="3 3" label={{ position: 'top', value: `Median: ${format(median)}`, fill: 'var(--tb-ink-3)', fontSize: 11 }} />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.isMe ? 'var(--tb-orange-deep)' : 'var(--tb-viz-2)'} opacity={entry.isMe ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-h1 text-ink">My scorecard</h1>
        <p className="mt-2 text-body text-ink-2">
          Your performance compared to anonymous peers in your district.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <MetricChart
          title="Acceptance rate"
          data={buildPeerChartData('acceptanceRate', true)}
          format={v => `${Math.round(v * 100)}%`}
          median={scorecard.acceptanceRate}
          explainKey="acceptanceRate"
        />
        
        <MetricChart
          title="Median response time"
          data={buildPeerChartData('medianResponseHours', false)}
          format={v => `${v}h`}
          median={scorecard.medianResponseHours}
        />
        
        <MetricChart
          title="Service completion rate"
          data={buildPeerChartData('completionRate', true)}
          format={v => `${Math.round(v * 100)}%`}
          median={scorecard.completionRate}
          explainKey="completionRate"
        />
        
        <MetricChart
          title="Employment outcome rate"
          data={buildPeerChartData('employmentOutcomeRate', true)}
          format={v => `${Math.round(v * 100)}%`}
          median={scorecard.employmentOutcomeRate}
          explainKey="employmentOutcomeRate"
        />

        <div className="lg:col-span-2">
          <h2 className="text-h2 text-ink mb-4">Placement quality</h2>
          <p className="text-body text-ink-2 mb-6">
            Measuring only placement count is a failure mode. We track wage and retention.
          </p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <MetricChart
              title="Median placement wage"
              data={buildPeerChartData('medianPlacementWage', true)}
              format={v => `$${v.toFixed(2)}/hr`}
              median={scorecard.medianPlacementWage ?? 0}
            />
            
            <MetricChart
              title="90-day retention rate"
              data={buildPeerChartData('retention90DayRate', true)}
              format={v => `${Math.round(v * 100)}%`}
              median={scorecard.retention90DayRate ?? 0}
              explainKey="retention90Day"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
