import Link from 'next/link';
import type { ReactNode } from 'react';
import { BridgeLogo, PresentedBy } from '@/components/brand/BrandLogos';
import { MobileMenu } from './MobileMenu';
import { SkipLink } from './SkipLink';

const NAV = [
  { href: '/problem/', label: 'The problem' },
  { href: '/platform/', label: 'Platform' },
  { href: '/sources/', label: 'Sources' },
  { href: '/accessibility/', label: 'Accessibility' },
] as const;

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <div data-density="comfortable" className="min-h-screen overflow-x-clip bg-canvas">
        {/* `relative` anchors the mobile menu panel directly under the header. */}
        <header className="relative border-b border-line bg-surface/80 backdrop-blur-sm">
          <div className="content-marketing flex h-16 items-center justify-between gap-3">
            {/* The lockup is the bridge plus live text, so it stays crisp at any size and
                is readable by a screen reader without an alt-text round trip. */}
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <BridgeLogo priority className="h-9 shrink-0" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-label font-semibold text-ink">TransitionBridge</span>
                {/* Hide the org line on the narrowest phones so the sign-in button never wraps. */}
                <span className="hidden truncate text-meta text-ink-3 xs:block">IEP Partners</span>
              </span>
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-label text-ink-2 hover:text-orange-deep"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/sign-in/"
                className="inline-flex min-h-11 items-center rounded-control bg-orange-deep px-4 text-label font-medium text-white hover:brightness-110 md:min-h-0 md:py-2"
              >
                {/* Short label on phones so the header never wraps at 390px. */}
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Sign in to the demo</span>
              </Link>
              <MobileMenu items={NAV} />
            </div>
          </div>
        </header>

        <main id="main-content">{children}</main>

        <footer className="mt-20 border-t border-line bg-surface">
          <div className="content-marketing py-12">
            <div className="bridge-rule mb-8 max-w-xs" aria-hidden="true" />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <BridgeLogo className="h-8" />
                  <span className="text-label font-semibold text-ink">TransitionBridge</span>
                </div>
                <p className="mt-3 max-w-sm text-caption text-ink-3">
                  Virginia&apos;s statewide Pre-ETS referral and outcomes platform. Hosted on
                  secure, enterprise cloud infrastructure.
                </p>
              </div>
              <nav aria-label="Footer" className="flex flex-col gap-2 text-caption">
                <Link href="/sources/" className="py-1 text-ink-2 hover:text-orange-deep">
                  Sources and citations
                </Link>
                <Link href="/accessibility/" className="py-1 text-ink-2 hover:text-orange-deep">
                  Accessibility
                </Link>
              </nav>
            </div>
            {/* Footer credit: "Presented by DataIsData" (replaces the earlier IEP Partners, LLC line). */}
            <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <PresentedBy />
              <p className="text-meta text-ink-3">© {new Date().getFullYear()} TransitionBridge</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
