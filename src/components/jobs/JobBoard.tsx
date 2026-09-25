'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bus, ChevronDown, ChevronUp, Repeat, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useViewer } from '@/context/useViewer';
import { demoData, getDistrictById, getLocalityByFips, getVendorById } from '@/data';
import { postingsWithEmployer } from '@/data/employers';
import { transitionIdFor } from '@/data/identity';
import { referrals, students } from '@/data/records';
import type { CareerField, JobType } from '@/data/types';
import { CAREER_FIELDS, CAREER_FIELD_LABELS, JOB_TYPE_LABELS } from '@/data/types';
import { formatDate } from '@/lib/dates';
import { recordHref } from '@/lib/portal';
import { careerInterestFor } from '@/lib/transition-record';
import { cn } from '@/lib/utils';

const ACTIVE = new Set(['NEW', 'UNDER_REVIEW', 'AWAITING_CONSENT', 'READY_TO_ASSIGN', 'ASSIGNED', 'IN_SERVICE']);
const JOB_TYPES = Object.keys(JOB_TYPE_LABELS) as JobType[];

/**
 * The employer section: open postings from partner employers in the viewer's area, each
 * showing which students on the viewer's own caseload it fits (by Transition ID, matched
 * on career interest and district). Employers never see a student; the team decides who
 * to put forward.
 */
