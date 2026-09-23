import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Small fixed corner badge — replaces the host's default "Powered by Netlify" pill.
 *
 * Sits above the mobile bottom nav (portals) and hides when printing. Netlify's own
 * widget must still be turned off in the Netlify dashboard; see docs/07_DEPLOY_NETLIFY.md.
 */
export function PoweredByBadge() {
  return (
    <div
      data-powered-by="dataisdata"
      className={cn(
        'pointer-events-none fixed bottom-20 right-3 z-30 print:hidden',
        'lg:bottom-4 lg:right-4',
      )}
      aria-label="Powered by DataIsData"
      role="img"
    >
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-pill border border-navy-soft',
          'bg-navy px-3 py-1.5 text-caption text-ink-on-navy shadow-sm',
        )}
      >
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/10" aria-hidden="true">
          <Image src="/brand/dataisdata-icon.png" alt="" width={95} height={96} className="h-3.5 w-3.5" />
        </span>
        <span>
          Powered by <span className="font-semibold">DataIsData</span>
        </span>
      </span>
    </div>
  );
}
