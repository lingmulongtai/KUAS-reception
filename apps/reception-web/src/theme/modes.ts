export interface ThemeModeConfig {
  background: string
  surface: string
  content: string
  subtle: string
  accent: string
  outline: string
}

export const themeModes: Record<'light' | 'dark', ThemeModeConfig> = {
  light: {
    background: '#eff6ff',
    surface: 'rgba(255, 255, 255, 0.65)',
    content: '#0f172a',
    subtle: 'rgba(15, 23, 42, 0.6)',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #38bdf8 60%, #f0abfc 100%)',
    outline: 'rgba(148, 163, 184, 0.35)',
  },
  dark: {
    background: '#020617',
    surface: 'rgba(2, 6, 23, 0.65)',
    content: '#e2e8f0',
    subtle: 'rgba(226, 232, 240, 0.65)',
    accent: 'linear-gradient(145deg, rgba(168, 85, 247, 0.85) 0%, rgba(59, 130, 246, 0.6) 100%)',
    outline: 'rgba(71, 85, 105, 0.45)',
  },
}
