'use client';

import Link from 'next/link';
import type { FunnelStage } from '@/data/types';
import { ExplainThis } from '@/components/ui/ExplainThis';
import { cn } from '@/lib/utils';

export function ReferralFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count));

  const colors = [
    'bg-viz-1',
    'bg-viz-2',
    'bg-viz-3',
    'bg-viz-4',
    'bg-viz-5',
    'bg-viz-6',
  ];

  return (
    <section className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-h2 text-ink">Referral funnel</h2>
          <p className="mt-1 text-body text-ink-2">
            Where students are dropping off between submission and employment.
          </p>
        </div>
        <ExplainThis
          title="Referral funnel"
          definition="Tracks a single cohort of referrals from submission to employment."
          formula="Each bar shows the number of referrals that reached that stage. The percentage is the share of the previous stage that made it this far."
          whyItMatters="Identifies exactly where the process is stalling — whether providers are declining offers, or students are dropping out before the first service."
        />
      </div>

      <div className="mt-8 space-y-6">
        {stages.map((stage, i) => {
          const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          
          return (
            <div key={stage.key} className="group relative">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <Link
                      href={stage.linkTo}
                      className="text-label font-medium text-ink hover:text-orange-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-ring"
                    >
                      {stage.label}
                    </Link>
                    <span className="tabular text-label font-medium text-ink">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', colors[i])}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between text-caption text-ink-3">
                    <span>
                      {stage.shareOfPrevious !== null ? (
                        <span className="font-medium text-ink-2">
                          {Math.round(stage.shareOfPrevious * 100)}%
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                      {stage.shareOfPrevious !== null && ' of previous stage'}
                    </span>
                    
                    <span>
                      {stage.medianDaysInStage !== null ? (
                        <>
                          <span className="font-medium text-ink-2">{stage.medianDaysInStage}</span> days to next stage
                        </>
                      ) : (
                        <span>—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
