'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ExplainThis } from '@/components/ui/ExplainThis';
import { Stat } from '@/components/ui/Stat';
import { explain } from '@/lib/definitions';
import { FEDERAL_FY_LABEL, formatDollars, formatMillions } from '@/lib/fiscal';
import { reserveShortfall, reserveUtilization } from '@/lib/metrics';

export interface ReserveSummaryProps {
  award: number;
  requirement: number;
  spentToDate: number;
  projectedYearEnd: number;
  elapsedShare: number;
}

/**
 * The four numbers a CFO needs, then one sentence saying whether there is a problem.
 *
 * The shortfall verdict is a full sentence rather than a colored tile, because the whole
 * point of the screen is that somebody can read it in five seconds and know what to do.
 */
export function ReserveSummary({
  award,
  requirement,
  spentToDate,
  projectedYearEnd,
  elapsedShare,
}: ReserveSummaryProps) {
  const utilization = reserveUtilization(spentToDate, requirement) ?? 0;
  const shortfall = reserveShortfall(projectedYearEnd, requirement);
  const yearElapsedPct = Math.round(elapsedShare * 100);

  return (
    <div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          term="Federal award (illustrative)"
          value={formatMillions(award)}
          explainKey="federalAward"
          note="Not a published Virginia figure"
        />
        <Tile
          term="15% reserve requirement"
          value={formatMillions(requirement)}
          explainKey="reserveRequirement"
          note="The statutory floor for Pre-ETS"
        />
        <Tile
          term="Spent so far this fiscal year"
          value={formatMillions(spentToDate)}
          explainKey="reserveSpentToDate"
          note={`${Math.round(utilization * 100)}% of the requirement, with ${yearElapsedPct}% of the year gone`}
        />
        <Tile
          term="Projected at year end"
          value={formatMillions(projectedYearEnd)}
          explainKey="reserveProjected"
          note="If spending continues at the current pace"
          alert={shortfall > 0}
        />
      </dl>

      {/* Progress against the requirement, with the year-elapsed marker for context. */}
      <div className="mt-6 rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="meta-label">Reserve spent against requirement</p>
          <p className="text-caption text-ink-2">
            {formatDollars(spentToDate)} of {formatDollars(requirement)}
          </p>
        </div>
        <div
          className="relative mt-3 h-4 w-full overflow-hidden rounded-full bg-surface-sunken"
          role="img"
          aria-label={`${Math.round(utilization * 100)} percent of the reserve requirement spent, with ${yearElapsedPct} percent of the fiscal year elapsed`}
        >
          <div
            className="h-full rounded-full bg-[var(--tb-viz-1)]"
            style={{ width: `${Math.min(100, utilization * 100)}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-ink"
            style={{ left: `${yearElapsedPct}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 text-caption text-ink-3">
          The vertical marker is how much of the {FEDERAL_FY_LABEL} has passed. Spend to the left
          of it means the reserve is behind the calendar.
        </p>
      </div>

      <p
        className={`mt-6 flex items-start gap-3 rounded-card border p-4 text-body ${
          shortfall > 0 ? 'border-warn bg-warn-bg text-ink' : 'border-ok bg-ok-bg text-ink'
        }`}
      >
        {shortfall > 0 ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
        )}
        <span>
          {shortfall > 0 ? (
            <>
              <strong>Projected shortfall of {formatMillions(shortfall)}.</strong> At the current
              pace, Pre-ETS spending finishes the year below the 15% reserve requirement. That is{' '}
              {formatDollars(shortfall)} of services that would need to be delivered before
              September 30 to close the gap.
            </>
          ) : (
            <>
              <strong>On track to meet the reserve.</strong> At the current pace, Pre-ETS spending
              finishes the year at or above the 15% requirement.
            </>
          )}
        </span>
      </p>
    </div>
  );
}

function Tile({
  term,
  value,
  explainKey,
  note,
  alert,
}: {
  term: string;
  value: string;
  explainKey: string;
  note: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm ${
        alert ? 'border-l-[3px] border-l-warn' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <dt className="meta-label">{term}</dt>
        <ExplainThis {...explain(explainKey)} />
      </div>
      <dd className="mt-2 text-kpi tabular text-ink">
        <Stat value={value} label={term} provenance={{ kind: 'illustrative' }} />
      </dd>
      <dd className="mt-2 text-caption text-ink-2">{note}</dd>
    </div>
  );
}
