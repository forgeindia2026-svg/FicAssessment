/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fff0f0',
          100: '#ffdad4',
          200: '#ffb4a8',
          500: '#a31212',
          600: '#800000',
          700: '#570000',
          800: '#410000',
          900: '#311213'
        },
        gold: {
          50: '#fffdf0',
          100: '#fff7d6',
          200: '#fde182',
          300: '#f9dd7f',
          600: '#715d07',
          700: '#554500'
        },
        surface: {
          bg: '#fff8f7',
          card: '#ffffff',
          low: '#fff0f0',
          container: '#ffe9e8',
          border: '#e2bfb9',
          outline: '#8e706c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem'
      }
    },
  },
  plugins: [],
}
