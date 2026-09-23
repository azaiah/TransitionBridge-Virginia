import Link from 'next/link';
import { ProductProviders } from '@/components/providers/ProductProviders';
import { SkipLink } from '@/components/layout/SkipLink';
import { PresentedBy } from '@/components/brand/BrandLogos';
import { AccountChooser } from './AccountChooser';

/**
 * The full sign-in page: a quiet canvas, one centred card, a small footer.
 * Nothing else competes with the one job here — pick an account.
 *
 * Used by /sign-in/ and by the older /enter/ address, so old links keep working.
 */
export function SignInScreen() {
  return (
    <>
      <SkipLink />
      <div data-density="comfortable" className="flex min-h-screen flex-col bg-canvas">
        {/* The brand bridge gradient, as a thin rule across the top of the page. */}
        <div className="h-1 bg-bridge" aria-hidden="true" />

        <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-12">
          {/* RoleProvider lives inside; it needs a Suspense boundary for the URL. */}
          <ProductProviders>
            <AccountChooser />
          </ProductProviders>
        </main>

        <footer className="pb-8 text-center">
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption">
            <Link href="/" className="text-ink-2 hover:text-orange-deep">
              Home
            </Link>
            <Link href="/accessibility/" className="text-ink-2 hover:text-orange-deep">
              Accessibility
            </Link>
            <Link href="/sources/" className="text-ink-2 hover:text-orange-deep">
              Sources
            </Link>
          </nav>
          <PresentedBy className="mt-4" />
        </footer>
      </div>
    </>
  );
}
