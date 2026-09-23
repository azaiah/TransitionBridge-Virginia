import type { Config } from 'tailwindcss';

/**
 * Every value here maps to a CSS custom property declared in globals.css.
 * The custom properties are the single source of truth; this file only exposes
 * them to utility classes. Do not hard-code a hex value in this file.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: 'var(--tb-orange)',
          deep: 'var(--tb-orange-deep)',
          bright: 'var(--tb-orange-bright)',
          subtle: 'var(--tb-orange-subtle)',
        },
        canvas: 'var(--tb-canvas)',
        surface: {
          DEFAULT: 'var(--tb-surface)',
          sunken: 'var(--tb-surface-sunken)',
        },
        navy: {
          DEFAULT: 'var(--tb-navy)',
          soft: 'var(--tb-navy-soft)',
        },
        ink: {
          DEFAULT: 'var(--tb-ink)',
          2: 'var(--tb-ink-2)',
          3: 'var(--tb-ink-3)',
          disabled: 'var(--tb-ink-disabled)',
          'on-navy': 'var(--tb-ink-on-navy)',
          'on-navy-2': 'var(--tb-ink-on-navy-2)',
        },
        line: {
          DEFAULT: 'var(--tb-border)',
          strong: 'var(--tb-border-strong)',
          hair: 'var(--tb-hairline)',
        },
        viz: {
          1: 'var(--tb-viz-1)',
          2: 'var(--tb-viz-2)',
          3: 'var(--tb-viz-3)',
          4: 'var(--tb-viz-4)',
          5: 'var(--tb-viz-5)',
          6: 'var(--tb-viz-6)',
          neutral: 'var(--tb-viz-neutral)',
        },
        ok: { DEFAULT: 'var(--tb-ok)', bg: 'var(--tb-ok-bg)' },
        warn: { DEFAULT: 'var(--tb-warn)', bg: 'var(--tb-warn-bg)' },
        risk: { DEFAULT: 'var(--tb-risk)', bg: 'var(--tb-risk-bg)' },
        info: { DEFAULT: 'var(--tb-info)', bg: 'var(--tb-info-bg)' },
        neutral: { DEFAULT: 'var(--tb-neutral)', bg: 'var(--tb-neutral-bg)' },
      },
      fontFamily: {
        sans: 'var(--tb-font-sans)',
        serif: 'var(--tb-font-serif)',
        mono: 'var(--tb-font-mono)',
      },
      fontSize: {
        // role / [size, {lineHeight, letterSpacing, fontWeight}] — see 03_DESIGN_SYSTEM.md §2
        display: ['var(--tb-size-display)', { lineHeight: '1.06', letterSpacing: '-0.02em', fontWeight: '400' }],
        h1: ['var(--tb-size-h1)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        h2: ['var(--tb-size-h2)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['var(--tb-size-h3)', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['var(--tb-size-body)', { lineHeight: '1.55' }],
        'body-lg': ['var(--tb-size-body-lg)', { lineHeight: '1.6' }],
        label: ['var(--tb-size-label)', { lineHeight: '1.4', fontWeight: '500' }],
        caption: ['var(--tb-size-caption)', { lineHeight: '1.4' }],
        meta: ['var(--tb-size-meta)', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '500' }],
        kpi: ['var(--tb-size-kpi)', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '650' }],
        'kpi-lg': ['var(--tb-size-kpi-lg)', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '650' }],
      },
      borderRadius: {
        card: '16px',
        control: '10px',
        table: '12px',
        modal: '20px',
        pill: '999px',
      },
      boxShadow: {
        sm: 'var(--tb-shadow-sm)',
        md: 'var(--tb-shadow-md)',
        lg: 'var(--tb-shadow-lg)',
        pop: 'var(--tb-shadow-pop)',
      },
      backgroundImage: {
        bridge: 'var(--tb-bridge)',
      },
      maxWidth: {
        marketing: '1200px',
        product: '1680px',
      },
      spacing: {
        rail: '240px',
        'rail-collapsed': '64px',
        drawer: '360px',
        row: '40px',
        'row-touch': '44px',
      },
      screens: {
        xs: '390px',
        sm: '768px',
        md: '1024px',
        lg: '1440px',
        xl: '1680px',
      },
      transitionTimingFunction: {
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        // The thin bar that sweeps across the sign-in card while "signing in".
        'signin-bar': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(300%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 240ms ease-out both',
        'fade-in': 'fade-in 320ms ease-in-out both',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.32,0.72,0,1) both',
        'signin-bar': 'signin-bar 900ms ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
