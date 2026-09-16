/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#16302A', 2: '#1F4238' },
        sage: { DEFAULT: '#EEF1E7', 2: '#E1E6D6' },
        card: '#FBFAF6',
        marigold: { DEFAULT: '#E2A33B', dark: '#8A5E17' },
        indigo: { DEFAULT: '#2F4858', 2: '#3D5E71' },
        ink: { DEFAULT: '#1A241F', soft: '#4A5750' },
        line: '#D8DCCD'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
