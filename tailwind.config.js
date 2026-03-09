/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Nur Workflow-Phasen (Domain); Rest = Standard Tailwind (slate/blue)
      colors: {
        'phase-a': '#7c3aed',
        'phase-b': '#2563eb',
        'phase-c': '#d97706',
        'phase-d': '#059669',
        'phase-e': '#dc2626',
        'phase-f': '#6b7280',
        // Helle Hintergrundvarianten für Phase-Badges
        'phase-a-light': '#f3e8ff',
        'phase-b-light': '#dbeafe',
        'phase-c-light': '#fef3c7',
        'phase-d-light': '#d1fae5',
        'phase-e-light': '#fee2e2',
        'phase-f-light': '#f3f4f6',
      },
      fontSize: {
        '2xs': ['12px', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
