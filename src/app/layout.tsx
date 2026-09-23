import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import { PresenterMode } from '@/components/demo/PresenterMode';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

/**
 * Absolute base for social preview images. Set SITE_URL at build time to the address the
 * demonstration is served from; without it the previews still build, they just point at
 * whatever host serves the page.
 */
const siteUrl = process.env.SITE_URL ?? 'https://transitionbridge.demo';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TransitionBridge — Virginia Pre-ETS Platform',
    template: '%s · TransitionBridge',
  },
  description:
    'Virginia\'s statewide Pre-ETS referral and outcomes platform. Every referral. Every student. Every division. One live view.',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      // The old SVG placeholder mark was removed; all icons now come from the real bridge logo.
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  // What a Commissioner sees when someone pastes the link into an email.
  openGraph: {
    title: 'TransitionBridge — Virginia Statewide Pre-ETS Referral & Outcomes Platform',
    description:
      'Every referral, every student, every division — one live view. A demonstration built on synthetic data.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TransitionBridge' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TransitionBridge — Virginia Statewide Pre-ETS Referral & Outcomes Platform',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        {/* Shift+P. Renders nothing until a presenter turns it on. */}
        <PresenterMode />
      </body>
    </html>
  );
}
