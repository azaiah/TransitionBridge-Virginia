'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, FileWarning, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRoleOptional } from '@/context/RoleContext';
import { getPersonaById, demoData } from '@/data';
import { getReferralsForDivision, students } from '@/data/records';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate, formatFullDate } from '@/lib/dates';

export function ComplianceView() {
  const roleCtx = useRoleOptional();
  const personaId = roleCtx?.personaId;
  const persona = personaId ? getPersonaById(personaId) : null;
  
  const divisionId = persona?.scopeId ?? demoData.divisions[0].id;
  const allDivisionReferrals = getReferralsForDivision(divisionId);
  
  const myReferrals = personaId 
    ? allDivisionReferrals.filter(r => r.submittedByPersonaId === personaId)
    : allDivisionReferrals;

  // 1. Consent outstanding (AWAITING_CONSENT status)
  const awaitingConsent = myReferrals.filter(r => r.status === 'AWAITING_CONSENT');
  
  // 2. Documentation gaps (disabilityDocumented === false)
  const myStudentIds = new Set(myReferrals.map(r => r.studentId));
  const docGaps = students.filter(s => myStudentIds.has(s.id) && !s.disabilityDocumented);
  
  // 3. Approaching age-out (age 21+)
  const agingOut = students.filter(s => myStudentIds.has(s.id) && s.age >= 21);

  // 4. Eligible but not referred
  const referredStudentIds = new Set(allDivisionReferrals.map(r => r.studentId));
  const eligibleNotReferred = students.filter(s => 
    s.divisionId === divisionId && 
    s.age >= 14 && 
    (s.planType === 'IEP' || s.planType === 'SECTION_504') && 
    !referredStudentIds.has(s.id)
  );

  return (
    <div className="space-y-12">
      {/* Consent Outstanding */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warn-bg text-warn">
            <Clock className="h-4 w-4" />
          </div>
          <h2 className="text-h2 text-ink">Consent forms outstanding</h2>
        </div>
        
        <DataTable
          columns={[
            {
              key: 'student',
              header: 'Student',
              render: (r) => <span className="font-medium text-ink">{students.find(s => s.id === r.studentId)?.displayName}</span>,
              sortValue: (r) => students.find(s => s.id === r.studentId)?.displayName ?? '',
            },
            {
              key: 'submitted',
              header: 'Referred on',
              render: (r) => (
                <time dateTime={r.submittedAt} title={formatFullDate(r.submittedAt)}>
                  {formatDate(r.submittedAt)}
                </time>
              ),
              sortValue: (r) => r.submittedAt,
            },
            {
              key: 'action',
              header: 'Next step',
              render: () => (
                <Link
                  href="/school/referrals/?status=AWAITING_CONSENT"
                  className="text-label font-medium text-orange-deep hover:underline"
                >
                  Track this referral
                </Link>
              ),
            },
          ]}
          rows={awaitingConsent}
          rowKey={(r) => r.id}
          caption="Consent forms outstanding"
          emptyTitle="No consent forms are outstanding"
          emptyDescription="Every referral you have submitted has the consent it needs. That is good news, not an empty screen."
          emptyActionLabel="See all my referrals"
          emptyActionHref="/school/referrals/"
        />
      </section>

      {/* Documentation Gaps */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-risk-bg text-risk">
            <FileWarning className="h-4 w-4" />
          </div>
          <h2 className="text-h2 text-ink">Missing disability documentation</h2>
        </div>
        
        <DataTable
          columns={[
            {
              key: 'student',
              header: 'Student',
              render: (r) => <span className="font-medium text-ink">{r.displayName}</span>,
              sortValue: (r) => r.displayName,
            },
            {
              key: 'planType',
              header: 'Plan type',
              render: (r) => r.planType === 'IEP' ? 'IEP' : 'Section 504',
              sortValue: (r) => r.planType,
            },
            {
              key: 'note',
              header: 'What is missing',
              render: () => 'Disability documentation is not marked as on file.',
            },
          ]}
          rows={docGaps}
          rowKey={(r) => r.id}
          caption="Students missing disability documentation"
          emptyTitle="No documentation gaps"
          emptyDescription="All active students have required disability documentation on file."
        />
      </section>

      {/* Approaching Age-Out */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info-bg text-info">
            <AlertCircle className="h-4 w-4" />
          </div>
          <h2 className="text-h2 text-ink">Approaching age-out (21+)</h2>
        </div>
        
        <DataTable
          columns={[
            {
              key: 'student',
              header: 'Student',
              render: (r) => <span className="font-medium text-ink">{r.displayName}</span>,
              sortValue: (r) => r.displayName,
            },
            {
              key: 'age',
              header: 'Current age',
              render: (r) => <span className="font-medium text-warn">{r.age}</span>,
              sortValue: (r) => r.age,
              numeric: true,
            },
            {
              key: 'note',
              header: 'Why this matters',
              render: () => 'Pre-ETS eligibility ends at 22. Confirm the transition plan is current.',
            },
          ]}
          rows={agingOut}
          rowKey={(r) => r.id}
          caption="Students approaching age-out"
          emptyTitle="No students aging out"
          emptyDescription="No active students are currently 21 or older."
        />
      </section>
      
      {/* Eligible but not referred */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-ink-2">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <h2 className="text-h2 text-ink">Eligible but not referred</h2>
        </div>
        
        <DataTable
          columns={[
            {
              key: 'student',
              header: 'Student',
              render: (r) => <span className="font-medium text-ink">{r.displayName}</span>,
              sortValue: (r) => r.displayName,
            },
            {
              key: 'age',
              header: 'Age',
              render: (r) => r.age,
              sortValue: (r) => r.age,
              numeric: true,
            },
            {
              key: 'planType',
              header: 'Plan type',
              render: (r) => r.planType === 'IEP' ? 'IEP' : 'Section 504',
              sortValue: (r) => r.planType,
            },
            {
              key: 'action',
              header: 'Action',
              // Secondary: one row action repeated 40 times must not compete with the
              // single primary action on this screen.
              render: (r) => (
                <Button variant="secondary" className="!py-1 !px-3 text-caption" href={`/school/refer/?studentId=${r.id}`}>
                  Start referral
                </Button>
              ),
            },
          ]}
          rows={eligibleNotReferred}
          rowKey={(r) => r.id}
          caption="Eligible students with no referral on file"
          emptyTitle="All eligible students referred"
          emptyDescription="There are no eligible students (age 14+, IEP/504) without a referral on file."
        />
      </section>
    </div>
  );
}
