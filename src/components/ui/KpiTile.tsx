'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, Minus, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import type { TrendPoint } from '@/data/types';
import { ExplainThis } from './ExplainThis';
import { Stat } from './Stat';
import { explain } from '@/lib/definitions';
import { cn } from '@/lib/utils';

export interface KpiTileProps {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  trend?: TrendPoint[];
  href: string;
  /** Words on the link under the tile. Defaults to "View records". */
  linkLabel?: string;
  alert?: boolean;
  /** Key into src/lib/definitions — adds the "?" panel to the tile. */
  explainKey?: string;
  /**
   * One line under the number, for saying what it is measured over or why it is blank.
   * A rate computed from a handful of cases has to say so.
   */
  note?: string;
  className?: string;
}

function DeltaBadge({ delta, label }: { delta: number; label?: string }) {
  const up = delta > 0;
  const flat = delta === 0;
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  const text = label ?? (flat ? 'No change' : up ? 'Up' : 'Down');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-caption font-medium',
        flat && 'text-ink-3',
        up && 'text-warn',
        !flat && !up && 'text-ok',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>
        {Math.abs(delta)}% {text}
      </span>
    </span>
  );
}

/**
 * The number, its trend, and a link to the records behind it.
 *
 * The card is a container rather than one giant link, because the "explain this" control is
 * a button and a button cannot legally sit inside a link. Everything below the label is
 * still one large click target.
 */
export function KpiTile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  trend,
  href,
  linkLabel = 'View records',
  alert,
  explainKey,
  note,
  className,
}: KpiTileProps) {
  let computedDelta = delta;
  if (computedDelta === undefined && trend && trend.length >= 2) {
    const current = trend[trend.length - 1].value;
    const previous = trend[trend.length - 2].value;
    if (previous !== 0) {
      computedDelta = Math.round(((current - previous) / previous) * 100);
    } else {
      computedDelta = current > 0 ? 100 : 0;
    }
  }

  return (
    <div
      className={cn(
        'group rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm',
        'transition-shadow duration-[var(--tb-dur-hover)] hover:shadow-md',
        alert && 'border-l-[3px] border-l-warn',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="meta-label">{label}</p>
        <span className="flex shrink-0 items-center gap-1">
          {alert && <AlertTriangle className="h-4 w-4 text-warn" aria-hidden="true" />}
          {explainKey && <ExplainThis {...explain(explainKey)} />}
        </span>
      </div>
      <Link
        href={href}
        aria-label={`${label}: ${
          typeof value === 'number' ? value.toLocaleString('en-US') : value
        }${unit ? ` ${unit}` : ''} — ${linkLabel.toLowerCase()}`}
        className="mt-2 flex items-end justify-between gap-4"
      >
        <p className="text-kpi tabular text-ink">
          <Stat value={value} provenance={{ kind: 'illustrative' }} unit={unit} />
        </p>
        {trend && trend.length > 0 && (
          <div className="h-10 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={alert ? 'var(--tb-warn)' : 'var(--tb-viz-2)'}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Link>
      {note && <p className="mt-2 text-caption text-ink-2">{note}</p>}
      {computedDelta !== undefined && (
        <div className="mt-2">
          <DeltaBadge delta={computedDelta} label={deltaLabel} />
        </div>
      )}
      <Link
        href={href}
        className="mt-3 block text-caption text-ink-3 group-hover:text-orange-deep"
      >
        {linkLabel}<span aria-hidden="true"> →</span>
        <span className="sr-only"> for {label}</span>
      </Link>
    </div>
  );
}
