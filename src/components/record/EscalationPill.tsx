import { AlarmClock, Siren, TimerReset } from 'lucide-react';
import { SeverityPill } from '@/components/ui/StatusPill';
import {
  STALL_STAGE_LABELS,
  TIER_ACTIONS,
  TIER_LABELS,
  type Escalation,
  type EscalationTier,
} from '@/lib/escalation';

const TONE: Record<EscalationTier, 'warn' | 'risk'> = { 14: 'warn', 30: 'risk', 90: 'risk' };
const ICON: Record<EscalationTier, typeof AlarmClock> = { 14: TimerReset, 30: AlarmClock, 90: Siren };

/**
 * The early warning rung a referral has reached. Text first ("30+ days"), with the stage in
 * the accessible name and the escalation in the title, so it reads the same without colour.
 */
export function EscalationPill({ escalation, withStage = false }: { escalation: Escalation; withStage?: boolean }) {
  const label = withStage
    ? `${TIER_LABELS[escalation.tier]} · ${STALL_STAGE_LABELS[escalation.stage].toLowerCase()}`
    : TIER_LABELS[escalation.tier];
  return (
    <span title={`${STALL_STAGE_LABELS[escalation.stage]} for ${Math.floor(escalation.days)} days — ${TIER_ACTIONS[escalation.tier]}`}>
      <SeverityPill label={label} tone={TONE[escalation.tier]} icon={ICON[escalation.tier]} />
      <span className="sr-only">
        {`, ${STALL_STAGE_LABELS[escalation.stage]} for ${Math.floor(escalation.days)} days. ${TIER_ACTIONS[escalation.tier]}.`}
      </span>
    </span>
  );
}
