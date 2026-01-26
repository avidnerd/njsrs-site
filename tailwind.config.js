/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#1e3a8a',
          darkBlue: '#1e40af',
          green: '#10b981',
          darkGreen: '#059669',
        },
      },
    },
  },
  plugins: [],
}
