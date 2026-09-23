'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Repeat } from 'lucide-react';
import { ROLE_LINKS } from './nav-links';
import { cn } from '@/lib/utils';

/**
 * Below 1024 the navigation rail becomes a bottom bar — thumb-reachable, always visible,
 * and never a hamburger nobody opens. docs/06_BUILD_PROMPTS.md prompt 10 §4.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Product navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface shadow-pop lg:hidden print:hidden"
    >
      {ROLE_LINKS.map((item) => {
        const current = pathname.startsWith(item.href.slice(0, -1));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 px-1 py-2 text-meta',
              // Current view is marked with colour, weight, and a top rule — never colour alone.
              current
                ? 'border-t-2 border-orange font-semibold text-orange-deep'
                : 'border-t-2 border-transparent text-ink-2',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {item.shortLabel}
          </Link>
        );
      })}
      <Link
        href="/sign-in/"
        className="flex flex-1 flex-col items-center gap-1 border-t-2 border-transparent px-1 py-2 text-meta text-ink-2"
      >
        <Repeat className="h-5 w-5" aria-hidden="true" />
        Switch
      </Link>
    </nav>
  );
}
