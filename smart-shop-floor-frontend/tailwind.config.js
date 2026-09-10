/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          bg: '#10141B',
          card: '#171E28',
          cardElevated: '#1E2836',
          border: '#253441',
          surface: '#314B5C',
          brandDeep: '#C41E23',
          brandBright: '#FE4B4A',
        },
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
        themeBrand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          subtle: 'var(--brand-subtle)',
          glow: 'var(--brand-glow)',
          border: 'var(--brand-border)',
        },
        industrial: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        status: {
          healthy: '#10b981',   // emerald-500
          warning: '#f59e0b',   // amber-500
          critical: '#ef4444',  // red-500
          info: '#0ea5e9',      // sky-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
