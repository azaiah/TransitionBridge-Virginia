import { AlertTriangle, CheckCircle2, OctagonAlert } from 'lucide-react';
import { SeverityPill } from '@/components/ui/StatusPill';
import {
  AUTHORIZATION_STATUS_LABELS,
  authorizationStatus,
  formatHours,
  hoursRemaining,
  hoursUsed,
  type AuthorizationStatus,
} from '@/lib/funding';
import { cn } from '@/lib/utils';

const TONE: Record<AuthorizationStatus, 'ok' | 'warn' | 'risk'> = {
  OK: 'ok',
  NEAR_LIMIT: 'warn',
  OVER: 'risk',
};

const ICON: Record<AuthorizationStatus, typeof CheckCircle2> = {
  OK: CheckCircle2,
  NEAR_LIMIT: AlertTriangle,
  OVER: OctagonAlert,
};

export function AuthorizationStatusPill({
  auth,
  className,
}: {
  auth: { hoursAuthorized: number; minutesUsed: number };
  className?: string;
}) {
  const status = authorizationStatus(auth);
  return (
    <SeverityPill
      label={AUTHORIZATION_STATUS_LABELS[status]}
      tone={TONE[status]}
      icon={ICON[status]}
      className={className}
    />
  );
}

/**
 * Authorized / used / remaining, as three numbers and a bar. The numbers carry the meaning;
 * the bar is a glance. Past the limit, the overrun is drawn as a hatched segment AND said
 * in words, so it never depends on colour.
 */
export function AuthorizationMeter({
  auth,
  compact = false,
}: {
  auth: { hoursAuthorized: number; minutesUsed: number };
  compact?: boolean;
}) {
  const used = hoursUsed(auth);
  const remaining = hoursRemaining(auth);
  const status = authorizationStatus(auth);
  const scale = Math.max(auth.hoursAuthorized, used, 0.0001);
  const usedPct = Math.min(used, auth.hoursAuthorized) / scale;
  const overPct = Math.max(0, used - auth.hoursAuthorized) / scale;

  return (
    <div className="min-w-0">
      {!compact && (
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="meta-label">Authorized</dt>
            <dd className="mt-0.5 text-h3 tabular text-ink">{formatHours(auth.hoursAuthorized)}</dd>
          </div>
          <div>
            <dt className="meta-label">Used</dt>
            <dd className="mt-0.5 text-h3 tabular text-ink">{formatHours(used)}</dd>
          </div>
          <div>
            <dt className="meta-label">{remaining < 0 ? 'Over by' : 'Remaining'}</dt>
            <dd className={cn('mt-0.5 text-h3 tabular', remaining < 0 ? 'text-risk' : 'text-ink')}>
              {formatHours(Math.abs(remaining))}
            </dd>
          </div>
        </dl>
      )}
      <div
        className={cn('flex w-full overflow-hidden rounded-pill bg-surface-sunken', compact ? 'mt-1 h-2' : 'mt-3 h-3')}
        role="img"
        aria-label={`${formatHours(used)} used of ${formatHours(auth.hoursAuthorized)} authorized${
          remaining < 0 ? `, ${formatHours(-remaining)} over` : `, ${formatHours(remaining)} remaining`
        }`}
      >
        <div
          className={cn('h-full', status === 'OK' ? 'bg-viz-2' : status === 'NEAR_LIMIT' ? 'bg-warn' : 'bg-risk')}
          style={{ width: `${usedPct * 100}%` }}
        />
        {overPct > 0 && (
          <div
            className="h-full bg-risk"
            style={{
              width: `${overPct * 100}%`,
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent 0 3px, rgba(255,255,255,0.55) 3px 6px)',
            }}
          />
        )}
      </div>
      {compact && (
        <p className="mt-1 text-caption tabular text-ink-2">
          {formatHours(used)} of {formatHours(auth.hoursAuthorized)} ·{' '}
          {remaining < 0 ? (
            <span className="font-medium text-risk">{formatHours(-remaining)} over</span>
          ) : (
            `${formatHours(remaining)} left`
          )}
        </p>
      )}
    </div>
  );
}
