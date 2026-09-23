'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { ExplainThis } from '@/components/ui/ExplainThis';
import { Stat } from '@/components/ui/Stat';
import type { StateMetrics } from '@/data/types';
import { explain } from '@/lib/definitions';
import { WIOA_INDICATOR_SPECS, deltaLabel, formatIndicator, indicatorDelta } from '@/lib/wioa';

/**
 * The six indicators, in statutory order, each with its trend and its "explain this" panel.
 *
 * Direction is carried by an arrow icon AND words, never by color alone, because these
 * screens are read by people using this product on an agency laptop with default settings.
 */
export function WioaIndicatorCards({ history }: { history: StateMetrics[] }) {
  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  if (!current) return null;

  return (
    <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {WIOA_INDICATOR_SPECS.map((spec, index) => {
        const value = current.wioaIndicators[spec.key];
        const delta = previous
          ? indicatorDelta(spec.kind, value, previous.wioaIndicators[spec.key])
          : 0;
        const trend = history.map((row) => ({
          period: row.period,
          value: row.wioaIndicators[spec.key],
        }));

        return (
          <li
            key={spec.key}
            className="rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="meta-label">
                <span className="tabular text-ink-3">{index + 1}. </span>
                {spec.label}
              </p>
              <ExplainThis {...explain(spec.key)} />
            </div>

            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-kpi tabular text-ink">
                <Stat
                  value={formatIndicator(spec.kind, value)}
                  label={spec.label}
                  provenance={{ kind: 'illustrative' }}
                />
              </p>
              <div className="h-10 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--tb-viz-2)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="mt-2 inline-flex items-center gap-1 text-caption text-ink-2">
              <DeltaIcon delta={delta} />
              {spec.kind === 'currency'
                ? `$${Math.abs(delta).toLocaleString()}`
                : `${Math.abs(delta)} points`}{' '}
              {deltaLabel(delta)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** Arrow only — the words next to it carry the meaning for screen readers. */
function DeltaIcon({ delta }: { delta: number }) {
  const Icon = delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;
  return <Icon className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />;
}
