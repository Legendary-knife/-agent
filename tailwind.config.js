/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f6f7f2',
        ink: '#161914',
        muted: '#667065',
        line: '#dfe5d8',
        moss: '#2f6b4f',
        mint: '#37c989',
        ocean: '#2f6f9f',
        amber: '#b7791f',
        clay: '#b85c38',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(54, 69, 55, 0.08)',
      },
    },
  },
  plugins: [],
}
