import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The two brand marks, in one place so every screen uses them the same way.
 *
 * - BridgeLogo: the IEP Partners bridge — TransitionBridge's product logo.
 * - PresentedBy: "Presented by DataIsData" with the small DataIsData icon.
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

/**
 * "Presented by DataIsData" with the icon.
 * The icon is light silver artwork, so it sits on a small navy tile — on the white
 * footer it would otherwise be almost invisible.
 */
export function PresentedBy({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-caption text-ink-2', className)}>
      Presented by
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-navy" aria-hidden="true">
        <Image src="/brand/dataisdata-icon.png" alt="" width={95} height={96} className="h-4 w-4" />
      </span>
      <span className="font-semibold text-ink">DataIsData</span>
    </span>
  );
}
