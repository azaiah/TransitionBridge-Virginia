'use client';

import { Suspense, type ReactNode } from 'react';
import { RoleProvider } from '@/context/RoleContext';

function RoleProviderFallback({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Wraps product views with role state synced to the URL. */
export function ProductProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<RoleProviderFallback>{children}</RoleProviderFallback>}>
      <RoleProvider>{children}</RoleProvider>
    </Suspense>
  );
}
