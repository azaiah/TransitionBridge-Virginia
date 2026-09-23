import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroPreview } from '@/components/marketing/HeroPreview';
import {
  ActivitiesSection,
  DemoNotice,
  GapSection,
  RolePanelsSection,
  SourcedSection,
  TrustStrip,
} from '@/components/marketing/Sections';
import { HowItWorksSection, ValueSection } from '@/components/marketing/ValueSections';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Virginia Pre-ETS Referral & Outcomes Platform',
  description:
    'TransitionBridge connects schools, counselors, and providers so every student with a disability gets from referral to job-readiness services — and no one gets lost in between.',
};

/**
 * The marketing home page. Order matters — it answers a visitor's questions in turn:
 * 1. What is this?            → hero
 * 2. How does it work?        → four-step path
 * 3. What do I get?           → value grid
 * 4. What would I use?        → the four portals, each with "Try this portal"
 * 5. Why should I believe it? → the four questions, sourced findings, required activities
 * 6. What now?                → sign in to the demo
 */
export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero — Fraunces appears ONLY here per design spec */}
      <section className="content-marketing pb-12 pt-12 xs:pt-16 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="meta-label">For Virginia schools, counselors, and service providers</p>
            <h1 className="mt-4 font-serif text-display text-ink">
              Every student&apos;s path to a first job, in one place.
            </h1>
            <p className="mt-5 max-w-xl text-body-lg text-ink-2">
              Students with disabilities can get free job-readiness help before they leave high
              school. Getting that help takes a school, a state counselor, and a service provider
              working together. TransitionBridge gives all three — and state leaders — one shared
              view, so no student gets lost between a referral and a service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" href="/sign-in/">
                Try the live demo
              </Button>
              <Button variant="secondary" href="/#how-it-works">
                See how it works
              </Button>
            </div>
            <p className="mt-4 text-caption text-ink-3">
              Four portals to explore · No password needed · Synthetic demonstration data
            </p>
          </div>
          <HeroPreview />
        </div>
      </section>

      <DemoNotice />

      <HowItWorksSection />
      <ValueSection />
      <RolePanelsSection />
      <GapSection />
      <SourcedSection />
      <ActivitiesSection />
      <TrustStrip />

      <section className="content-marketing pb-20 text-center">
        <div className="bridge-rule mx-auto mb-8 max-w-xs" aria-hidden="true" />
        <h2 className="text-h2 text-ink">See it from every chair</h2>
        <p className="mx-auto mt-3 max-w-lg text-body text-ink-2">
          Sign in as a school coordinator, a DARS counselor, a provider, or a state leader. Each
          account shows the product exactly as that person would use it.
        </p>
        <div className="mt-8">
          <Button variant="primary" href="/sign-in/">
            Sign in to the demo
          </Button>
        </div>
        <p className="mt-6 text-caption text-ink-3">
          Demonstration accounts only — no password, no real records.{' '}
          <Link href="/accessibility/" className="text-orange-deep underline">
            Accessibility statement
          </Link>
        </p>
      </section>
    </MarketingLayout>
  );
}
