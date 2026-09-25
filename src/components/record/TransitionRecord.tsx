'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { StudentIdentity } from '@/components/identity/StudentIdentity';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill } from '@/components/ui/StatusPill';
import { DemoDataChip } from '@/components/ui/DemoDataBanner';
import { ROLE_NAMES, useViewer } from '@/context/useViewer';
import { getDivisionById, getVendorById, demoData } from '@/data';
import { postings, employers } from '@/data/employers';
import { getAuthorizationsForStudent } from '@/data/funding';
import { transitionIdFor } from '@/data/identity';
import { getOutcomesForStudent } from '@/data/outcomes';
import { getReferralWithTimeline, getReferralsForStudent, getStudentById } from '@/data/records';
import { getServicesForStudent } from '@/data/services';
import type { Referral, Role } from '@/data/types';
import { ACTIVITY_LABELS, CAREER_FIELD_LABELS, PLAN_TYPE_LABELS } from '@/data/types';
import { canRevealName, recordScope, sectionAccess } from '@/lib/access';
import { formatDate, formatFullDate } from '@/lib/dates';
import { escalationFor } from '@/lib/escalation';
import { PORTAL_HOME } from '@/lib/portal';
import { buildRecordAuditTrail } from '@/lib/record-audit';
import { getAuditHistoryForStudent } from '@/data/audit-history';
import {
  adjustAuthorization,
  recordAudit,
  useAuditLog,
  useAuthorizationAdjustments,
  useSessionDocuments,
} from '@/lib/session-store';
import {
  buildDocuments,
  buildJourney,
  buildReadinessProfile,
  matchEmployers,
  type DocumentType,
} from '@/lib/transition-record';
import { AccessPanel } from './AccessPanel';
import { AuditPanel } from './AuditPanel';
import { AddDocumentDialog, DocumentsPanel } from './DocumentsPanel';
import { EmployerMatchesPanel } from './EmployerMatchesPanel';
import { EscalationPill } from './EscalationPill';
import { FundingPanel } from './FundingPanel';
import { JourneyPanel } from './JourneyPanel';
import { ReadinessPanel } from './ReadinessPanel';
import { RecordCard, RestrictedNote } from './RecordCard';

const BACK: Record<Role, { href: string; label: string }> = {
  state_leadership: { href: '/state/', label: 'Back to the statewide view' },
  dars_counselor: { href: '/dars/students/', label: 'Back to students' },
  school_coordinator: { href: '/school/referrals/', label: 'Back to my referrals' },
  vendor: { href: '/vendor/roster/', label: 'Back to my roster' },
};

const JOB_BOARD: Partial<Record<Role, string>> = {
  dars_counselor: '/dars/jobs/',
  vendor: '/vendor/jobs/',
};

const employerById = new Map(employers.map((e) => [e.id, e]));

/**
 * One secure transition record. The same student, the same record, for all four agencies —
 * each seeing the part its job needs (src/lib/access.ts). The student is shown by
 * Transition ID; the name only on request, and only to the school and the counselor.
 */
