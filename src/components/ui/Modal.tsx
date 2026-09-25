'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  title: string;
  /** One line under the title saying what this dialog is for. */
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons, right-aligned. Put the single primary action last. */
  footer?: ReactNode;
  className?: string;
}

/**
 * One accessible dialog for the whole product: labelled, Escape closes it, focus moves in
 * on open and back to whatever opened it on close, and Tab stays inside while it is open.
 * Nobody is ever trapped — the close button and Escape always work.
 */
export function Modal({ open, title, description, onClose, children, footer, className }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  // Held in a ref so a parent passing a new function each render does not re-run the
  // open effect (which would pull focus back to the first field on every keystroke).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Focus the first real control, or the panel itself.
    const first = panel?.querySelector<HTMLElement>(
      'input, select, textarea, button:not([data-close]), [href], [tabindex]:not([tabindex="-1"])',
    );
    (first ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const firstEl = focusable[0]!;
      const lastEl = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      returnTo.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4 print:hidden">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative max-h-[92vh] w-full overflow-y-auto rounded-t-modal border border-line bg-surface p-5 shadow-pop animate-fade-up sm:max-w-lg sm:rounded-modal',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-h3 text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-body text-ink-2">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            data-close
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-surface-sunken hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
