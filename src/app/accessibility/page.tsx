import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/layout/MarketingLayout';

export const metadata: Metadata = {
  title: 'Accessibility',
};

export default function AccessibilityPage() {
  return (
    <MarketingLayout>
      <article className="content-marketing py-16">
        <h1 className="text-h1 text-ink">Accessibility statement</h1>
        <p className="mt-4 max-w-2xl text-body-lg text-ink-2">
          TransitionBridge is built for a disability services agency. Accessibility is not a
          checklist item — it is a requirement for a credible demonstration.
        </p>

        <div className="bridge-rule mt-10 max-w-xs" aria-hidden="true" />

        <section className="mt-10 space-y-8">
          <div>
            <h2 className="text-h2 text-ink">Conformance target</h2>
            <p className="mt-2 max-w-2xl text-body text-ink-2">
              We target <strong>WCAG 2.1 Level AA</strong> across every screen. Contrast ratios
              for text pairings are computed at build time, not estimated.
            </p>
          </div>

          <div>
            <h2 className="text-h2 text-ink">What we implement</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-ink-2">
              <li>Keyboard access to every interactive control, with a visible focus ring</li>
              <li>Landmark regions, logical heading order, and skip links on every layout</li>
              <li>
                Every chart includes a real data table alternative and CSV export via ChartFrame
              </li>
              <li>Status is never conveyed by color alone — text and icons accompany every badge</li>
              <li>
                <code className="rounded bg-surface-sunken px-1">prefers-reduced-motion</code>{' '}
                makes animation instant, not merely faster
              </li>
              <li>Real labels on every form input — placeholders are never used as labels</li>
              <li>Live regions on async status updates</li>
            </ul>
          </div>

          <div>
            <h2 className="text-h2 text-ink">Known limitations in this demonstration</h2>
            <p className="mt-2 max-w-2xl text-body text-ink-2">
              This environment uses synthetic data only. Role selection is a view switcher, not
              authentication. Some product views are still under construction as of the foundation
              build.
            </p>
          </div>

          <div>
            <h2 className="text-h2 text-ink">Feedback</h2>
            <p className="mt-2 max-w-2xl text-body text-ink-2">
              If you encounter a barrier while using this demonstration, contact IEP Partners
              through your usual engagement channel. We treat accessibility feedback as product
              priority, not support backlog.
            </p>
          </div>
        </section>
      </article>
    </MarketingLayout>
  );
}
