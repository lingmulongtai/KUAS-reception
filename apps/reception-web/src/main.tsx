import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tailwind.css'
import './i18n'
import App from './App'

const resolveAssetUrl = (relativePath: string) => {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:') {
      return new URL(relativePath, window.location.href).href
    }

    const baseUrl = new URL(import.meta.env.BASE_URL ?? '/', window.location.origin)
    return new URL(relativePath, baseUrl).href
  }

  const fallbackBase = import.meta.env.BASE_URL ?? '/'
  return `${fallbackBase}${relativePath}`
}

if (typeof document !== 'undefined') {
  const backgroundImageRelativePath = 'opencampus-img01.jpg?v=20251028'
  const backgroundImageUrl = resolveAssetUrl(backgroundImageRelativePath)
  document.documentElement.style.setProperty('--app-body-background-image', `url('${backgroundImageUrl}')`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
