/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Эта строка сканирует все файлы в корне и подпапках
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
