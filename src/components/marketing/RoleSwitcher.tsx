'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import type { Role } from '@/data/types';
import { ROLES } from '@/data/types';
import { useRoleOptional } from '@/context/RoleContext';
import { endSession } from '@/lib/demo-session';
import { getPersonaForRole, getRoleConfig } from '@/lib/marketing';
import { cn } from '@/lib/utils';

// "Provider" (not "Vendor") matches the page titles and the sign-in screen.
const ROLE_LABELS: Record<Role, string> = {
  state_leadership: 'State leadership',
  dars_counselor: 'DARS counselor',
  school_coordinator: 'School coordinator',
  vendor: 'Provider',
};

/** Short labels for the product header on narrow phones (320–390px). */
const ROLE_LABELS_SHORT: Record<Role, string> = {
  state_leadership: 'State',
  dars_counselor: 'Counselor',
  school_coordinator: 'School',
  vendor: 'Provider',
};

/** Persistent role switcher — 320ms crossfade handled by ProductLayout content wrapper. */
export function RoleSwitcher({ className }: { className?: string }) {
  const ctx = useRoleOptional();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const currentRole = ctx?.role ?? null;
  const currentLabel = currentRole ? ROLE_LABELS[currentRole] : 'Choose view';

  function switchTo(role: Role) {
    setOpen(false);
    ctx?.setRole(role);
  }

  /** Demo sign-out: forget the chosen account and return to the marketing home page. */
  function signOut() {
    setOpen(false);
    endSession();
    router.push('/');
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        className="inline-flex max-w-[11rem] items-center gap-1 rounded-control border border-line bg-surface px-2 py-2 text-label text-ink hover:bg-surface-sunken sm:max-w-none sm:gap-2 sm:px-3"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Hidden on narrow phones to save space; the role name alone is still clear. */}
        <span className="hidden text-caption text-ink-3 sm:inline">Viewing as</span>
        <span className="truncate font-medium sm:max-w-none">
          {currentRole ? (
            <>
              <span className="sm:hidden">{ROLE_LABELS_SHORT[currentRole]}</span>
              <span className="hidden sm:inline">{currentLabel}</span>
            </>
          ) : (
            currentLabel
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-ink-3" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Switch demonstration role"
          className="absolute right-0 z-50 mt-1 max-h-[min(70vh,24rem)] min-w-[min(100vw-2rem,16rem)] overflow-y-auto rounded-control border border-line bg-surface py-1 shadow-pop animate-fade-up sm:min-w-[220px]"
        >
          {ROLES.map((role) => {
            const persona = getPersonaForRole(role);
            const config = getRoleConfig(role);
            return (
              <li key={role} role="option" aria-selected={role === currentRole}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-surface-sunken',
                    role === currentRole && 'bg-orange-subtle',
                  )}
                  onClick={() => switchTo(role)}
                >
                  <span className="block text-label font-medium text-ink">{ROLE_LABELS[role]}</span>
                  {persona && (
                    <span className="block text-caption text-ink-3">
                      {persona.displayName} · {persona.title}
                    </span>
                  )}
                  {!persona && config && (
                    <span className="block text-caption text-ink-3">{config.description}</span>
                  )}
                </button>
              </li>
            );
          })}
          <li className="border-t border-line mt-1 pt-1">
            <Link
              href="/sign-in/"
              className="block px-3 py-2 text-caption text-orange-deep hover:bg-surface-sunken"
              onClick={() => setOpen(false)}
            >
              Switch account →
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-caption text-ink-2 hover:bg-surface-sunken"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
