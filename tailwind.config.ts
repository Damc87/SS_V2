import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx,jsx,js}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgb(var(--border) / <alpha-value>)',
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--surface2) / <alpha-value>)',
        foreground: 'rgb(var(--text) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--text2) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--surface) / <alpha-value>)',
          soft: 'rgb(var(--accent2) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warn) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '10px',
      },
      boxShadow: {
        soft: 'var(--shadow)',
        card: '0 18px 60px -38px rgba(15, 23, 42, 0.45)',
      },
      transitionTimingFunction: {
        'smooth-quad': 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
