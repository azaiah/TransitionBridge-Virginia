import {
  Accessibility,
  BellRing,
  FileCheck2,
  MapPinned,
  MousePointerClick,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

/**
 * Plain-language homepage sections for someone who has never heard of the product.
 * Rule of thumb for this copy: short sentences, no acronyms without a meaning next to
 * them, and no numbers — any figure belongs on a sourced or DEMONSTRATION DATA screen.
 */

/** The student's journey in four steps — who does what, and what TransitionBridge adds. */
const STEPS = [
  {
    who: 'School',
    title: 'A teacher or coordinator refers a student',
    body: 'One short form, sent in minutes. The school can see where it stands from then on.',
  },
  {
    who: 'Counselor',
    title: 'A counselor matches the student with a provider',
    body: 'New referrals show up in one list, oldest first. Anything waiting too long is flagged.',
  },
  {
    who: 'Provider',
    title: 'The provider delivers job-readiness services',
    body: 'Job exploration, work-based learning, and more — logged as they happen, not months later.',
  },
  {
    who: 'State',
    title: 'Leadership sees the whole picture, live',
    body: 'Where students are waiting, where no provider is nearby, and what is working.',
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="content-marketing scroll-mt-20 py-[var(--tb-section-gap)]"
      aria-labelledby="how-heading"
    >
      <p className="meta-label">How it works</p>
      <h2 id="how-heading" className="mt-2 text-h2 text-ink">
        One shared path from referral to first job
      </h2>
      <p className="mt-3 max-w-2xl text-body-lg text-ink-2">
        Today each group keeps its own records, so a student can get lost between steps.
        TransitionBridge puts every step on the same path, so everyone sees the same thing.
      </p>
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.who} className="card flex flex-col p-6">
            <span className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-deep text-label font-semibold text-white tabular"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="meta-label">{step.who}</span>
            </span>
            <h3 className="mt-4 text-h3 text-ink">{step.title}</h3>
            <p className="mt-2 text-body text-ink-2">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

type Value = { icon: LucideIcon; title: string; body: string };

/** What a buyer actually gets. Each line maps to a screen they can open in the demo. */
const VALUES: Value[] = [
  {
    icon: BellRing,
    title: 'No student slips through',
    body: 'Every referral is tracked from the day it is sent. If one sits too long, it is flagged.',
  },
  {
    icon: MapPinned,
    title: 'See where help is missing',
    body: 'A statewide map shows which counties have students waiting and no provider close by.',
  },
  {
    icon: FileCheck2,
    title: 'Reports without the scramble',
    body: 'Federal reporting exports are built from the records staff already keep. No re-typing.',
  },
  {
    icon: MousePointerClick,
    title: 'Easy on the first day',
    body: 'Built for busy people between meetings. Each screen has one clear next step. No training.',
  },
  {
    icon: Accessibility,
    title: 'Accessible to everyone',
    body: 'Designed to WCAG 2.1 AA: keyboard, screen reader, and a table behind every chart.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    body: 'Runs on secure, FedRAMP-path hosting. This demo holds only synthetic records.',
  },
];

export function ValueSection() {
  return (
    <section
      className="border-y border-line bg-surface py-[var(--tb-section-gap)]"
      aria-labelledby="value-heading"
    >
      <div className="content-marketing">
        <p className="meta-label">What you get</p>
        <h2 id="value-heading" className="mt-2 text-h2 text-ink">
          Less chasing. More students served.
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-orange-subtle text-orange-deep"
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-h3 text-ink">{title}</span>
                <span className="mt-1 block text-body text-ink-2">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
