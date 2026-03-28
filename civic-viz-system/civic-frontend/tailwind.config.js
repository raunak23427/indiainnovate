/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0f',
          blue: '#00f2ff',
          purple: '#bc13fe',
          red: '#ff003c',
          slate: '#1a1a2e',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00f2ff, 0 0 10px #00f2ff' },
          '100%': { boxShadow: '0 0 20px #00f2ff, 0 0 30px #00f2ff' },
        }
      }
    },
  },
  plugins: [],
}
