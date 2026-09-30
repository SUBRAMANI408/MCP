/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Vibrant Electric Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        sport: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Energetic Orange
          600: '#d97706',
          700: '#b45309',
          900: '#78350f',
        },
        accent: {
          400: '#bef264',
          500: '#a3e635', // Neon Volt Green (for live status, aggressive accents)
          600: '#84cc16',
          700: '#65a30d',
        },
        dark: {
          50: '#fafafa',
          100: '#f4f4f5',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a', // Deep Carbon
          900: '#18181b', // Obsidian
          950: '#09090b', // Pure Black
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'pulse-fast': 'pulseFast 1s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        pulseFast: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(0.98)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
