/** @type {import('tailwindcss').Config} */
export default {
  content: [ "./src/**/*.{js,jsx,ts,tsx}", ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        christmas: ['"Mountains of Christmas"', 'cursive'],
        handwriting: ['Caveat', 'cursive'],
      },
      colors: {
        berry: {
          300: '#fca5a5', // red-300
          400: '#f87171', // red-400
          500: '#ef4444', // red-500
          600: '#dc2626', // red-600
          700: '#be123c', // rose-700
        },
      },
    },
  },
  plugins: [],
}