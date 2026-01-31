/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Эта строка будет сканировать все файлы .js, .ts, .jsx, .tsx
    // прямо в корневой папке frontend и во всех ее подпапках.
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