export function TransitionRecord({ studentId }: { studentId: string }) {
  const { role, persona } = useViewer();
  const student = getStudentById(studentId);
  const auditLog = useAuditLog();
  const adjustments = useAuthorizationAdjustments();
  const sessionDocs = useSessionDocuments(studentId);
  const [addOpen, setAddOpen] = useState(false);
  const [presetType, setPresetType] = useState<DocumentType | undefined>(undefined);

  const storedReferrals = useMemo(() => getReferralsForStudent(studentId), [studentId]);
  const scope = useMemo(
    () => (role && student ? recordScope(role, persona, student, storedReferrals) : null),
    [role, persona, student, storedReferrals],
  );

  // Every open of a record — and every refusal — goes in the audit trail, once per visit.
  const logged = useRef<string | null>(null);
  useEffect(() => {
    if (!role || !persona || !student || !scope) return;
    const key = `${role}|${student.id}|${scope.inScope}`;
    if (logged.current === key) return;
    logged.current = key;
    recordAudit({
      actorRole: role,
      actorPersonaId: persona.id,
      action: scope.inScope ? 'RECORD_OPENED' : 'RECORD_REFUSED',
      studentId: student.id,
      subject: transitionIdFor(student),
    });
  }, [role, persona, student, scope]);

  const data = useMemo(() => {
    if (!student) return null;
    const services = getServicesForStudent(student.id);
    const outcomes = getOutcomesForStudent(student.id);
    const referrals = storedReferrals
      .map((r) => getReferralWithTimeline(r.id))
      .filter((r): r is Referral => Boolean(r));
    const authorizations = getAuthorizationsForStudent(student.id);
    const profile = buildReadinessProfile(student, services, outcomes, storedReferrals);
    // The division's coordinator holds the plan for a student who has not been referred yet.
    const schoolPersonaId = demoData.personas.find(
      (p) => p.role === 'school_coordinator' && p.scopeId === student.divisionId,
    )?.id;
    const documents = buildDocuments(student, storedReferrals, services, profile, schoolPersonaId);
    return { services, outcomes, referrals, authorizations, profile, documents };
  }, [student, storedReferrals]);

  if (!student || !data) {
    return (
      <EmptyState
        title="That student record could not be found"
        description="The link may be incomplete. Search by Transition ID, or go back to your list."
        actionLabel="Back"
        actionHref={role ? PORTAL_HOME[role] : '/'}
      />
    );
  }

  if (!role) return null;
  const transitionId = transitionIdFor(student);

  if (!scope?.inScope) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={<ShieldAlert className="h-10 w-10" aria-hidden="true" />}
          title="This record is outside your caseload"
          description={`${scope?.reason ?? ''} Records open only for the people working with the student. This attempt was recorded in the audit trail.`}
          actionLabel={BACK[role].label}
          actionHref={BACK[role].href}
        />
      </div>
    );
  }

  const division = getDivisionById(student.divisionId);
  const school = demoData.schools.find((s) => s.id === student.schoolId);
  const latest = storedReferrals[storedReferrals.length - 1];
  const escalation = latest ? escalationFor(latest) : null;
  const vendorScope = role === 'vendor' ? persona?.scopeId : undefined;

  // This session's added documents join the folder; attachments update the profile.
  const documents = [...sessionDocs, ...data.documents];
  const profile = {
    ...data.profile,
    accommodationsDocumented:
      data.profile.accommodationsDocumented || sessionDocs.some((d) => d.type === 'ACCOMMODATION_PLAN'),
    supportLevelDocumented:
      data.profile.supportLevelDocumented || sessionDocs.some((d) => d.type === 'SUPPORT_LEVEL_ASSESSMENT'),
  };

  const authorizations = data.authorizations
    .filter((a) => {
      if (!vendorScope) return true;
      // A provider sees only the Pre-ETS authorization on referrals assigned to it.
      const referral = storedReferrals.find((r) => r.id === a.referralId);
      return a.source === 'DARS' && referral?.assignedVendorId === vendorScope;
    })
    .map((a) => adjustAuthorization(a, adjustments));

  const services = vendorScope
    ? data.services.filter((s) => s.vendorId === vendorScope)
    : data.services;

  const matches = matchEmployers(profile, student, latest?.darsDistrictId ?? '', postings, employerById);
  const journey = buildJourney({
    referrals: storedReferrals,
    services: data.services,
    outcomes: data.outcomes,
    profile,
    authorizations,
    transportationBarrier: student.transportationBarrier,
  });
  const history = buildRecordAuditTrail({
    studentId: student.id,
    referrals: data.referrals,
    documents: data.documents,
    authorizations: data.authorizations,
    history: getAuditHistoryForStudent(student.id),
  });
  const liveEvents = auditLog.filter((e) => e.studentId === student.id);

  const access = {
    profile: sectionAccess(role, 'profile'),
    services: sectionAccess(role, 'services'),
    funding: sectionAccess(role, 'funding'),
    documents: sectionAccess(role, 'documents'),
    employers: sectionAccess(role, 'employers'),
    audit: sectionAccess(role, 'audit'),
  };

  function requestAdd(type?: DocumentType) {
    setPresetType(type);
    setAddOpen(true);
  }

  const jumpLinks = [
    { href: '#journey', label: 'Journey' },
    { href: '#readiness', label: 'Profile' },
    { href: '#documents', label: 'Documents' },
    ...(access.funding !== 'none' ? [{ href: '#funding', label: 'Funding' }] : []),
    ...(access.employers !== 'none' ? [{ href: '#employers', label: 'Employers' }] : []),
    { href: '#services', label: 'Services' },
    ...(access.audit !== 'none' ? [{ href: '#audit', label: 'Audit trail' }] : []),
    { href: '#access', label: 'Who can see what' },
  ];

  // A school's student with no referral yet lives on the compliance lists, not "My referrals".
  const back =
    role === 'school_coordinator' && storedReferrals.length === 0
      ? { href: '/school/compliance/', label: 'Back to compliance & documentation' }
      : BACK[role];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={back.href}
        className="inline-flex items-center gap-1 text-label text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {back.label}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4" data-coach="record-header">
        <div className="min-w-0">
          <p className="meta-label">Transition record · viewing as {ROLE_NAMES[role]}</p>
          <h1 className="sr-only">Transition record {transitionId}</h1>
          <StudentIdentity
            student={student}
            canReveal={canRevealName(role, scope.inScope)}
            size="title"
            className="mt-1"
          />
          <p className="mt-2 text-body text-ink-2">
            {school?.name ?? division?.name} · Grade {student.gradeLevel} · Age {student.age} ·{' '}
            {PLAN_TYPE_LABELS[student.planType]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DemoDataChip />
          {latest && <StatusPill status={latest.status} />}
          {escalation && <EscalationPill escalation={escalation} withStage />}
        </div>
      </header>

      <nav aria-label="Parts of this record" className="mt-4 flex flex-wrap gap-2 print:hidden">
        {jumpLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink-2 hover:bg-surface-sunken hover:text-ink"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-6">
        <JourneyPanel steps={journey} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <ReadinessPanel
              profile={profile}
              access={access.profile}
              employerMatchCount={matches.length}
              onAttach={(type) => requestAdd(type)}
              canAttach={role === 'dars_counselor' || role === 'school_coordinator'}
            />
            <DocumentsPanel
              documents={documents}
              access={access.documents}
              role={role}
              persona={persona}
              transitionId={transitionId}
              studentId={student.id}
              liveEvents={liveEvents}
              onAddRequest={() => requestAdd(undefined)}
            />
          </div>
          <div className="space-y-6">
            <FundingPanel
              authorizations={authorizations}
              providerAssigned={latest?.status === 'ASSIGNED' || latest?.status === 'IN_SERVICE'}
              access={access.funding}
              role={role}
              persona={persona}
              studentId={student.id}
              transitionId={transitionId}
              vendorId={vendorScope}
            />
            {access.employers !== 'none' && (
              <EmployerMatchesPanel
                matches={matches}
                careerLabel={CAREER_FIELD_LABELS[profile.careerInterest]}
                role={role}
                persona={persona}
                studentId={student.id}
                transitionId={transitionId}
                jobBoardHref={JOB_BOARD[role] ?? null}
              />
            )}
          </div>
        </div>

        <RecordCard
          id="services"
          title="Services delivered"
          description={
            vendorScope
              ? 'Services your organization delivered to this student.'
              : 'Every Pre-ETS service on this student’s record.'
          }
        >
          {access.services === 'summary' ? (
            <p className="text-body text-ink">
              {data.services.length} services delivered ·{' '}
              {new Set(data.services.map((s) => s.activity)).size} of 5 required activities
            </p>
          ) : services.length === 0 ? (
            <p className="text-body text-ink-2">No services have been logged yet.</p>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  render: (r) => (
                    <time dateTime={r.serviceDate} title={formatFullDate(r.serviceDate)}>
                      {formatDate(r.serviceDate)}
                    </time>
                  ),
                  sortValue: (r) => r.serviceDate,
                },
                {
                  key: 'activity',
                  header: 'Activity',
                  render: (r) => ACTIVITY_LABELS[r.activity],
                  sortValue: (r) => ACTIVITY_LABELS[r.activity],
                },
                {
                  key: 'provider',
                  header: 'Provider',
                  render: (r) =>
                    r.deliveredInHouse
                      ? 'DARS (in house)'
                      : r.vendorId
                        ? (getVendorById(r.vendorId)?.name ?? 'Provider')
                        : 'Provider',
                  sortValue: (r) => (r.deliveredInHouse ? 'DARS' : (r.vendorId ?? '')),
                },
                {
                  key: 'duration',
                  header: 'Duration',
                  render: (r) => `${r.durationMinutes} min`,
                  sortValue: (r) => r.durationMinutes,
                  numeric: true,
                },
              ]}
              rows={[...services].sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))}
              rowKey={(r) => r.id}
              exportKind="records"
              csvFilename={`services-${transitionId}.csv`}
              caption={`Services delivered to ${transitionId}`}
            />
          )}
        </RecordCard>

        {access.audit === 'full' ? (
          <AuditPanel history={history} liveEvents={liveEvents} />
        ) : (
          <RecordCard id="audit" title="Audit trail">
            <RestrictedNote>
              The full audit trail is kept for DARS and state oversight. Every view you make of
              this record, and of its documents, is recorded there.
            </RestrictedNote>
          </RecordCard>
        )}

        <AccessPanel viewerRole={role} />
      </div>

      <AddDocumentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        role={role}
        persona={persona}
        studentId={student.id}
        transitionId={transitionId}
        presetType={presetType}
      />
    </div>
  );
}
