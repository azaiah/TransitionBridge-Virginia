import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Shown while a screen is being prepared. Shaped like the dashboard underneath it, so the
 * layout does not jump when the real numbers arrive.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-canvas p-6" aria-busy="true">
      <p className="sr-only" role="status">
        Loading this screen.
      </p>
      <div className="content-product">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-5 w-96" />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </main>
  );
}
