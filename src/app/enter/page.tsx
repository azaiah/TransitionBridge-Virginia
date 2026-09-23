import type { Metadata } from 'next';
import { SignInScreen } from '@/components/auth/SignInScreen';

export const metadata: Metadata = {
  title: 'Sign in',
};

/**
 * /enter/ was the old "Choose your view" page. It now shows the same demonstration
 * sign-in as /sign-in/, so any link or bookmark that still points here keeps working.
 */
export default function EnterPage() {
  return <SignInScreen />;
}
