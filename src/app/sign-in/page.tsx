import type { Metadata } from 'next';
import { SignInScreen } from '@/components/auth/SignInScreen';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Choose a demonstration account to open that person’s view of TransitionBridge.',
};

/** /sign-in/ — the demonstration account chooser. See src/components/auth/. */
export default function SignInPage() {
  return <SignInScreen />;
}
