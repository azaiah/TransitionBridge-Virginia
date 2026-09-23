'use client';

import Link from 'next/link';
import { BridgeLogo } from '@/components/brand/BrandLogos';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProductProviders } from '@/components/providers/ProductProviders';
import { SessionGate } from '@/components/auth/SessionGate';
import { RoleSwitcher } from '@/components/marketing/RoleSwitcher';
import { DemoDataBanner } from '@/components/ui/DemoDataBanner';
import { CoachProvider } from '@/components/onboarding/CoachMarks';
import { HelpMenu } from '@/components/onboarding/HelpMenu';
import { BottomNav } from './BottomNav';
import { GlobalSearch } from './GlobalSearch';
import { SkipLink } from './SkipLink';
import { useRoleOptional } from '@/context/RoleContext';
import { cn } from '@/lib/utils';
import { ROLE_LINKS } from './nav-links';

function ProductLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const roleCtx = useRoleOptional();

  return (
    <CoachProvider>
      <SkipLink />
      <div data-density="compact" className="min-h-screen overflow-x-clip bg-canvas">
        <DemoDataBanner />
        <div className="flex min-h-[calc(100vh-48px)]">
          {/* The rail is the desktop navigation. Below 1024 it becomes the bottom bar. */}
          <aside
            aria-label="Product navigation"
            data-coach="nav"
            className="hidden w-rail shrink-0 flex-col border-r border-navy-soft bg-navy text-ink-on-navy lg:flex"
          >
            <div className="flex h-14 items-center gap-2 border-b border-navy-soft px-4">
              {/* The colour bridge needs a light tile: its dark figures vanish on navy. */}
              <span className="flex h-9 items-center rounded-md bg-white px-1" aria-hidden="true">
                <BridgeLogo className="h-7" />
              </span>
              <span className="text-label font-semibold">TransitionBridge</span>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-3">
              {ROLE_LINKS.map((item) => {
                const current = pathname.startsWith(item.href.slice(0, -1));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'rounded-control px-3 py-2 text-label transition-colors duration-[var(--tb-dur-role)]',
                      current
                        ? 'bg-navy-soft text-white'
                        : 'text-ink-on-navy-2 hover:bg-navy-soft/60 hover:text-white',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-auto border-t border-navy-soft pt-3">
                <Link
                  href="/sign-in/"
                  className="block rounded-control px-3 py-2 text-caption text-ink-on-navy-2 hover:text-white"
                >
                  Switch account
                </Link>
              </div>
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-14 items-center justify-between gap-2 border-b border-line bg-surface px-3 sm:gap-4 sm:px-4">
              {/* min-w-0 lets the search field shrink on 320px phones instead of
                  pushing the help and role buttons off the screen. */}
              <div className="min-w-0 flex-1">
                <GlobalSearch />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <HelpMenu />
                <RoleSwitcher />
              </div>
            </header>
            <main
              id="main-content"
              className={cn(
                'flex-1 p-[var(--tb-gutter)] pb-24 transition-opacity duration-[var(--tb-dur-role)] lg:pb-[var(--tb-gutter)]',
                roleCtx?.isTransitioning && 'opacity-0',
                !roleCtx?.isTransitioning && 'opacity-100 animate-fade-in',
              )}
            >
              <div className="content-product">{children}</div>
            </main>
          </div>
        </div>
        <BottomNav />
      </div>
    </CoachProvider>
  );
}

export function ProductLayout({ children }: { children: ReactNode }) {
  // SessionGate sends signed-out visitors to the demonstration sign-in first.
  return (
    <SessionGate>
      <ProductProviders>
        <ProductLayoutInner>{children}</ProductLayoutInner>
      </ProductProviders>
    </SessionGate>
  );
}
