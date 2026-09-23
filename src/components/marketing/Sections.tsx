import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ACTIVITY_LABELS, PRE_ETS_ACTIVITIES } from '@/data/types';
import { CSNA_FINDINGS, getCitationById } from '@/data/citations';
import { GAP_QUESTIONS, ROLE_CONFIGS, TRUST_BADGES } from '@/lib/marketing';

export function GapSection() {
  return (
    <section className="content-marketing py-[var(--tb-section-gap)]" aria-labelledby="gap-heading">
      <h2 id="gap-heading" className="text-h2 text-ink">
        The gap — four questions Virginia cannot answer quickly today
      </h2>
      <p className="mt-3 max-w-2xl text-body-lg text-ink-2">
        Dedicated people are working inside disconnected systems. The cost is students who fall
        between a referral and a service. These are the questions no one can answer in under a
        week — until now.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {GAP_QUESTIONS.map((item, i) => (
          <article key={item.href} className="card flex flex-col p-6">
            <p className="meta-label">Question {i + 1}</p>
            <h3 className="mt-2 text-h3 text-ink">{item.question}</h3>
            <p className="mt-3 flex-1 text-body text-ink-2">{item.whyHard}</p>
            <Link
              href={item.href}
              className="mt-5 inline-flex items-center gap-2 text-label font-medium text-orange-deep hover:underline"
            >
              See it answered
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SourcedSection() {
  return (
    <section
      className="border-y border-line bg-surface-sunken py-[var(--tb-section-gap)]"
      aria-labelledby="sourced-heading"
    >
      <div className="content-marketing">
        <h2 id="sourced-heading" className="text-h2 text-ink">
          Sourced, not asserted
        </h2>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-2">
          DARS&apos;s own 2025 Comprehensive Statewide Needs Assessment documents these
          findings. We did not invent the problem — we built to what the assessment already
          found.
        </p>
        <ul className="mt-8 space-y-4">
          {CSNA_FINDINGS.map((item) => {
            const cite = getCitationById(item.sourceId);
            return (
              <li key={item.finding} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <span className="flex-1 text-body text-ink">{item.finding}</span>
                {cite && (
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-caption font-medium text-orange-deep underline underline-offset-2"
                  >
                    Primary source
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-body font-medium text-ink">
          We built to what the assessment already found.
        </p>
      </div>
    </section>
  );
}

export function ActivitiesSection() {
  return (
    <section className="content-marketing py-[var(--tb-section-gap)]" aria-labelledby="activities-heading">
      <h2 id="activities-heading" className="text-h2 text-ink">
        Built on the five required activities
      </h2>
      <p className="mt-3 max-w-2xl text-body-lg text-ink-2">
        Every service log, vendor scorecard, and export is organized around the five statutory
        Pre-ETS activities. Reporting aligns to RSA-911&apos;s shape and WIOA §116&apos;s
        indicators — the vocabulary your federal reviewers already use.
      </p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRE_ETS_ACTIVITIES.map((key, i) => (
          <li key={key} className="card flex gap-4 p-5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-subtle text-label font-semibold text-orange-deep tabular"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className="text-body text-ink">{ACTIVITY_LABELS[key]}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RolePanelsSection() {
  return (
    <section
      className="border-t border-line bg-surface py-[var(--tb-section-gap)]"
      aria-labelledby="roles-heading"
    >
      <div className="content-marketing">
        <h2 id="roles-heading" className="text-h2 text-ink">
          One product, four portals
        </h2>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-2">
          Everyone signs in to the same product but sees the part made for their job. Behind
          every portal sits the same set of records, so no one keeps a separate copy.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ROLE_CONFIGS.map((role) => (
            <article key={role.role} className="card p-6">
              <h3 className="text-h3 text-ink">{role.title}</h3>
              <ul className="mt-4 space-y-2">
                {role.benefits.map((b) => (
                  <li key={b} className="flex gap-2 text-body text-ink-2">
                    <span className="text-orange" aria-hidden="true">
                      ·
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={`/sign-in/?role=${role.role}`}
                aria-label={`Try the ${role.title} portal`}
                className="mt-5 inline-flex items-center gap-2 text-label font-medium text-orange-deep hover:underline"
              >
                {/* Opens the sign-in with this portal's account already in focus. */}
                Try this portal
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  return (
    <section className="content-marketing py-12" aria-label="IEP Partners certifications">
      <p className="meta-label text-center">IEP Partners, LLC · Petersburg, Virginia</p>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {TRUST_BADGES.map((badge) => (
          <li
            key={badge}
            className="text-caption font-medium uppercase tracking-wide text-ink-3 grayscale"
          >
            {badge}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DemoNotice() {
  return (
    <div className="content-marketing pb-8">
      <p className="rounded-card border border-warn/30 bg-warn-bg px-5 py-4 text-body text-ink">
        <strong className="font-semibold">DEMONSTRATION DATA</strong> — Figures on this site are
        synthetic and generated for demonstration. No real student, referral, or case data is
        present. Statutory references are sourced.{' '}
        <Link href="/sources/" className="font-medium text-orange-deep underline">
          View sources
        </Link>
      </p>
    </div>
  );
}
