export const themeTokens = {
  background: {
    light: '#f8fafc',
    dark: '#020617',
  },
  surface: {
    light: '#ffffff',
    dark: '#1e293b',
  },
  border: {
    light: '#cbd5e1', // Slate 300 - High contrast border
    dark: '#475569', // Slate 600
  },
  text: {
    primary: {
      light: '#0f172a', // Slate 900
      dark: '#f1f5f9', // Slate 100
    },
    secondary: {
      light: '#475569', // Slate 600
      dark: '#94a3b8', // Slate 400
    }
  },
  accent: '#7c3aed',
  accentAlt: '#0ea5e9',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626',
} as const

export type ThemeTokens = typeof themeTokens
