/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f4',
          100: '#e1efe6',
          200: '#c5dfd0',
          300: '#9ac5b0',
          400: '#6ba68d',
          500: '#488870',
          600: '#356d59',
          700: '#2d6a4f',
          800: '#1a4d2e',
          900: '#0d2b1a',
          950: '#06170d',
        },
      },
    },
  },
  plugins: [],
}
