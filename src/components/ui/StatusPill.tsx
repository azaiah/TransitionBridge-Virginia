import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import type { ReferralStatus } from '@/data/types';
import { STATUS_LABELS } from '@/data/types';
import { cn } from '@/lib/utils';

/** Fixed vocabulary — color + text + icon, never color alone. */
const STATUS_CONFIG: Record<
  ReferralStatus,
  { icon: typeof CheckCircle2; tone: 'ok' | 'warn' | 'risk' | 'info' | 'neutral' }
> = {
  NEW: { icon: HelpCircle, tone: 'info' },
  UNDER_REVIEW: { icon: Clock, tone: 'info' },
  AWAITING_CONSENT: { icon: AlertCircle, tone: 'warn' },
  READY_TO_ASSIGN: { icon: Clock, tone: 'warn' },
  ASSIGNED: { icon: CheckCircle2, tone: 'ok' },
  IN_SERVICE: { icon: CheckCircle2, tone: 'ok' },
  COMPLETED: { icon: CheckCircle2, tone: 'ok' },
  CLOSED_NOT_SERVED: { icon: XCircle, tone: 'neutral' },
};

const toneClasses = {
  ok: 'bg-ok-bg text-ok border-ok/20',
  warn: 'bg-warn-bg text-warn border-warn/20',
  risk: 'bg-risk-bg text-risk border-risk/20',
  info: 'bg-info-bg text-info border-info/20',
  neutral: 'bg-neutral-bg text-neutral border-neutral/20',
};

export interface StatusPillProps {
  status: ReferralStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const label = STATUS_LABELS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-caption font-medium',
        toneClasses[cfg.tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/** Generic severity pill for alerts and aging treatments. */
export function SeverityPill({
  label,
  tone,
  icon: Icon = MinusCircle,
  className,
}: {
  label: string;
  tone: keyof typeof toneClasses;
  icon?: typeof MinusCircle;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-caption font-medium',
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
