import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'swa-green': '#32ff84',
        'swa-dark': '#111111',
        'swa-gray': '#1a1a1a',
        'swa-light-gray': '#a0a0a0',
        'swa-code-bg': '#1e1e1e',
        // '======new lines=====': '==================',
        'swalang-dark': '#1a1a2e',
        'swalang-blue': '#16213e',
        'swalang-purple': '#0f3460',
        'swalang-accent': '#e94560',
        'swalang-light': '#c0c0c0',

        // Light mode colors
        'swalang-light-bg': '#f8f9fa',
        'swalang-light-surface': '#ffffff',
        'swalang-light-text': '#212529',
        'swalang-light-subtle': '#6c757d',
        'swalang-light-border': '#dee2e6',
      },
      fontFamily: {
        sans: ['var(--font-source-sans-pro)'],
        mono: ['var(--font-source-code-pro)'],
        hand: ['var(--font-architects-daughter)'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;