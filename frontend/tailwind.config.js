/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,services,constants}/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