export function JobBoard() {
  const { role, persona } = useViewer();
  const [field, setField] = useState<CareerField | 'ALL'>('ALL');
  const [type, setType] = useState<JobType | 'ALL'>('ALL');
  const [transitOnly, setTransitOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  // Which districts this viewer works in, and which students are on their caseload.
  const { districtIds, caseload, scopeLabel } = useMemo(() => {
    if (role === 'vendor' && persona) {
      const vendor = getVendorById(persona.scopeId);
      const districts = new Set(
        (vendor?.servedLocalityFips ?? [])
          .map((fips) => getLocalityByFips(fips)?.darsDistrictId)
          .filter((d): d is string => Boolean(d)),
      );
      const mine = referrals.filter((r) => r.assignedVendorId === persona.scopeId && (r.status === 'ASSIGNED' || r.status === 'IN_SERVICE'));
      return { districtIds: districts, caseload: mine, scopeLabel: vendor?.name ?? 'your organization' };
    }
    const districtId = persona?.scopeId ?? demoData.districts[0]!.id;
    const mine = referrals.filter((r) => r.darsDistrictId === districtId && ACTIVE.has(r.status));
    return {
      districtIds: new Set([districtId]),
      caseload: mine,
      scopeLabel: getDistrictById(districtId)?.name ?? 'your district',
    };
  }, [role, persona]);

  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), []);
  // A counselor's list is every active referral in the district; a provider's is its roster.
  const where = role === 'vendor' ? 'on your roster' : 'with active referrals in your district';

  // Latest active referral per student on the caseload, keyed by career interest.
  const byInterest = useMemo(() => {
    const seen = new Set<string>();
    const map = new Map<CareerField, { studentId: string; schoolId: string; districtId: string; barrier: boolean }[]>();
    for (const referral of caseload) {
      if (seen.has(referral.studentId)) continue;
      seen.add(referral.studentId);
      const student = studentById.get(referral.studentId);
      if (!student) continue;
      const interest = careerInterestFor(student.id);
      const list = map.get(interest) ?? [];
      list.push({
        studentId: student.id,
        schoolId: student.schoolId,
        districtId: referral.darsDistrictId,
        barrier: student.transportationBarrier,
      });
      map.set(interest, list);
    }
    return map;
  }, [caseload, studentById]);

  const postings = useMemo(
    () =>
      postingsWithEmployer()
        .filter((p) => districtIds.has(p.employer.darsDistrictId))
        .filter((p) => field === 'ALL' || p.field === field)
        .filter((p) => type === 'ALL' || p.type === type)
        .filter((p) => !transitOnly || p.transitAccessible)
        .map((p) => ({
          ...p,
          matches: (byInterest.get(p.field) ?? []).filter((s) => s.districtId === p.employer.darsDistrictId),
        })),
    [districtIds, field, type, transitOnly, byInterest],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4" data-coach="job-filters">
        <label htmlFor="job-field" className="text-label font-medium text-ink">
          Field
        </label>
        <select
          id="job-field"
          value={field}
          onChange={(e) => setField(e.target.value as CareerField | 'ALL')}
          className="rounded-control border border-line bg-surface px-3 py-1.5 text-body"
        >
          <option value="ALL">Every field</option>
          {CAREER_FIELDS.map((f) => (
            <option key={f} value={f}>
              {CAREER_FIELD_LABELS[f]}
            </option>
          ))}
        </select>
        <label htmlFor="job-type" className="text-label font-medium text-ink">
          Kind of job
        </label>
        <select
          id="job-type"
          value={type}
          onChange={(e) => setType(e.target.value as JobType | 'ALL')}
          className="rounded-control border border-line bg-surface px-3 py-1.5 text-body"
        >
          <option value="ALL">Any kind</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {JOB_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-2 text-body text-ink sm:min-h-0">
          <input type="checkbox" checked={transitOnly} onChange={(e) => setTransitOnly(e.target.checked)} className="h-4 w-4" />
          Reachable without a car
        </label>
        <p className="text-caption text-ink-2" role="status" aria-live="polite">
          {`${postings.length} open postings · ${scopeLabel}`}
        </p>
      </div>

      {postings.length === 0 ? (
        <EmptyState
          title="No postings match these filters"
          description="Try every field or any kind of job. New postings appear here as employer partners add them."
          actionLabel="Clear filters"
          onAction={() => {
            setField('ALL');
            setType('ALL');
            setTransitOnly(false);
          }}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {postings.map((p, index) => {
            const expanded = open === p.id;
            const place = getLocalityByFips(p.employer.localityFips)?.name;
            return (
              <li
                key={p.id}
                className="flex flex-col rounded-card border border-line bg-surface p-4 shadow-sm"
                data-coach={index === 0 ? 'postings' : undefined}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-h3 text-ink">{p.title}</p>
                    <p className="text-caption text-ink-2">
                      {p.employer.name}
                      {place ? ` · ${place}` : ''}
                    </p>
                  </div>
                  <span className="rounded-pill border border-line bg-surface-sunken px-2.5 py-0.5 text-caption text-ink">
                    {JOB_TYPE_LABELS[p.type]}
                  </span>
                </div>
                <p className="mt-2 text-body text-ink">
                  ${p.hourlyWage.toFixed(2)} an hour · {p.hoursPerWeek} hours a week · {p.openings}{' '}
                  {p.openings === 1 ? 'opening' : 'openings'}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  <li className="rounded-pill bg-surface-sunken px-2.5 py-0.5 text-caption text-ink">{CAREER_FIELD_LABELS[p.field]}</li>
                  {p.transitAccessible && (
                    <li className="inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2.5 py-0.5 text-caption text-ink">
                      <Bus className="h-3.5 w-3.5" aria-hidden="true" />
                      Reachable without a car
                    </li>
                  )}
                  {p.employer.repeatPartner && (
                    <li className="inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2.5 py-0.5 text-caption text-ink">
                      <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
                      Has hired through Pre-ETS before
                    </li>
                  )}
                  {p.accommodations.map((a) => (
                    <li key={a} className="rounded-pill bg-ok-bg px-2.5 py-0.5 text-caption text-ink">
                      {a}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-caption text-ink-3">Posted {formatDate(p.postedAt)}</p>

                <div className="mt-auto pt-3">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : p.id)}
                    disabled={p.matches.length === 0}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-label font-medium',
                      p.matches.length === 0 ? 'text-ink-3' : 'text-orange-deep underline underline-offset-2',
                    )}
                  >
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {p.matches.length === 0
                      ? `No students ${where} match yet`
                      : `${p.matches.length.toLocaleString()} ${p.matches.length === 1 ? 'student' : 'students'} ${where} ${p.matches.length === 1 ? 'matches' : 'match'}`}
                    {p.matches.length > 0 &&
                      (expanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />)}
                  </button>
                  {expanded && role && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {p.matches.slice(0, 24).map((m) => (
                        <li key={m.studentId}>
                          <Link
                            href={`${recordHref(role, m.studentId)}#employers`}
                            className="inline-flex items-center gap-1 rounded-pill border border-line px-2.5 py-0.5 font-mono text-caption text-ink hover:border-orange-deep"
                          >
                            {transitionIdFor({ id: m.studentId, schoolId: m.schoolId })}
                            {m.barrier && <Bus className="h-3 w-3 text-warn" aria-label="transportation barrier" />}
                          </Link>
                        </li>
                      ))}
                      {p.matches.length > 24 && (
                        <li className="text-caption text-ink-2">and {p.matches.length - 24} more</li>
                      )}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
