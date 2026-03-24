/** @type {import('tailwindcss').Config} */
export default {
  darkMode: false,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#F4F6F8',
        foreground: 'oklch(0.15 0.01 240)',
        card: {
          DEFAULT: '#ffffff',
          foreground: 'oklch(0.15 0.01 240)',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: 'oklch(0.15 0.01 240)',
        },
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'oklch(0.93 0.01 240)',
          foreground: 'oklch(0.25 0.01 240)',
        },
        muted: {
          DEFAULT: 'oklch(0.93 0.01 240)',
          foreground: 'oklch(0.5 0.01 240)',
        },
        accent: {
          DEFAULT: 'oklch(0.93 0.01 240)',
          foreground: 'oklch(0.25 0.01 240)',
        },
        destructive: {
          DEFAULT: '#991B1B',
          foreground: '#ffffff',
        },
        border: 'oklch(0.88 0.01 240)',
        input: 'oklch(0.88 0.01 240)',
        ring: '#3B82F6',
        header: {
          DEFAULT: '#3B82F6',
          foreground: '#ffffff',
        },
        sidebar: {
          DEFAULT: '#ffffff',
          foreground: 'oklch(0.15 0.01 240)',
          primary: '#3B82F6',
          'primary-foreground': '#ffffff',
          accent: 'oklch(0.93 0.01 240)',
          'accent-foreground': 'oklch(0.25 0.01 240)',
          border: 'oklch(0.88 0.01 240)',
          ring: '#3B82F6',
        },
        success: {
          DEFAULT: '#166534',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#92400E',
          foreground: '#ffffff',
        },
        chart: {
          1: '#3B82F6',
          2: '#166534',
          3: '#991B1B',
          4: '#92400E',
          5: '#4B5563',
        },
      },
      borderRadius: {
        lg: '10px',
        md: '8px',
        sm: '6px',
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        modal: '0 4px 24px rgba(0,0,0,0.12)',
        header: '0 2px 8px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};
