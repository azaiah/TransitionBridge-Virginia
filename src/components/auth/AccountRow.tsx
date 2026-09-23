import { ChevronRight } from 'lucide-react';
import type { DemoAccount } from '@/lib/demo-accounts';
import { cn } from '@/lib/utils';

/** The round initials badge. Decorative: the name next to it carries the meaning. */
export function AccountAvatar({ account, size = 'md' }: { account: DemoAccount; size?: 'md' | 'lg' }) {
  return (
    // Plain join, not cn(): cn's class merger reads the custom size classes (text-label,
    // text-h3) as colors and would silently drop text-white.
    <span
      aria-hidden="true"
      className={[
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        size === 'md' ? 'h-10 w-10 text-label' : 'h-16 w-16 text-h3',
        account.avatarClass,
      ].join(' ')}
    >
      {account.initials}
    </span>
  );
}

/**
 * One row in the account chooser — a single big button, like the familiar
 * "Choose an account" screens people already know how to use.
 */
export function AccountRow({
  account,
  highlighted,
  onChoose,
}: {
  account: DemoAccount;
  /** True when the visitor arrived from a "try this portal" link for this role. */
  highlighted: boolean;
  onChoose: (account: DemoAccount) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onChoose(account)}
        data-account-role={account.role}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-4 text-left transition-colors sm:gap-4 sm:px-6',
          'hover:bg-surface-sunken focus-visible:bg-surface-sunken',
          highlighted && 'bg-orange-subtle/60',
        )}
      >
        <AccountAvatar account={account} />
        <span className="min-w-0 flex-1">
          <span className="block text-label font-semibold text-ink">
            {account.personaName}
            <span className="font-normal text-ink-2"> · {account.title}</span>
          </span>
          <span className="block truncate text-caption text-ink-2">{account.organization}</span>
          <span className="mt-1 inline-block rounded-pill border border-line px-2 py-0.5 text-meta text-ink-2">
            {account.portalName}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
      </button>
    </li>
  );
}
