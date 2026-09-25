import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { StateKpis } from '@/components/state/StateKpis';
import { ReferralFunnel } from '@/components/state/ReferralFunnel';
import { DistrictComparison } from '@/components/state/DistrictComparison';
import { Iep504Mix } from '@/components/state/Iep504Mix';
import { ActivityMix } from '@/components/state/ActivityMix';
import { TransportBarrierImpact } from '@/components/state/TransportBarrierImpact';
import { AlertsPanel } from '@/components/state/AlertsPanel';
import { Button } from '@/components/ui/Button';
import { demoData, getCurrentHeadline } from '@/data';
import { EarlyWarningPanel } from '@/components/escalation/EarlyWarningPanel';
import { KpiTile } from '@/components/ui/KpiTile';
import { formatMillions } from '@/lib/fiscal';
import { CURRENT_PERIOD } from '@/data';

export const metadata: Metadata = {
  title: 'State command view',
};

/** The statewide screens, named the way a Commissioner would ask for them. */
const STATE_TOOLS = [
  { href: '/state/map/', label: 'Coverage map' },
  { href: '/state/districts/', label: 'Districts' },
  { href: '/state/divisions/', label: 'School divisions' },
  { href: '/state/vendors/', label: 'Provider network' },
  { href: '/state/outcomes/', label: 'WIOA outcomes' },
  { href: '/state/reserve/', label: '15% reserve' },
  { href: '/state/funding/', label: 'Who is paying' },
  { href: '/state/early-warnings/', label: 'Early warnings' },
  { href: '/state/audit/', label: 'Access and audit log' },
  { href: '/state/reports/', label: 'Report builder' },
  { href: '/state/exports/', label: 'RSA-911 aligned export' },
];

export default function StatePage() {
  const headline = getCurrentHeadline();
  const districtMetrics = demoData.districtMetrics.filter((m) => m.period === CURRENT_PERIOD);
  const divisionMetrics = demoData.divisionMetrics.filter((m) => m.period === CURRENT_PERIOD);
  
  // Only show state-level alerts or high-severity ones on the main dashboard
  const alerts = demoData.alerts.filter(
    (a) => a.scope === 'STATE' || a.severity === 'RISK' || a.severity === 'WARN'
  );

  return (
    <ProductLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 text-ink">Statewide command view</h1>
          <p className="mt-2 text-body text-ink-2">
            Monitoring demand, coverage gaps, and outcomes across {demoData.districts.length} districts.
          </p>
        </div>
      </div>

      <section aria-labelledby="statewide-numbers" className="mt-8" data-coach="metric">
        <h2 id="statewide-numbers" className="sr-only">
          Statewide numbers this quarter
        </h2>
        <StateKpis headline={headline} />
      </section>

      {/* Every statewide screen is reachable from here, so the dashboard is never a dead end. */}
      <nav aria-label="Statewide tools" className="mt-6 flex flex-wrap gap-2" data-coach="state-tools">
        {STATE_TOOLS.map((tool) => (
          <Button key={tool.href} variant="secondary" href={tool.href} className="!py-2 !px-3 text-caption">
            {tool.label}
          </Button>
        ))}
      </nav>

      <section aria-labelledby="statewide-alerts" className="mt-12" data-coach="action">
        <h2 id="statewide-alerts" className="sr-only">
          What needs attention
        </h2>
        <AlertsPanel alerts={alerts} />
      </section>

      {demoData.escalations && (
        <div className="mt-12">
          <EarlyWarningPanel
            title="Early warning system"
            counts={demoData.escalations.state}
            stages={['WAITING_FOR_PROVIDER', 'WAITING_ON_CONSENT', 'WAITING_TO_START']}
            dormant={demoData.escalations.dormant}
            linkFor={(tier, stage) => `/state/early-warnings/?tier=${tier}${stage ? `&stage=${stage}` : ''}`}
            description="Past-due referrals statewide. At 30 days they reach the district manager; at 90 days, this office."
          />
        </div>
      )}

      {demoData.funding && (
        <section aria-labelledby="funding-title" className="mt-12" data-coach="funding-summary">
          <h2 id="funding-title" className="text-h2 text-ink">
            Who is paying, this fiscal year
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiTile
              label="Authorized"
              value={formatMillions(demoData.funding.totals.dollarsAuthorized)}
              href="/state/funding/"
              linkLabel="See who is paying"
              explainKey="fundingAuthorized"
            />
            <KpiTile
              label="Utilized"
              value={formatMillions(demoData.funding.totals.dollarsUsed)}
              href="/state/funding/"
              linkLabel="See who is paying"
              explainKey="fundingUtilized"
            />
            <KpiTile
              label="Remaining"
              value={formatMillions(demoData.funding.totals.dollarsAuthorized - demoData.funding.totals.dollarsUsed)}
              href="/state/funding/"
              linkLabel="See who is paying"
              explainKey="fundingRemaining"
              note={`${demoData.funding.totals.overAuthorized.toLocaleString()} authorizations over their hours`}
            />
          </div>
        </section>
      )}

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="lg:col-span-2">
          <ReferralFunnel stages={headline.funnel} />
        </section>

        <section className="lg:col-span-2">
          <DistrictComparison metrics={districtMetrics} />
        </section>

        <section>
          <Iep504Mix districtMetrics={districtMetrics} divisionMetrics={divisionMetrics} />
        </section>

        <section>
          <ActivityMix headline={headline} />
        </section>

        <section>
          <TransportBarrierImpact headline={headline} />
        </section>
      </div>
    </ProductLayout>
  );
}
