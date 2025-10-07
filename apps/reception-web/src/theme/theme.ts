export const themeTokens = {
  background: {
    light: '#eff6ff',
    dark: '#020617',
  },
  surface: {
    light: 'rgba(245, 248, 255, 0.65)',
    dark: 'rgba(10, 31, 68, 0.55)',
  },
  border: {
    light: 'rgba(148, 163, 184, 0.35)',
    dark: 'rgba(71, 85, 105, 0.5)',
  },
  accent: '#8b5cf6',
  accentAlt: '#38bdf8',
  success: '#34d399',
  warning: '#facc15',
  danger: '#f87171',
  gradients: {
    aurora:
      'radial-gradient(circle at 20% 20%, rgba(129, 140, 248, 0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.35), transparent 55%)',
    abyss:
      'linear-gradient(145deg, rgba(30, 64, 175, 0.8) 0%, rgba(79, 70, 229, 0.7) 35%, rgba(22, 78, 99, 0.6) 100%)',
  },
} as const

export type ThemeTokens = typeof themeTokens
