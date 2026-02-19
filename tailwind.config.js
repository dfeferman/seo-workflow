/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface2)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        green: 'var(--green)',
        yellow: 'var(--yellow)',
        red: 'var(--red)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--muted)',
        /* Phase badges */
        'phase-a': '#7c3aed',
        'phase-b': '#2563eb',
        'phase-c': '#d97706',
        'phase-d': '#059669',
        'phase-e': '#dc2626',
        'phase-f': '#6b7280',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs: ['12px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.45' }],
        base: ['14px', { lineHeight: '1.5' }],
        lg: ['15px', { lineHeight: '1.5' }],
        xl: ['16px', { lineHeight: '1.5' }],
        '2xl': ['18px', { lineHeight: '1.4' }],
        '3xl': ['20px', { lineHeight: '1.3' }],
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
    },
  },
  plugins: [],
}
