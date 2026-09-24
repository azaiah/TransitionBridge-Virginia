'use client';

import Link from 'next/link';
import { BridgeLogo } from '@/components/brand/BrandLogos';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Role } from '@/data/types';
import { ROLES } from '@/data/types';
import { useRoleOptional } from '@/context/RoleContext';
import { getDemoAccounts, type DemoAccount } from '@/lib/demo-accounts';
import { safeReturnPath } from '@/lib/demo-session';
import { AccountAvatar, AccountRow } from './AccountRow';

/** Built once: the persona directory never changes while the page is open. */
const ACCOUNTS = getDemoAccounts();

/** How long the "Signing you in…" step shows. Long enough to read, short enough to not stall a demo. */
const SIGN_IN_DELAY_MS = 900;
const SIGN_IN_DELAY_REDUCED_MS = 250;

/** Reads ?role= (a suggested account) straight from the address bar. */
function suggestedRoleFromUrl(): Role | null {
  const value = new URLSearchParams(window.location.search).get('role');
  return value && (ROLES as readonly string[]).includes(value) ? (value as Role) : null;
}

/**
 * The demonstration sign-in: pick an account, see a short "signing you in" step,
 * land in that person's portal. No password, no real account, nothing sent anywhere.
 *
 * We read the address bar directly (not useSearchParams) so this card can also render
 * as the static fallback before the page finishes loading.
 */
export function AccountChooser() {
  const ctx = useRoleOptional();
  const [pending, setPending] = useState<DemoAccount | null>(null);
  const [suggested, setSuggested] = useState<Role | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // If a "Try the school portal" link sent us here, put keyboard focus on that account.
  useEffect(() => {
    const role = suggestedRoleFromUrl();
    setSuggested(role);
    if (role) {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-account-role="${role}"]`)
        ?.focus();
    }
  }, []);

  function choose(account: DemoAccount) {
    if (pending || !ctx) return;
    setPending(account);
    // Honour "send me back to the page I asked for", but only inside that account's portal.
    const next = new URLSearchParams(window.location.search).get('next');
    const destination = safeReturnPath(next, account.href) ?? undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(
      () => ctx.setRole(account.role, destination),
      reduced ? SIGN_IN_DELAY_REDUCED_MS : SIGN_IN_DELAY_MS,
    );
  }

  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-modal border border-line bg-surface shadow-lg">
      {/* Thin progress bar along the top edge while "signing in". */}
      {pending && (
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-orange-subtle" aria-hidden="true">
          <div className="h-full w-1/3 animate-signin-bar bg-orange-deep motion-reduce:w-full motion-reduce:animate-none" />
        </div>
      )}

      <div className="px-6 pb-4 pt-10 text-center sm:px-10">
        <BridgeLogo className="mx-auto h-14" priority />
        <p className="mt-3 text-label font-semibold text-ink">TransitionBridge</p>
        <h1 className="mt-6 text-h2 text-ink">{pending ? 'Signing you in' : 'Sign in'}</h1>
        <p className="mt-2 text-body text-ink-2">
          {pending ? `Opening the ${pending.portalName.toLowerCase()}…` : 'Choose an account to continue to TransitionBridge'}
        </p>
        {!pending && (
          <p className="mt-3 text-caption text-ink-3">
            Fictional names only — job titles and organizations match real Virginia roles, but
            no person listed here is real. For demonstration purposes.
          </p>
        )}
      </div>

      {/* Screen readers hear the sign-in step without having to hunt for it. */}
      <p className="sr-only" role="status" aria-live="polite">
        {pending ? `Signing in as ${pending.personaName}. Opening the ${pending.portalName}.` : ''}
      </p>

      {pending ? (
        <div className="flex flex-col items-center gap-3 px-6 pb-12 pt-4 text-center">
          <AccountAvatar account={pending} size="lg" />
          <p className="text-label font-semibold text-ink">{pending.personaName}</p>
          <p className="text-caption text-ink-2">
            {pending.title} · {pending.organization}
          </p>
          <p className="mt-2 max-w-xs text-caption text-ink-3">{pending.portalPurpose}</p>
        </div>
      ) : (
        <ul ref={listRef} className="divide-y divide-line border-y border-line" aria-label="Demonstration accounts">
          {ACCOUNTS.map((account) => (
            <AccountRow
              key={account.role}
              account={account}
              highlighted={account.role === suggested}
              onChoose={choose}
            />
          ))}
        </ul>
      )}

      {!pending && (
        <div className="px-6 py-5 sm:px-10">
          <p className="text-caption text-ink-2">
            <strong className="font-semibold text-ink">Demonstration sign-in.</strong> Each account
            opens one view of the product. Names are made up; titles and workplaces illustrate
            real roles. There is no password, and every record inside is synthetic.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1 text-label font-medium text-orange-deep hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      )}
    </div>
  );
}
