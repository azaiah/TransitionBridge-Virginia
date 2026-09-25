'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bus, CheckCircle2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Persona, Role } from '@/data/types';
import { JOB_TYPE_LABELS } from '@/data/types';
import { recordAudit } from '@/lib/session-store';
import type { EmployerMatch } from '@/lib/transition-record';
import { getLocalityByFips } from '@/data';
import { RecordCard } from './RecordCard';

const SHOWN = 3;

/**
 * The employer section, from the student's side: open postings that fit their career
 * interest, nearby, with the reasons for each match written out — never a black-box score.
 */
export function EmployerMatchesPanel({
  matches,
  careerLabel,
  role,
  persona,
  studentId,
  transitionId,
  jobBoardHref,
}: {
  matches: EmployerMatch[];
  careerLabel: string;
  role: Role;
  persona: Persona | undefined;
  studentId: string;
  transitionId: string;
  jobBoardHref: string | null;
}) {
  const [shared, setShared] = useState<Set<string>>(new Set());

  function share(match: EmployerMatch) {
    setShared((prev) => new Set(prev).add(match.posting.id));
    if (!persona) return;
    recordAudit({
      actorRole: role,
      actorPersonaId: persona.id,
      action: 'JOB_SHARED',
      studentId,
      subject: `${match.posting.title} at ${match.employer.name} · ${transitionId}`,
    });
  }

  return (
    <RecordCard
      id="employers"
      coach="employer-matches"
      title="Employer matches"
      description={`Open postings for ${careerLabel.toLowerCase()} in this student’s area.`}
      action={
        jobBoardHref ? (
          <Link href={jobBoardHref} className="text-label font-medium text-orange-deep underline underline-offset-2 hover:text-orange">
            Open the job board
          </Link>
        ) : undefined
      }
    >
      {matches.length === 0 ? (
        <p className="text-body text-ink-2">
          No open posting matches {careerLabel.toLowerCase()} in this area yet. New postings
          are matched automatically as employers add them.
        </p>
      ) : (
        <>
          <p className="text-body font-medium text-ink">
            {matches.length} potential {matches.length === 1 ? 'employer' : 'employers'}
            {matches.length > SHOWN ? ` · showing the best ${SHOWN}` : ''}
          </p>
          <ul className="mt-3 space-y-3">
            {matches.slice(0, SHOWN).map((match) => {
              const place = getLocalityByFips(match.employer.localityFips)?.name;
              const isShared = shared.has(match.posting.id);
              return (
                <li key={match.posting.id} className="rounded-control border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-ink">{match.posting.title}</p>
                      <p className="text-caption text-ink-2">
                        {match.employer.name}
                        {place ? ` · ${place}` : ''} · {JOB_TYPE_LABELS[match.posting.type]} ·{' '}
                        {match.posting.hoursPerWeek} hrs a week · ${match.posting.hourlyWage.toFixed(2)} an hour
                      </p>
                    </div>
                    {role !== 'state_leadership' &&
                      (isShared ? (
                        <span className="inline-flex items-center gap-1 text-caption text-ok">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Shared with the team
                        </span>
                      ) : (
                        <Button variant="secondary" className="!px-3 !py-1.5 text-caption" onClick={() => share(match)}>
                          <Share2 className="h-4 w-4" aria-hidden="true" />
                          Share with the student’s team
                        </Button>
                      ))}
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {match.reasons.map((reason) => (
                      <li key={reason} className="inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2.5 py-0.5 text-caption text-ink">
                        {reason === 'Reachable without a car' && <Bus className="h-3.5 w-3.5" aria-hidden="true" />}
                        {reason}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="mt-3 text-caption text-ink-3">
        Field: {careerLabel}. Matching uses the career interest on the readiness profile and
        the DARS district; employers never see a student’s name.
      </p>
    </RecordCard>
  );
}
