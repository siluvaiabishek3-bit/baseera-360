/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Black & Red Professional Theme
        'baseera-black': '#1a1a1a',
        'baseera-darker': '#0f0f0f',
        'baseera-dark': '#2a2a2a',
        'baseera-red': '#DC143C',
        'baseera-red-bright': '#FF4444',
        'baseera-red-dark': '#B91C3C',
        'baseera-light': '#f5f5f5',
        'baseera-gray': '#d4d4d4',
      },
      backgroundImage: {
        'gradient-black-red': 'linear-gradient(135deg, #1a1a1a 0%, #DC143C 100%)',
        'gradient-red-dark': 'linear-gradient(135deg, #DC143C 0%, #0f0f0f 100%)',
        'gradient-dark-red': 'linear-gradient(135deg, #0f0f0f 0%, #FF4444 100%)',
        'gradient-red-accent': 'linear-gradient(135deg, #FF4444 0%, #DC143C 100%)',
      },
    },
  },
  plugins: [],
}