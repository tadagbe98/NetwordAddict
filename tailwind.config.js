/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        huawei: {
          red: '#c7000b',
          dark: '#141414',
          accent: '#e60012'
        },
        cisco: {
          blue: '#005073',
          cyan: '#00bceb',
          dark: '#122330'
        },
        omada: {
          blue: '#0070ba',
          teal: '#00c1d5',
          navy: '#0d2238'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
