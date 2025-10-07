import { useEffect } from 'react'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'kuas:theme'

function getSystemPreference(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useThemeSync() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const savedTheme = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? getSystemPreference()
    const root = document.documentElement

    if (savedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    const listener = (event: MediaQueryListEvent) => {
      const mode = event.matches ? 'dark' : 'light'
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        if (mode === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', listener)

    return () => {
      media.removeEventListener('change', listener)
    }
  }, [])

  const setTheme = (mode: ThemeMode) => {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, mode)
  }

  const toggleTheme = () => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }

  return { setTheme, toggleTheme }
}
