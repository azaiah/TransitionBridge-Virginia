'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useViewer } from '@/context/useViewer';
import { transitionIdFor } from '@/data/identity';
import { REVEAL_REASONS, type RevealReason } from '@/lib/identity';
import { recordAudit } from '@/lib/session-store';
import { cn } from '@/lib/utils';

export interface StudentIdentityProps {
  student: { id: string; schoolId: string; displayName: string };
  /** Whether this viewer may ask to see the name (role AND caseload — see lib/access). */
  canReveal: boolean;
  /** 'title' for a record header, 'inline' for a table cell or a list row. */
  size?: 'title' | 'inline';
  className?: string;
}

/**
 * How a student appears everywhere: by Transition ID. Where the viewer is allowed, a
 * "Show name" control asks for a reason, reveals the name for this screen only, and writes
 * who, when, and why to the audit trail. Everyone else sees a plain note that names are
 * restricted — never a blank, never a guess.
 */
export function StudentIdentity({ student, canReveal, size = 'inline', className }: StudentIdentityProps) {
  const viewer = useViewer();
  const transitionId = transitionIdFor(student);
  const [revealed, setRevealed] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState<RevealReason>(REVEAL_REASONS[0]);

  function confirmReveal() {
    setRevealed(true);
    setAsking(false);
    if (viewer.role && viewer.persona) {
      recordAudit({
        actorRole: viewer.role,
        actorPersonaId: viewer.persona.id,
        action: 'NAME_VIEWED',
        studentId: student.id,
        subject: transitionId,
        reason,
      });
    }
  }

  const title = size === 'title';

  return (
    <div className={cn('min-w-0', className)}>
      <p
        className={cn(
          'font-mono tabular text-ink',
          title ? 'text-h2 font-semibold tracking-tight' : 'text-label font-medium',
        )}
      >
        {transitionId}
      </p>

      <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', title ? 'mt-1' : 'mt-0.5')}>
        {revealed ? (
          <>
            <span className={cn('text-ink', title ? 'text-body font-medium' : 'text-caption')}>
              {student.displayName}
            </span>
            <span className="inline-flex items-center gap-1 text-caption text-ok">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Viewing recorded
            </span>
            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="inline-flex items-center gap-1 rounded-control text-caption text-ink-2 underline underline-offset-2 hover:text-ink"
            >
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              Hide name
            </button>
          </>
        ) : canReveal ? (
          <button
            type="button"
            onClick={() => setAsking(true)}
            data-coach="reveal-name"
            className="inline-flex items-center gap-1 rounded-control text-caption font-medium text-orange-deep underline underline-offset-2 hover:text-orange"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Show name<span className="sr-only"> for {transitionId}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-caption text-ink-3">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Name restricted
          </span>
        )}
      </div>

      <Modal
        open={asking}
        title="Show this student’s name?"
        description={`Names are hidden by default. Showing one is recorded in the audit trail with your name, the time, and the reason you choose.`}
        onClose={() => setAsking(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmReveal}>
              Show name
            </Button>
          </>
        }
      >
        <fieldset>
          <legend className="text-label font-medium text-ink">Why do you need the name?</legend>
          <div className="mt-2 space-y-1">
            {REVEAL_REASONS.map((option) => (
              <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 hover:bg-surface-sunken sm:min-h-0 sm:py-1.5">
                <input
                  type="radio"
                  name={`reveal-reason-${student.id}`}
                  value={option}
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  className="h-4 w-4 text-orange-deep"
                />
                <span className="text-body text-ink">{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-4 rounded-control bg-surface-sunken p-3 text-caption text-ink-2">
          Record: <span className="font-mono">{transitionId}</span>. The name shows on this screen
          only and hides again when you leave.
        </p>
      </Modal>
    </div>
  );
}

/** Just the Transition ID, for dense tables and charts where a reveal control would crowd. */
export function TransitionIdText({
  student,
  className,
}: {
  student: { id: string; schoolId: string };
  className?: string;
}) {
  return <span className={cn('font-mono tabular', className)}>{transitionIdFor(student)}</span>;
}
