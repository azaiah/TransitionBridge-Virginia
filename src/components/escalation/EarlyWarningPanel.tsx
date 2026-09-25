import Link from 'next/link';
import { AlarmClock, Siren, TimerReset } from 'lucide-react';
import type { EscalationStageCounts } from '@/data/types';
import {
  ESCALATION_TIERS,
  STALL_STAGE_LABELS,
  STALL_STAGE_OWNERS,
  TIER_ACTIONS,
  TIER_LABELS,
  type EscalationTier,
  type StallStage,
} from '@/lib/escalation';
import { cn } from '@/lib/utils';

const ICON: Record<EscalationTier, typeof AlarmClock> = { 14: TimerReset, 30: AlarmClock, 90: Siren };

/**
 * The early warning system at a glance: three rungs — 14, 30, and 90 days — and how many
 * referrals sit on each, split by where they are stuck and who can move them. Every count
 * links to exactly those referrals.
 */
export function EarlyWarningPanel({
  counts,
  stages,
  linkFor,
  title = 'Early warnings',
  description,
  dormant,
  className,
}: {
  counts: EscalationStageCounts;
  /** Which stall stages this audience can act on, in display order. */
  stages: readonly StallStage[];
  linkFor: (tier: EscalationTier, stage?: StallStage) => string;
  title?: string;
  description?: string;
  /** Open referrals stalled for more than a year, if this view should mention them. */
  dormant?: number;
  className?: string;
}) {
  const total = (tier: EscalationTier) => stages.reduce((sum, s) => sum + counts[s][tier], 0);
  const all = ESCALATION_TIERS.reduce((sum, tier) => sum + total(tier), 0);

  return (
    <section
      aria-labelledby="early-warnings-title"
      data-coach="early-warnings"
      className={cn('rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="early-warnings-title" className="text-h3 text-ink">
            {title}
          </h2>
          <p className="mt-1 text-caption text-ink-2">
            {description ??
              'Referrals past due, by how long they have waited. Each rung raises it one level: counselor, district manager, state office.'}
          </p>
        </div>
        <p className="text-caption text-ink-2" aria-live="polite">
          {all === 0 ? 'Nothing past due' : `${all.toLocaleString()} past due`}
        </p>
      </div>

      <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ESCALATION_TIERS.map((tier) => {
          const Icon = ICON[tier];
          const n = total(tier);
          return (
            <li
              key={tier}
              className={cn(
                'rounded-control border border-line p-3',
                n > 0 && (tier === 14 ? 'border-l-[3px] border-l-warn' : 'border-l-[3px] border-l-risk'),
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', n > 0 ? (tier === 14 ? 'text-warn' : 'text-risk') : 'text-ink-3')} aria-hidden="true" />
                <p className="meta-label">{TIER_LABELS[tier]}</p>
              </div>
              <Link
                href={linkFor(tier)}
                className="mt-1 block text-kpi tabular text-ink hover:text-orange-deep"
                aria-label={`${n} referrals waiting ${TIER_LABELS[tier]} — ${TIER_ACTIONS[tier]}. View them.`}
              >
                {n.toLocaleString()}
              </Link>
              <p className="text-caption text-ink-2">{TIER_ACTIONS[tier]}</p>
              {stages.length > 1 && (
                <ul className="mt-2 space-y-1 border-t border-line-hair pt-2">
                  {stages.map((stage) => (
                    <li key={stage} className="flex items-baseline justify-between gap-2 text-caption">
                      <Link href={linkFor(tier, stage)} className="text-ink-2 underline-offset-2 hover:text-orange-deep hover:underline">
                        {STALL_STAGE_LABELS[stage]}
                      </Link>
                      <span className="tabular font-medium text-ink">{counts[stage][tier].toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-caption text-ink-3">
        Who moves each: {stages.map((s) => `${STALL_STAGE_LABELS[s].toLowerCase()} — ${STALL_STAGE_OWNERS[s].toLowerCase()}`).join('; ')}.
        {dormant !== undefined && dormant > 0 &&
          ` ${dormant.toLocaleString()} older referrals have been open over a year with no movement and are listed for a close-or-reopen review.`}
      </p>
    </section>
  );
}
