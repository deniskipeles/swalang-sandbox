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