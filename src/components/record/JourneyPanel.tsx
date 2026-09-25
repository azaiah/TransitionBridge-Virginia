import { CheckCircle2, CircleDot, Circle } from 'lucide-react';
import type { JourneyState, JourneyStep } from '@/lib/transition-record';
import { cn } from '@/lib/utils';
import { RecordCard } from './RecordCard';

const STATE_TEXT: Record<JourneyState, string> = {
  done: 'Done',
  current: 'In progress',
  upcoming: 'Not yet',
};

const STATE_ICON: Record<JourneyState, typeof CheckCircle2> = {
  done: CheckCircle2,
  current: CircleDot,
  upcoming: Circle,
};

/**
 * Need → Intervention → Progress → Outcome. The four questions every agency asks about a
 * student, answered on one line, in order. Each step says whether it is done in words and
 * with an icon — never by colour alone.
 */
export function JourneyPanel({ steps }: { steps: JourneyStep[] }) {
  return (
    <RecordCard
      id="journey"
      coach="journey"
      title="Need → intervention → progress → outcome"
      description="What this student needed, what was done, how it is going, and where it led."
    >
      <div className="relative">
        {/* The bridge: once per page, as the design system asks. */}
        <div aria-hidden="true" className="absolute left-4 right-4 top-4 hidden h-1 rounded-pill bg-bridge sm:block" />
        <ol className="relative grid grid-cols-1 gap-4 sm:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = STATE_ICON[step.state];
            return (
              <li key={step.key} className="min-w-0">
                <div className="flex items-center gap-2 sm:block">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-surface',
                      step.state === 'done' && 'border-ok text-ok',
                      step.state === 'current' && 'border-orange text-orange-deep',
                      step.state === 'upcoming' && 'border-line-strong text-ink-3',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="meta-label sm:mt-3">
                    {i + 1}. {step.label} · {STATE_TEXT[step.state]}
                  </p>
                </div>
                <p className="mt-1 text-body font-medium text-ink">{step.headline}</p>
                {step.details.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {step.details.map((detail) => (
                      <li key={detail} className="text-caption text-ink-2">
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </RecordCard>
  );
}
