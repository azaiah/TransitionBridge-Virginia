import { Check, Minus, X } from 'lucide-react';
import { ROLE_NAMES } from '@/context/useViewer';
import type { Role } from '@/data/types';
import { ROLES } from '@/data/types';
import {
  RECORD_SECTION_LABELS,
  ROLE_NEED,
  SECTION_ACCESS,
  type RecordSection,
  type SectionAccess,
} from '@/lib/access';
import { cn } from '@/lib/utils';
import { RecordCard } from './RecordCard';

const CELL: Record<SectionAccess, { label: string; icon: typeof Check; className: string }> = {
  full: { label: 'Sees it', icon: Check, className: 'text-ok' },
  summary: { label: 'Summary only', icon: Minus, className: 'text-info' },
  none: { label: 'Hidden', icon: X, className: 'text-ink-3' },
};

const SECTIONS = Object.keys(RECORD_SECTION_LABELS) as RecordSection[];

/**
 * "One secure transition record. Every agency sees what it needs." — the rule, shown on the
 * record itself, so nobody has to wonder why a section is hidden from them.
 */
export function AccessPanel({ viewerRole }: { viewerRole: Role }) {
  return (
    <RecordCard
      id="access"
      coach="access"
      title="Who can see what"
      description="One record for the whole team. Each agency sees the part its job needs — this table is the rule."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-caption">
          <caption className="sr-only">What each role can see on a transition record</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 text-left text-label font-semibold text-ink-2">
                Part of the record
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  scope="col"
                  className={cn(
                    'px-2 py-2 text-left text-label font-semibold',
                    role === viewerRole ? 'bg-orange-subtle text-ink' : 'text-ink-2',
                  )}
                >
                  {ROLE_NAMES[role]}
                  {role === viewerRole && <span className="block text-caption font-normal">You</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line-hair">
              <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">
                Student’s name
              </th>
              {ROLES.map((role) => {
                const allowed = role === 'school_coordinator' || role === 'dars_counselor';
                const cell = allowed
                  ? { label: 'On request, recorded', icon: Minus, className: 'text-info' }
                  : CELL.none;
                const Icon = cell.icon;
                return (
                  <td key={role} className={cn('px-2 py-2', role === viewerRole && 'bg-orange-subtle/50')}>
                    <span className={cn('inline-flex items-center gap-1', cell.className)}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-ink">{cell.label}</span>
                    </span>
                  </td>
                );
              })}
            </tr>
            {SECTIONS.map((section) => (
              <tr key={section} className="border-b border-line-hair">
                <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">
                  {RECORD_SECTION_LABELS[section]}
                </th>
                {ROLES.map((role) => {
                  const cell = CELL[SECTION_ACCESS[section][role]];
                  const Icon = cell.icon;
                  return (
                    <td key={role} className={cn('px-2 py-2', role === viewerRole && 'bg-orange-subtle/50')}>
                      <span className={cn('inline-flex items-center gap-1', cell.className)}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="text-ink">{cell.label}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 rounded-control bg-surface-sunken p-3 text-caption text-ink-2">
        <span className="font-medium text-ink">Why you see what you see: </span>
        {ROLE_NEED[viewerRole]}
      </p>
    </RecordCard>
  );
}
