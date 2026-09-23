'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * The last line of defence during a live demonstration. Never shows a stack trace, never
 * blames the user, and always offers two ways forward. docs/11_USABILITY.md test 4.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Kept in the console for us, never put on screen for them.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-8 text-center shadow-md">
        <AlertTriangle className="mx-auto h-10 w-10 text-risk" aria-hidden="true" />
        <h1 className="mt-4 text-h2 text-ink">This screen did not load</h1>
        <p className="mt-2 text-body text-ink-2">
          Nothing you did caused this, and nothing was lost. Try loading it again — if it keeps
          happening, the statewide view is still a good place to pick up.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" href="/state/">
            Go to the statewide view
          </Button>
        </div>
      </div>
    </main>
  );
}
