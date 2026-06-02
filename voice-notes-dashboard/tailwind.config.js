/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00ff88',
        'bg-primary': '#111111',
        'bg-secondary': '#1a1a1a',
        'bg-card': '#222222',
        'bg-hover': '#2a2a2a',
        'text-primary': '#f0f0f0',
        'text-muted': '#888888',
        'border-subtle': '#333333',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
