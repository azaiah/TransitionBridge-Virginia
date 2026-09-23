import type { Metadata } from 'next';
import { ActivitiesSection, RolePanelsSection } from '@/components/marketing/Sections';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Platform',
  description:
    'TransitionBridge is the visibility and coordination layer above Virginia\'s Pre-ETS ecosystem — not a replacement for anyone\'s case management system.',
};

const CAPABILITIES = [
  {
    title: 'Statewide command view',
    body: 'Six KPIs, a Virginia coverage map, referral funnel, district comparison, and rule-driven alerts — the screen that wins the room.',
    href: '/state/',
  },
  {
    title: 'Referral queue and triage',
    body: 'Oldest-first queue with aging treatment, explainable vendor matching, and a complete event timeline on every record.',
    href: '/dars/queue/',
  },
  {
    title: 'School referral submission',
    body: 'One screen, progressive disclosure, pre-filled student fields, and live status the coordinator has never had before.',
    href: '/school/refer/',
  },
  {
    title: 'Provider inbox and service logging',
    body: 'Accept or decline with reason, log the five statutory activities fast, and maintain capacity that feeds the coverage map.',
    href: '/vendor/inbox/',
  },
  {
    title: 'WIOA §116 outcomes',
    body: 'The six primary indicators in statutory order — employment rates, earnings, credentials, skill gains, employer effectiveness.',
    href: '/state/outcomes/',
  },
  {
    title: '15% Pre-ETS reserve tracking',
    body: 'Spend to date, spend by district and activity, and a straight-line projection to fiscal year end — the screen a CFO notices.',
    href: '/state/reserve/',
  },
];

export default function PlatformPage() {
  return (
    <MarketingLayout>
      <article className="content-marketing py-16">
        <p className="meta-label">What TransitionBridge does</p>
        <h1 className="mt-3 max-w-3xl text-h1 text-ink">
          The visibility layer above the ecosystem — not a replacement for it.
        </h1>
        <p className="mt-5 max-w-2xl text-body-lg text-ink-2">
          TransitionBridge does not replace DARS case management or school IEP systems. It sits
          above them and makes referral flow, vendor coverage, service delivery, and outcomes
          legible in real time — for every role that touches Pre-ETS.
        </p>

        <div className="bridge-rule mt-10 max-w-xs" aria-hidden="true" />

        <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Platform capabilities">
          {CAPABILITIES.map((cap) => (
            <article key={cap.title} className="card p-6">
              <h2 className="text-h3 text-ink">{cap.title}</h2>
              <p className="mt-2 text-body text-ink-2">{cap.body}</p>
              <Button variant="ghost" href={cap.href} className="mt-4 !px-0">
                Preview in demo →
              </Button>
            </article>
          ))}
        </section>

        <div className="mt-12">
          <Button variant="primary" href="/sign-in/">
            Enter the demonstration
          </Button>
        </div>
      </article>

      <ActivitiesSection />
      <RolePanelsSection />
    </MarketingLayout>
  );
}
