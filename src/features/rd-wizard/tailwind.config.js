/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#4772fa',
          purple: '#8364e8',
          pink: '#ff4d8d',
          yellow: '#ffb836',
        },
        secondary: {
          blue: '#e8f0ff',
          purple: '#f3f0ff',
          pink: '#ffe8ef',
          yellow: '#fff4e5',
        },
        status: {
          initiation: '#ff4d8d',
          planning: '#8364e8',
          execution: '#ffb836',
        },
        // Primary blues
        blue: {
          50: '#F0F7FF',
          100: '#E1EFFF',
          200: '#C5DCFC',
          300: '#A4C8FA',
          400: '#81AFF7',
          500: '#5E96F3',
          600: '#4A90E2', // Primary blue
          700: '#3B72C2',
          800: '#2D5AA0',
          900: '#1E3C6A',
        },
        // Secondary greens
        green: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // Primary green
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        // Accent colors
        accent: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        // Status colors
        success: {
          light: '#D4EDDA',
          DEFAULT: '#28A745',
          dark: '#1E7E34',
        },
        warning: {
          light: '#FFF3CD',
          DEFAULT: '#FFC107',
          dark: '#D39E00',
        },
        error: {
          light: '#F8D7DA',
          DEFAULT: '#DC3545',
          dark: '#BD2130',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        serif: ['Plus Jakarta Sans', 'Georgia', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
      },
      boxShadow: {
        card: '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};