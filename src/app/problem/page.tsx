import type { Metadata } from 'next';
import Link from 'next/link';
import { GAP_QUESTIONS } from '@/lib/marketing';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { SourcedSection } from '@/components/marketing/Sections';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'The problem',
  description:
    'Virginia\'s Pre-ETS ecosystem is fragmented across schools, DARS, vendors, and state leadership — and the cost falls on students.',
};

export default function ProblemPage() {
  return (
    <MarketingLayout>
      <article className="content-marketing py-16">
        <p className="meta-label">The fragmentation problem</p>
        <h1 className="mt-3 max-w-3xl text-h1 text-ink">
          Four groups. Four record systems. No shared view.
        </h1>
        <p className="mt-5 max-w-2xl text-body-lg text-ink-2">
          Virginia&apos;s Pre-Employment Transition Services system depends on school transition
          coordinators, DARS counselors, approved vendors, and state leadership — each doing
          essential work inside systems that were never designed to talk to each other.
        </p>

        <div className="bridge-rule mt-10 max-w-xs" aria-hidden="true" />

        <section className="mt-12" aria-labelledby="parties-heading">
          <h2 id="parties-heading" className="text-h2 text-ink">
            Who holds the pieces today
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'School transition coordinators',
                body: 'Refer students with disabilities, manage consent, track IEP transition planning — often in spreadsheets beside their division IEP system.',
              },
              {
                title: 'DARS counselors',
                body: 'Receive referrals, triage eligibility, assign vendors, and document services in a case management system schools never see.',
              },
              {
                title: 'Pre-ETS vendors (ESOs)',
                body: 'Deliver the five required activities, log services on paper or in their own tools, and report outcomes once a year on a scorecard PDF.',
              },
              {
                title: 'State leadership',
                body: 'Accountable for WIOA outcomes, the 15% Pre-ETS reserve, and statewide coverage — assembling answers from district reports that arrive weeks late.',
              },
            ].map((item) => (
              <div key={item.title} className="card p-5">
                <h3 className="text-h3 text-ink">{item.title}</h3>
                <p className="mt-2 text-body text-ink-2">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="questions-heading">
          <h2 id="questions-heading" className="text-h2 text-ink">
            Questions that take a week to answer — if they can be answered at all
          </h2>
          <ul className="mt-6 space-y-4">
            {GAP_QUESTIONS.map((q) => (
              <li key={q.href} className="card p-5">
                <p className="text-body-lg font-medium text-ink">{q.question}</p>
                <p className="mt-2 text-body text-ink-2">{q.whyHard}</p>
                <Link
                  href={q.href}
                  className="mt-3 inline-block text-label font-medium text-orange-deep hover:underline"
                >
                  See it answered in the demo →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button variant="primary" href="/platform/">
            How TransitionBridge helps
          </Button>
          <Button variant="secondary" href="/sign-in/">
            Enter the demonstration
          </Button>
        </div>
      </article>

      <SourcedSection />
    </MarketingLayout>
  );
}
