/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'loot-black': '#0f0f0f',
        'loot-dark': '#1a1a1a',
        'loot-card': '#232323',
        'loot-border': '#333333',
        'loot-orange': '#f97316',
      }
    },
  },
  plugins: [],
}
