import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The two brand marks, in one place so every screen uses them the same way.
 *
 * - BridgeLogo: the IEP Partners bridge — TransitionBridge's product logo.
 * - PresentedBy: footer credit for the product owner (IEP Partners, LLC).
 *   The corner "Powered by DataIsData" badge is separate — see PoweredByBadge.tsx.
 *
 * Both images are generated from the original artwork by `npm run assets`.
 * Change log: replaces the simplified SVG bridge that was used as a placeholder.
 */

/** Intrinsic size of public/brand/iep-bridge.png (keeps the aspect ratio exact). */
const BRIDGE_WIDTH = 480;
const BRIDGE_HEIGHT = 253;

/**
 * The bridge logo. Decorative by default because it always sits next to the product
 * name in text; pass `alt` when it stands alone.
 * Size it with a height class, e.g. `h-9` — the width follows.
 */
export function BridgeLogo({
  className,
  alt = '',
  priority = false,
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/iep-bridge.png"
      alt={alt}
      width={BRIDGE_WIDTH}
      height={BRIDGE_HEIGHT}
      priority={priority}
      className={cn('h-9 w-auto', className)}
    />
  );
}

/** Footer line: who presents the TransitionBridge product (distinct from "Powered by DataIsData"). */
export function PresentedBy({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-caption text-ink-2', className)}>
      Presented by
      <span aria-hidden="true">
        <BridgeLogo className="h-5" />
      </span>
      <span className="font-semibold text-ink">IEP Partners, LLC</span>
    </span>
  );
}
