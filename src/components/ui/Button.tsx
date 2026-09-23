import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
  children: ReactNode;
  /** Marks this control as a coach-mark target. See src/lib/coach.ts. */
  'data-coach'?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-orange-deep text-white border border-orange-deep hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-surface-sunken active:bg-surface-sunken',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-risk text-white border border-risk hover:brightness-110',
};

/**
 * One primary button per screen (docs/11_USABILITY.md test 3).
 * Use variant="primary" only for the single most important action.
 */
export function Button({ variant = 'secondary', href, className, children, ...props }: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-label font-medium',
    'transition-[background,filter] duration-[var(--tb-dur-hover)]',
    'disabled:opacity-50 disabled:pointer-events-none',
    'min-h-row-touch sm:min-h-0',
    variantClasses[variant],
    className,
  );

  if (href) {
    // A link, not a button — but it keeps the same look, accessible name, and coach target.
    return (
      <Link
        href={href}
        className={classes}
        aria-label={props['aria-label']}
        data-coach={props['data-coach']}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
