/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        osmanthus: {
          50: '#f4f9f4',
          100: '#e5f2e6',
          200: '#cce5ce',
          300: '#a3d0a8',
          400: '#75b57b',
          500: '#4e9956',
          600: '#3b7c42',
          700: '#326339',
          800: '#2b4f31',
          900: '#23412a',
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}