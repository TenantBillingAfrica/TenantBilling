/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0d0520',
          800: '#1a0a3e',
          700: '#2d1b69',
          600: '#3d2b7a',
        },
        sunshine: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        coral: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        mint: {
          400: '#34d399',
          500: '#10b981',
        },
        lavender: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#ddd0ff',
        },
        warm: {
          50: '#faf8f5',
          100: '#f5f0ea',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
