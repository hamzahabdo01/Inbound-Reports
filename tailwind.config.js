/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Eucalyptus Enterprise Design System
        surface: {
          DEFAULT: '#f8faf6',
          dim: '#d8dbd7',
          bright: '#f8faf6',
          'container-lowest': '#ffffff',
          'container-low': '#f2f4f1',
          container: '#eceeeb',
          'container-high': '#e7e9e5',
          'container-highest': '#e1e3e0',
        },
        'on-surface': {
          DEFAULT: '#191c1b',
          variant: '#404944',
        },
        'inverse-surface': '#2e312f',
        'inverse-on-surface': '#eff1ee',
        outline: {
          // Use much lighter outline tones so borders appear subtle
          DEFAULT: '#CFD8DC',
          variant: '#F0F4F6',
        },
        'surface-tint': '#2b6954',
        primary: {
          DEFAULT: '#003527',
          container: '#064e3b',
          'on-container': '#80bea6',
          fixed: '#b0f0d6',
          'fixed-dim': '#95d3ba',
          'on-fixed': '#002117',
          'on-fixed-variant': '#0b513d',
        },
        'on-primary': '#ffffff',
        'inverse-primary': '#95d3ba',
        secondary: {
          DEFAULT: '#545f73',
          container: '#d5e0f8',
          'on-container': '#586377',
          fixed: '#d8e3fb',
          'fixed-dim': '#bcc7de',
          'on-fixed': '#111c2d',
          'on-fixed-variant': '#3c475a',
        },
        'on-secondary': '#ffffff',
        tertiary: {
          DEFAULT: '#4f1f19',
          container: '#6b342d',
          'on-container': '#ea9e93',
          fixed: '#ffdad5',
          'fixed-dim': '#ffb4a9',
          'on-fixed': '#380d08',
          'on-fixed-variant': '#6e372f',
        },
        'on-tertiary': '#ffffff',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#93000a',
        },
        'on-error': '#ffffff',
        background: '#f8faf6',
        'on-background': '#191c1b',
        'surface-variant': '#e1e3e0',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-kpi': ['36px', { lineHeight: '44px', fontWeight: '800', letterSpacing: '-0.02em' }],
        'headline-lg': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'header-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-caps': ['11px', { lineHeight: '16px', fontWeight: '700', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'base': '4px',
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'gutter': '20px',
        'container-max': '1440px',
      },
      maxWidth: {
        'container': '1440px',
      },
      boxShadow: {
        'level-2': '0px 4px 6px -1px rgba(0, 0, 0, 0.05)',
        'level-3': '0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
