'use client';

import Link from 'next/link';
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
import { BriefcaseBusiness, Clock3, ListChecks, Users } from 'lucide-react';
import { EarlyWarningPanel } from '@/components/escalation/EarlyWarningPanel';
import { formatDollars } from '@/lib/fiscal';
import { formatHours } from '@/lib/funding';
import { ageDays, outcomeRates } from '@/lib/metrics';

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
  // Outcomes lag referrals by months, so the rate pools the last two program years.
  const districtOutcomes = outcomeRates(
    demoData.districtMetrics.filter((m) => m.darsDistrictId === districtId)
  );

  // Caseload counts are precomputed at build time — this screen never loads referrals.
  const caseload = persona ? getCounselorHome(persona.id) : undefined;
  const awaitingTriage = caseload?.awaitingTriage ?? 0;
  const staleTriage = caseload?.unassignedOver14Days ?? 0;
  const activeStudents = caseload?.activeStudents ?? 0;

  const warnings = demoData.escalations?.byDistrict.find((d) => d.darsDistrictId === districtId);
  const funding = demoData.funding?.byDistrict.find((d) => d.darsDistrictId === districtId);

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

      {/* Secondary tools. The queue stays the one primary action, above. */}
      <nav aria-label="Counselor tools" className="mt-6 flex flex-wrap gap-2" data-coach="counselor-tools">
        <Button variant="secondary" href="/dars/students/" className="!py-2 !px-3 text-caption">
          <Users className="h-4 w-4" aria-hidden="true" />
          Students and transition records
        </Button>
        <Button variant="secondary" href="/dars/funding/" className="!py-2 !px-3 text-caption">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          Funding and hours
        </Button>
        <Button variant="secondary" href="/dars/jobs/" className="!py-2 !px-3 text-caption">
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Job board
        </Button>
      </nav>

      {warnings && (
        <div className="mt-8">
          <EarlyWarningPanel
            counts={warnings.counts}
            stages={['WAITING_FOR_PROVIDER', 'WAITING_ON_CONSENT', 'WAITING_TO_START']}
            dormant={warnings.dormant}
            linkFor={(tier, stage) => `/dars/queue/?tier=${tier}${stage ? `&stage=${stage}` : ''}`}
            description="Referrals in this district that are past due, by how long they have waited. Each rung raises it one level: you, the district manager, then the state office."
          />
        </div>
      )}

      {funding && (
        <section className="mt-8" aria-labelledby="funding-snapshot" data-coach="funding-snapshot">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="funding-snapshot" className="text-h2 text-ink">
              Funding and hours this fiscal year
            </h2>
            <Link href="/dars/funding/" className="text-label font-medium text-orange-deep underline underline-offset-2">
              See every authorization
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiTile
              label="Near their authorized hours"
              value={funding.nearLimit}
              href="/dars/funding/?status=NEAR_LIMIT"
              alert={funding.nearLimit > 0}
              explainKey="authorizationNearLimit"
              note="90% or more of the hours used"
            />
            <KpiTile
              label="Over authorization"
              value={funding.overAuthorized}
              href="/dars/funding/?status=OVER"
              alert={funding.overAuthorized > 0}
              explainKey="authorizationOver"
              note="New services are blocked until you extend"
            />
            <KpiTile
              label="Hours remaining, all funders"
              value={formatHours(Math.max(0, funding.hoursAuthorized - funding.hoursUsed)).replace(/ hrs?$/, '')}
              unit="hrs"
              href="/dars/funding/"
              explainKey="hoursRemaining"
              note={`${formatDollars(funding.dollarsAuthorized - funding.dollarsUsed)} of ${formatDollars(funding.dollarsAuthorized)} authorized left`}
            />
          </div>
        </section>
      )}

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
              A quarter holds only a handful of completed cases in one district, so the rate
              is judged over every referral from the last two years — the same window as the
              district comparison on the state screens, so the two always agree.
            */}
            <KpiTile
              label="Employment outcome rate"
              value={
                districtOutcomes.employmentOutcomeRate !== null
                  ? Math.round(districtOutcomes.employmentOutcomeRate * 100)
                  : '—'
              }
              unit={districtOutcomes.employmentOutcomeRate !== null ? '%' : undefined}
              note={
                districtOutcomes.employmentOutcomeRate !== null
                  ? `Across ${districtOutcomes.completed.toLocaleString()} completed cases in the last two years`
                  : `Too few completed cases (${districtOutcomes.completed}) to report a rate`
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
