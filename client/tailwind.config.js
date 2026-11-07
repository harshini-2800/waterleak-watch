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
        background: {
          deep: '#050B18',
          surface: '#0B1730',
          elevated: '#11224A',
          light: '#F8FAFC',
          lightSurface: '#FFFFFF',
          lightElevated: '#F1F5F9'
        },
        primary: {
          aqua: '#22D3EE',
          DEFAULT: '#22D3EE',
          hover: '#06B6D4',
          dark: '#0891B2'
        },
        ocean: {
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8',
          light: '#60A5FA'
        },
        tealAccent: '#14B8A6',
        glowViolet: '#8B5CF6',
        severity: {
          low: '#22C55E',
          medium: '#FACC15',
          high: '#FB923C',
          critical: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif']
      },
      boxShadow: {
        'glow-aqua': '0 0 25px -5px rgba(34, 211, 238, 0.4)',
        'glow-critical': '0 0 25px -5px rgba(239, 68, 68, 0.45)',
        'glow-warning': '0 0 25px -5px rgba(251, 146, 60, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'ripple': 'ripple 3s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}

