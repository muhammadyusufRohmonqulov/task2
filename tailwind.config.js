/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{ts,tsx}'] },
  theme: {
    extend: {
      colors: {
        navy: '#080D1B',
        bg: '#0B1120',
        card: '#111A2E',
        cyan: { DEFAULT: '#00D4FF', 400: '#33DDFF', 500: '#00D4FF' },
        electric: '#3B82F6',
        violet: { DEFAULT: '#8B5CF6' },
        emerald: { DEFAULT: '#10B981' },
        danger: '#F43F5E',
        ink: '#F8FAFC',
        muted: '#94A3B8',
        line: 'rgba(148,163,184,0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(0,212,255,0.45)',
        'glow-violet': '0 0 40px -10px rgba(139,92,246,0.5)',
        'glow-green': '0 0 40px -10px rgba(16,185,129,0.5)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseRing: { '0%': { transform: 'scale(0.8)', opacity: '0.8' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        dash: { to: { strokeDashoffset: '0' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};
