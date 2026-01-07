import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Status colors for badges
        status: {
          success: {
            bg: 'hsl(var(--status-success-bg))',
            text: 'hsl(var(--status-success-text))',
            border: 'hsl(var(--status-success-border))',
          },
          error: {
            bg: 'hsl(var(--status-error-bg))',
            text: 'hsl(var(--status-error-text))',
            border: 'hsl(var(--status-error-border))',
          },
          warning: {
            bg: 'hsl(var(--status-warning-bg))',
            text: 'hsl(var(--status-warning-text))',
            border: 'hsl(var(--status-warning-border))',
          },
          info: {
            bg: 'hsl(var(--status-info-bg))',
            text: 'hsl(var(--status-info-text))',
            border: 'hsl(var(--status-info-border))',
          },
        },
        // Sidebar colors
        sidebar: {
          bg: 'hsl(var(--sidebar-bg))',
          'bg-50': 'hsl(var(--sidebar-bg-50))',
          'bg-95': 'hsl(var(--sidebar-bg-95))',
          border: 'hsl(var(--sidebar-border))',
          text: 'hsl(var(--sidebar-text))',
          'text-muted': 'hsl(var(--sidebar-text-muted))',
          active: 'hsl(var(--sidebar-active))',
          'active-bg': 'hsl(var(--sidebar-active-bg))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
      },
      boxShadow: {
        'minimal-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'minimal-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'enter': 'enter 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        enter: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
