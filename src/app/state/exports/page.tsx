import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { Button } from '@/components/ui/Button';
import { Rsa911Export } from '@/components/state/Rsa911Export';

export const metadata: Metadata = {
  title: 'RSA-911 aligned export',
};

/**
 * The federal reporting export. The wording on this page is deliberate: "aligned" only.
 * Calling it certified or compliant would be an overclaim, and a reporting officer would
 * catch it immediately.
 */
export default function StateExportsPage() {
  return (
    <ProductLayout>
      <h1 className="text-h1 text-ink">RSA-911 aligned export</h1>
      <p className="mt-2 max-w-2xl text-body text-ink-2">
        One row per Pre-ETS service delivered, in the shape of the federal case service report:
        record identifier, plan type, the required activity delivered, the date the student
        first received a Pre-ETS service, the provider, and the service date.
      </p>

      <p className="mt-4 max-w-2xl rounded-card border border-line bg-surface-sunken p-4 text-caption text-ink-2">
        <strong className="text-ink">Aligned, not certified.</strong> The columns match the
        federal file so reporting staff are not rebuilding it by hand. It is not a validated
        submission, and every record in this demonstration is synthetic.{' '}
        <a
          href="/sources/#cite-B1-rsa-911"
          className="text-orange-deep underline underline-offset-2 hover:no-underline"
        >
          Source: RSA — Case Service Report (RSA-911)
        </a>
      </p>

      <div className="mt-8">
        <Rsa911Export />
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button variant="secondary" href="/state/reserve/">
          Back to the reserve
        </Button>
        <Button variant="secondary" href="/state/">
          Back to statewide view
        </Button>
      </div>
    </ProductLayout>
  );
}
