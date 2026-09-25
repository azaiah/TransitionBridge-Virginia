'use client';

import { useRoleOptional } from '@/context/RoleContext';
import {
  getPersonaById,
  getDefaultPersonaFor,
  getProviderHome,
  demoData,
} from '@/data';
import { KpiTile } from '@/components/ui/KpiTile';
import { Button } from '@/components/ui/Button';
import { Inbox, Users, Activity, BarChart2, BriefcaseBusiness } from 'lucide-react';
import { EarlyWarningPanel } from '@/components/escalation/EarlyWarningPanel';

export function VendorDashboard() {
  const roleCtx = useRoleOptional();
  // Direct navigation without choosing a view falls back to the first provider.
  const persona =
    (roleCtx?.personaId ? getPersonaById(roleCtx.personaId) : null) ??
    getDefaultPersonaFor('vendor');

  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find(v => v.id === vendorId);
  const scorecard = demoData.vendorScorecards.find(s => s.vendorId === vendorId);

  if (!vendor || !scorecard) return null;

  // Every number here is precomputed: offer and roster counts from the build-time home
  // snapshot, services from the scorecard. The dashboard loads no record files.
  const home = persona ? getProviderHome(persona.id) : undefined;
  const openOffers = home?.openOffers ?? 0;
  const activeStudents = home?.activeStudents ?? 0;
  const servicesLogged = scorecard.servicesLogged;
  const warnings = demoData.escalations?.byVendor.find((v) => v.vendorId === vendorId);
  const hours = demoData.funding?.byVendor.find((v) => v.vendorId === vendorId);


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Provider dashboard</h1>
          <p className="mt-2 text-body text-ink-2">
            {vendor.name} — {persona?.displayName ?? 'Coordinator view'}
          </p>
        </div>
        {/* The one thing a provider comes here to do: answer the offers waiting on them. */}
        <Button variant="primary" href="/vendor/inbox/" data-coach="action">
          <Inbox className="mr-2 h-4 w-4" aria-hidden="true" />
          {openOffers > 0
            ? `Review ${openOffers} referral offer${openOffers === 1 ? '' : 's'}`
            : 'Open referral inbox'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-coach="metric">
        <KpiTile
          label="Open referral offers"
          value={openOffers}
          href="/vendor/inbox/"
          alert={openOffers > 0}
        />
        <KpiTile
          label="Active students"
          value={activeStudents}
          href="/vendor/roster/"
          explainKey="individualsServed"
        />
        <KpiTile
          label="Capacity utilized"
          value={Math.round(scorecard.capacityUsedPct * 100)}
          unit="%"
          href="/vendor/capacity/"
          alert={scorecard.capacityUsedPct > 0.85}
          explainKey="capacityUsed"
        />
        <KpiTile
          label="Services logged (all time)"
          value={servicesLogged}
          href="/vendor/log/"
        />
      </div>

      {hours && (
        <section aria-labelledby="hours-title" data-coach="hours">
          <h2 id="hours-title" className="text-h2 text-ink">
            Authorized hours
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiTile
              label="Students near their authorized hours"
              value={hours.nearLimit}
              href="/vendor/roster/"
              alert={hours.nearLimit > 0}
              explainKey="authorizationNearLimit"
              note="Plan the last sessions, or ask the counselor to extend"
            />
            <KpiTile
              label="Students over authorization"
              value={hours.overAuthorized}
              href="/vendor/roster/"
              alert={hours.overAuthorized > 0}
              explainKey="authorizationOver"
              note="New sessions are refused until DARS extends"
            />
          </div>
        </section>
      )}

      {warnings && (
        <EarlyWarningPanel
          title="Students waiting for a first session"
          counts={warnings.counts}
          stages={['WAITING_TO_START']}
          linkFor={() => '/vendor/roster/'}
          description="Students you accepted who have no service logged yet. At 30 days the district manager is told; at 90, the state office."
        />
      )}

      {/* Secondary shortcuts. The inbox is not repeated here — it is the button above. */}
      <nav aria-label="Provider tools" className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Button variant="secondary" href="/vendor/log/" className="h-24 flex-col justify-center gap-2">
          <Activity className="h-6 w-6 text-orange-deep" aria-hidden="true" />
          <span>Log services</span>
        </Button>
        <Button variant="secondary" href="/vendor/roster/" className="h-24 flex-col justify-center gap-2">
          <Users className="h-6 w-6 text-orange-deep" aria-hidden="true" />
          <span>View roster</span>
        </Button>
        <Button variant="secondary" href="/vendor/scorecard/" className="h-24 flex-col justify-center gap-2">
          <BarChart2 className="h-6 w-6 text-orange-deep" aria-hidden="true" />
          <span>View scorecard</span>
        </Button>
        <Button variant="secondary" href="/vendor/jobs/" className="h-24 flex-col justify-center gap-2" data-coach="jobs">
          <BriefcaseBusiness className="h-6 w-6 text-orange-deep" aria-hidden="true" />
          <span>Job board</span>
        </Button>
      </nav>
    </div>
  );
}
