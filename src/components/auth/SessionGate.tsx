'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoSession } from '@/lib/demo-session';

/**
 * Keeps the portals "behind" the demonstration sign-in.
 *
 * - Signed in → the page renders exactly as it always has.
 * - Not signed in → a one-line message, then off to /sign-in/, remembering this page
 *   so the visitor comes straight back after choosing an account.
 * - Still loading ('unknown') → render the page. That keeps the static HTML complete
 *   and fast; the check finishes a moment after the page hydrates.
 *
 * This is a demo convenience, not security. Nothing here protects real data —
 * there is no real data to protect.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const session = useDemoSession();
  const router = useRouter();

  useEffect(() => {
    if (session !== 'none') return;
    const here = `${window.location.pathname}${window.location.search}`;
    router.replace(`/sign-in/?next=${encodeURIComponent(here)}`);
  }, [session, router]);

  if (session === 'none') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <p className="text-body text-ink-2" role="status" aria-live="polite">
          Taking you to sign in…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
