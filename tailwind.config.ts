import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // sky blue
          600: '#2563eb', // vivid royal blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // secondary accent teal
          600: '#0d9488', // deep teal
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        forest: {
          800: '#1e3a8a',
          900: '#172554',
          950: '#0f172a',
        },
        coral: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          400: '#fb7185',
          500: '#ff6b6b',
          600: '#e11d48',
        },
        ink: {
          900: '#0f172a', // dark navy
          950: '#020617',
        },
        leaf: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(37, 99, 235, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'soft': '0 8px 24px -6px rgba(37, 99, 235, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 16px 36px -8px rgba(37, 99, 235, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 24px 48px -12px rgba(37, 99, 235, 0.22), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
        'glow-brand': '0 0 24px -2px rgba(37, 99, 235, 0.35)',
        'glow-teal': '0 0 24px -2px rgba(20, 184, 166, 0.35)',
        'glow-coral': '0 0 24px -2px rgba(255, 107, 107, 0.35)',
        'glow-amber': '0 0 24px -2px rgba(245, 158, 11, 0.35)',
      },
      animation: {
        'float-slow': 'float 5s ease-in-out infinite',
        'float-medium': 'float 3.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
