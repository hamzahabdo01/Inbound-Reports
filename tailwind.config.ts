import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Eucalyptus Enterprise Design System (from DESIGN.md)
        sidebar: {
          bg: '#00373B',
          hover: '#115E59',
          active: '#0B4F54',
          accent: '#86BFC5',
        },
        surface: {
          DEFAULT: '#F6FAFC',
          dim: '#d8dbd7',
          bright: '#F6FAFC',
          'container-lowest': '#ffffff',
          'container-low': '#F0F4F6',
          container: '#EAEEF0',
          'container-high': '#E5E9EB',
          'container-highest': '#DFE3E5',
        },
        'on-surface': {
          DEFAULT: '#181C1E',
          variant: '#404849',
        },
        outline: {
          DEFAULT: '#707979',
          variant: '#CFD8DC',
        },
        primary: {
          // Primary color mapped to navigation/brand color
          DEFAULT: '#0B4F54',
          dark: '#0B4F54',
          hover: '#115E59',
          container: '#86BFC5',
          'on-container': '#ffffff',
        },
        secondary: {
          DEFAULT: '#D97706',
        },
        tertiary: {
          DEFAULT: '#003734',
        },
        error: '#BA1A1A',
        success: '#059669',
        warning: '#D97706',
        'on-primary': '#ffffff',
        background: '#F6FAFC',
        'on-background': '#181C1E',
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

export default config
