import type { Metadata } from 'next';
import { PUBLIC_CITATION_SECTIONS } from '@/data/citations';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Sources and citations',
  description: 'Every verified factual claim in TransitionBridge traces to a primary source listed here.',
};

export default function SourcesPage() {
  return (
    <MarketingLayout>
      <article className="content-marketing py-16">
        <p className="meta-label">Credibility</p>
        <h1 className="mt-3 text-h1 text-ink">Sources and citations</h1>
        <p className="mt-4 max-w-2xl text-body-lg text-ink-2">
          Every verified claim in this demonstration traces to a primary source. Figures inside
          the <strong>DEMONSTRATION DATA</strong> frame are synthetic. If a number carries a
          source marker in the product, you will find the citation here.
        </p>

        <div className="bridge-rule mt-10 max-w-xs" aria-hidden="true" />

        <div className="mt-12 space-y-14">
          {PUBLIC_CITATION_SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`section-${section.id}`}>
              <h2 id={`section-${section.id}`} className="text-h2 text-ink">
                {section.title}
              </h2>
              {section.intro && (
                <p className="mt-2 max-w-2xl text-body text-ink-2">{section.intro}</p>
              )}
              <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
                {section.items.map((item) => (
                  // The id is the anchor every "explain this" panel in the product links to.
                  <li
                    key={item.id}
                    id={`cite-${item.id}`}
                    className="scroll-mt-24 px-5 py-4 target:bg-surface-sunken"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body font-medium text-orange-deep hover:underline"
                    >
                      {item.label}
                    </a>
                    {item.note && (
                      <p className="mt-1 text-caption text-ink-3">{item.note}</p>
                    )}
                    <p className="mt-1 font-mono text-meta text-ink-3">{item.id}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 max-w-2xl text-body text-ink-2">
          Research conducted August 2026. Re-verify anything time-sensitive before a live
          presentation — especially district structure, SAM registration status, and any volume
          figures marked unverified in internal documentation.
        </p>

        <div className="mt-8">
          <Button variant="primary" href="/sign-in/">
            Enter the demonstration
          </Button>
        </div>
      </article>
    </MarketingLayout>
  );
}
