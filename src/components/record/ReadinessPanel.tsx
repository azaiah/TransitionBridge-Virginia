'use client';

import { AlertTriangle, Briefcase, CheckCircle2, CircleDashed, Compass, Paperclip, TrendingUp } from 'lucide-react';
import { SeverityPill } from '@/components/ui/StatusPill';
import { CAREER_FIELD_LABELS } from '@/data/types';
import type { SectionAccess } from '@/lib/access';
import {
  READINESS_AREA_LABELS,
  READINESS_STATUS_LABELS,
  READINESS_STATUS_TONE,
  SUPPORT_LEVEL_LABELS,
  type ReadinessProfile,
  type ReadinessStatus,
} from '@/lib/transition-record';
import { RecordCard } from './RecordCard';

const STATUS_ICON: Record<ReadinessStatus, typeof CheckCircle2> = {
  NOT_STARTED: CircleDashed,
  NEEDS_SUPPORT: AlertTriangle,
  DEVELOPING: TrendingUp,
  EXPLORING: Compass,
  READY: CheckCircle2,
};

/**
 * The standardized transition readiness profile: the same areas, the same statuses, for
 * every student, so a counselor in Norfolk and one in Wise County read it the same way.
 * Accommodations and the support level must have documentation attached — when it is
 * missing, the profile says so and offers to attach it.
 */
export function ReadinessPanel({
  profile,
  access,
  employerMatchCount,
  onAttach,
  canAttach,
}: {
  profile: ReadinessProfile;
  access: SectionAccess;
  employerMatchCount: number;
  onAttach: (type: 'ACCOMMODATION_PLAN' | 'SUPPORT_LEVEL_ASSESSMENT') => void;
  canAttach: boolean;
}) {
  const ready = profile.items.filter((i) => i.status === 'READY').length;

  return (
    <RecordCard
      id="readiness"
      coach="readiness"
      title="Transition readiness profile"
      description="The same areas and the same statuses for every student, so every agency reads the record the same way."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-sunken px-3 py-1 text-caption text-ink">
          <Briefcase className="h-3.5 w-3.5 text-orange-deep" aria-hidden="true" />
          Career interest: <span className="font-medium">{CAREER_FIELD_LABELS[profile.careerInterest]}</span>
        </span>
        <span className="text-caption text-ink-2">
          {ready} of {profile.items.length} areas ready
        </span>
      </div>

      {access === 'summary' ? (
        <p className="mt-4 text-caption text-ink-2">
          State leadership sees how many areas are ready and the support level. The detail
          behind each area stays with the student’s team.
        </p>
      ) : (
        <table className="mt-4 w-full border-collapse text-body">
          <caption className="sr-only">Readiness by area</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-2 pr-3 text-label font-semibold text-ink-2">Area</th>
              <th scope="col" className="py-2 pr-3 text-label font-semibold text-ink-2">Status</th>
              <th scope="col" className="hidden py-2 text-label font-semibold text-ink-2 sm:table-cell">Based on</th>
            </tr>
          </thead>
          <tbody>
            {profile.items.map((item) => (
              <tr key={item.area} className="border-b border-line-hair align-top">
                <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink">
                  {READINESS_AREA_LABELS[item.area]}
                  <span className="mt-0.5 block text-caption font-normal text-ink-3 sm:hidden">{item.basis}</span>
                </th>
                <td className="py-2.5 pr-3">
                  <SeverityPill
                    label={READINESS_STATUS_LABELS[item.status]}
                    tone={READINESS_STATUS_TONE[item.status]}
                    icon={STATUS_ICON[item.status]}
                  />
                </td>
                <td className="hidden py-2.5 text-caption text-ink-2 sm:table-cell">{item.basis}</td>
              </tr>
            ))}
            <tr className="border-b border-line-hair align-top">
              <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink">Employer match</th>
              <td className="py-2.5 pr-3" colSpan={2}>
                <span className="text-body text-ink">
                  {employerMatchCount === 0
                    ? 'No open postings match yet'
                    : `${employerMatchCount} potential ${employerMatchCount === 1 ? 'employer' : 'employers'}`}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Michelle's "Important": these two must have documentation attached. */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" data-coach="attachments">
        <AttachmentRow
          label="Accommodations"
          value={profile.accommodationsDocumented ? 'Documented' : 'Not yet documented'}
          attached={profile.accommodationsDocumented}
          onAttach={() => onAttach('ACCOMMODATION_PLAN')}
          canAttach={canAttach}
        />
        <AttachmentRow
          label="Support level"
          value={SUPPORT_LEVEL_LABELS[profile.supportLevel]}
          attached={profile.supportLevelDocumented}
          onAttach={() => onAttach('SUPPORT_LEVEL_ASSESSMENT')}
          canAttach={canAttach}
        />
      </div>
    </RecordCard>
  );
}

function AttachmentRow({
  label,
  value,
  attached,
  onAttach,
  canAttach,
}: {
  label: string;
  value: string;
  attached: boolean;
  onAttach: () => void;
  canAttach: boolean;
}) {
  return (
    <div
      className={
        attached
          ? 'rounded-control border border-line p-3'
          : 'rounded-control border border-line border-l-[3px] border-l-warn bg-warn-bg/40 p-3'
      }
    >
      <p className="meta-label">{label}</p>
      <p className="mt-1 text-body font-medium text-ink">{value}</p>
      {attached ? (
        <p className="mt-1 inline-flex items-center gap-1 text-caption text-ok">
          <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
          Documentation attached
        </p>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-caption text-warn">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Documentation required
          </span>
          {canAttach && (
            <button
              type="button"
              onClick={onAttach}
              className="text-caption font-medium text-orange-deep underline underline-offset-2 hover:text-orange"
            >
              Attach it now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
