/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        'xs-sm': ['0.8125rem', { lineHeight: '1.125rem' }],
      },
    },
  },
  plugins: [],
}
