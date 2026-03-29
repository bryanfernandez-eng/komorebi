/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fogWipe: {
          '0%': { transform: 'translateX(-100%) scaleX(2)', opacity: '0' },
          '30%': { transform: 'translateX(-30%) scaleX(1.5)', opacity: '0.9' },
          '70%': { transform: 'translateX(30%) scaleX(1.5)', opacity: '0.9' },
          '100%': { transform: 'translateX(100%) scaleX(2)', opacity: '0' },
        }
      },
      animation: {
        'fog-wipe': 'fogWipe 1.2s ease-in-out forwards',
      }
    },
  },
  plugins: [],
}

