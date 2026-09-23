'use client';

import { ProductLayout } from '@/components/layout/ProductLayout';
import { useRoleOptional } from '@/context/RoleContext';
import {
  getPersonaById,
  getDistrictById,
  getDefaultPersonaFor,
  getCounselorHome,
  demoData,
  CURRENT_PERIOD,
} from '@/data';
import { KpiTile } from '@/components/ui/KpiTile';
import { Button } from '@/components/ui/Button';
import { AlertRow } from '@/components/ui/AlertRow';
import { ListChecks } from 'lucide-react';
import { ageDays, MIN_RATE_SAMPLE } from '@/lib/metrics';

export default function DarsPage() {
  const roleCtx = useRoleOptional();
  // Direct navigation without choosing a view falls back to the first counselor, so the
  // screen is never empty and always shows the same district.
  const persona =
    (roleCtx?.personaId ? getPersonaById(roleCtx.personaId) : null) ??
    getDefaultPersonaFor('dars_counselor');

  const districtId = persona?.scopeId ?? demoData.districts[0].id;
  const district = getDistrictById(districtId);
  const districtMetrics = demoData.districtMetrics.find(
    (m) => m.darsDistrictId === districtId && m.period === CURRENT_PERIOD
  );

  // Caseload counts are precomputed at build time — this screen never loads referrals.
  const caseload = persona ? getCounselorHome(persona.id) : undefined;
  const awaitingTriage = caseload?.awaitingTriage ?? 0;
  const staleTriage = caseload?.unassignedOver14Days ?? 0;
  const activeStudents = caseload?.activeStudents ?? 0;

  const alerts = demoData.alerts.filter(
    (a) => a.scope === 'DISTRICT' && a.scopeId === districtId
  );

  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">District dashboard</h1>
          <p className="mt-2 text-body text-ink-2">
            {district?.name} — {persona?.displayName ?? 'Counselor view'}
          </p>
        </div>
        {/* The one thing a counselor comes here to do. */}
        <Button variant="primary" href="/dars/queue/" data-coach="action">
          <ListChecks className="mr-2 h-4 w-4" aria-hidden="true" />
          Open the referral queue
        </Button>
      </div>

      <section className="mt-8" data-coach="metric">
        {/*
          Scoped to the district, not to one person. In this demonstration each district
          has a single counselor view, so calling these numbers "mine" would overstate
          what one caseload looks like.
        */}
        <h2 className="text-h2 text-ink">Work waiting in this district</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiTile
            label="Awaiting triage"
            value={awaitingTriage}
            href="/dars/queue/?status=unassigned"
            note="Referrals with no provider yet"
          />
          <KpiTile
            label="Waiting more than 14 days"
            value={staleTriage}
            href="/dars/queue/?status=unassigned&waiting=over14"
            alert={staleTriage > 0}
            explainKey="unassignedOver14Days"
          />
          <KpiTile
            label="Students in service"
            value={activeStudents}
            href="/dars/students/"
            explainKey="individualsServed"
            note="Assigned to a provider or receiving services"
          />
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h2 text-ink">District alerts</h2>
          <div className="mt-4 flex flex-col gap-3">
            {alerts.map((alert) => {
              const owner = alert.ownerPersonaId ? getPersonaById(alert.ownerPersonaId) : null;
              const ownerLabel = owner ? `${owner.displayName} (${owner.title})` : 'Unassigned';
              const age = Math.round(ageDays({ submittedAt: alert.createdAt }));
              const ageLabel = age === 0 ? 'Today' : `${age}d ago`;

              return (
                <AlertRow
                  key={alert.id}
                  message={alert.message}
                  severity={alert.severity}
                  ageLabel={ageLabel}
                  ownerLabel={ownerLabel}
                  linkTo={alert.linkTo}
                />
              );
            })}
          </div>
        </section>
      )}

      {districtMetrics && (
        <section className="mt-12">
          <h2 className="text-h2 text-ink">District performance</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label="Referrals this quarter"
              value={districtMetrics.referralsSubmitted}
              href="/dars/queue/"
              explainKey="referralsReceived"
            />
            <KpiTile
              label="Fill rate"
              value={
                districtMetrics.referralsSubmitted > 0
                  ? Math.round((districtMetrics.referralsAssigned / districtMetrics.referralsSubmitted) * 100)
                  : 0
              }
              unit="%"
              href="/dars/queue/"
              explainKey="fillRate"
            />
            <KpiTile
              label="Median days to assign"
              value={districtMetrics.medianDaysToAssignment ?? '—'}
              unit="days"
              href="/dars/queue/"
              explainKey="daysToAssignment"
            />
            {/*
              A quarter usually holds only a handful of completed cases in one district, and
              a rate built on one or two of them is noise dressed as a finding. Below the
              minimum sample the tile shows no rate and says why, and points at the
              statewide WIOA page where the trailing-four-quarter figures live.
            */}
            <KpiTile
              label="Employment outcome rate"
              value={
                districtMetrics.referralsCompleted >= MIN_RATE_SAMPLE &&
                districtMetrics.employmentOutcomeRate !== null
                  ? Math.round(districtMetrics.employmentOutcomeRate * 100)
                  : '—'
              }
              unit={districtMetrics.referralsCompleted >= MIN_RATE_SAMPLE ? '%' : undefined}
              note={
                districtMetrics.referralsCompleted >= MIN_RATE_SAMPLE
                  ? `Across ${districtMetrics.referralsCompleted} completed cases this quarter`
                  : `Too few completed cases this quarter (${districtMetrics.referralsCompleted}) to report a rate`
              }
              href="/state/outcomes/"
              explainKey="employmentOutcomeRate"
            />
          </div>
        </section>
      )}
    </ProductLayout>
  );
}
