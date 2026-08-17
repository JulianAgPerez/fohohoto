/** @type {import('tailwindcss').Config} */
export default {
  content: [ "./src/**/*.{js,jsx,ts,tsx}", ],
  theme: {
  extend: {
    fontFamily: {
      sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      christmas: ['"Mountains of Christmas"', 'cursive'],
    },
  },
  },
  plugins: [],
}

