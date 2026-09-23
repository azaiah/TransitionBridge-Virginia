'use client';

import { Clock, User } from 'lucide-react';
import { getPersonaById } from '@/data';
import { getReferralWithTimeline } from '@/data/records';
import { REFERRAL_EVENT_LABELS } from '@/data/types';
import { formatFullDate, formatRelative } from '@/lib/dates';

/**
 * The closed loop, made visible: who did what to this referral, and when.
 * This is the thing a coordinator has never been able to see, so every line is written
 * in plain words rather than the event name the system stores.
 */
export function ReferralTimeline({ referralId }: { referralId: string }) {
  const referral = getReferralWithTimeline(referralId);

  if (!referral || referral.events.length === 0) {
    return (
      <p className="text-body text-ink-2">
        Nothing has happened to this referral yet. It was submitted and is waiting to be
        picked up.
      </p>
    );
  }

  return (
    <ol className="space-y-6">
      {referral.events.map((event, i) => {
        const isLast = i === referral.events.length - 1;
        const actor = getPersonaById(event.actorPersonaId);

        return (
          <li key={event.id} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute -bottom-6 left-[11px] top-6 w-px bg-line" aria-hidden="true" />
            )}
            <div className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken ring-4 ring-canvas">
              <div className="h-2 w-2 rounded-full bg-ink-3" aria-hidden="true" />
            </div>
            <div>
              <p className="text-label font-medium text-ink">
                {REFERRAL_EVENT_LABELS[event.type]}
              </p>
              {event.note && <p className="mt-0.5 text-caption text-ink-2">{event.note}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-ink-3">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={event.at}>
                    {`${formatFullDate(event.at)} · ${formatRelative(event.at)}`}
                  </time>
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" aria-hidden="true" />
                  {actor ? `${actor.displayName}, ${actor.title}` : 'Recorded automatically'}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
