/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        panel: '#111',
        ink: '#f7f7f7',
        muted: '#a9a9a9',
        line: '#242424',
        cream: '#fff8ea',
        gold: '#d5a633',
        teal: '#44b5ac',
        mint: '#74d0b7',
        blue: '#7874ff',
        green: '#2bd24b',
        rose: '#f6a4a4',
        purple: '#b142d6',
        orange: '#ffc78f',
      }
    },
  },
  plugins: [],
}

