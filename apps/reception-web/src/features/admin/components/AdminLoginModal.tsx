import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, LogIn, Loader2, AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAdmin } from '../hooks/useAdmin'

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: () => void
}

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const { t } = useTranslation()
  const { login, error, clearError, loading } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      onLoginSuccess()
      onClose()
    } catch {
      // エラーはuseAdminで処理される
    }
  }

  const handleClose = () => {
    clearError()
    setEmail('')
    setPassword('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* バックドロップ */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* モーダル */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur dark:bg-slate-900/95">
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ヘッダー */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/30">
            <Shield className="h-8 w-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('admin.login.title', '管理者ログイン')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('admin.login.description', '管理機能にアクセスするには認証が必要です')}
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.login.email', 'メールアドレス')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500"
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.login.password', 'パスワード')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('admin.login.loggingIn', 'ログイン中...')}</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>{t('admin.login.submit', 'ログイン')}</span>
              </>
            )}
          </Button>
        </form>

        {/* デモアカウント情報（開発環境のみ） */}
        {import.meta.env.DEV && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('admin.login.demoInfo', '開発用アカウント')}
            </p>
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <p>Email: <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">admin@kuas.ac.jp</code></p>
              <p>Pass: <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">admin123</code></p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
