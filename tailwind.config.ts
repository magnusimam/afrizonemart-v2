import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#000066', light: '#E6E6F7', dark: '#000044' },
        amber: { DEFAULT: '#FBAC34', light: '#FEF3E2', dark: '#D88E1B' },
        pink: { DEFAULT: '#D416A3', light: '#F8DBED', dark: '#A50F7E' },
        charcoal: '#2C2C2C',
        muted: '#555555',
        border: '#E8E8E8',
        page: '#F7F7F7',
        success: '#1A6B2E',
        danger: '#C0392B',
      },
      fontFamily: {
        raleway: ['var(--font-raleway)', 'sans-serif'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        btn: '10px',
        card: '7px',
        input: '5px',
      },
      maxWidth: {
        site: '1600px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.14)',
      },
      letterSpacing: {
        btn: '0.05em',
      },
    },
  },
  plugins: [],
};

export default config;
