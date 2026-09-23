import type { Metadata } from 'next';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Page not found',
};

/** A wrong address is not an error the user made. Send them somewhere useful. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-8 text-center shadow-md">
        <Compass className="mx-auto h-10 w-10 text-ink-3" aria-hidden="true" />
        <h1 className="mt-4 text-h2 text-ink">That page is not here</h1>
        <p className="mt-2 text-body text-ink-2">
          The address may have changed, or it may have been typed slightly differently. Pick a
          view below, or use the search box at the top of any screen to find a student, a school
          division, or a provider.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" href="/sign-in/">
            Choose a view
          </Button>
          <Button variant="secondary" href="/state/">
            Statewide view
          </Button>
          <Button variant="secondary" href="/">
            Start page
          </Button>
        </div>
      </div>
    </main>
  );
}
