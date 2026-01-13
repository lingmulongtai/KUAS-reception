import { useState, useEffect } from 'react'
import { 
  subscribeToAuth, 
  loginAdmin, 
  logoutAdmin 
} from '@/services/firebase'
import type { AdminUser } from '../types'

// デモ用のアカウント情報
const DEMO_ACCOUNTS = [
  { email: 'admin@kuas.ac.jp', password: 'admin123' },
  { email: 'demo@example.com', password: 'demo123' },
]

const STORAGE_KEY = 'kuasAdminUser'

export function useAdmin() {
  const [user, setUser] = useState<AdminUser | null>(() => {
    // ローカルストレージからユーザーを復元（ログアウトするまで維持）
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(STORAGE_KEY)
      if (savedUser) {
        try {
          return JSON.parse(savedUser)
        } catch {
          return null
        }
      }
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        const adminUser: AdminUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }
        setUser(adminUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser))
      } else {
        // ローカルストレージにユーザーがあればそれを維持
        const savedUser = localStorage.getItem(STORAGE_KEY)
        if (!savedUser) {
          setUser(null)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    
    // デモアカウントのチェック（開発環境のみ）
    if (import.meta.env.DEV) {
      const demoAccount = DEMO_ACCOUNTS.find(
        (acc) => acc.email === email && acc.password === password
      )
      if (demoAccount) {
        const demoUser: AdminUser = {
          uid: 'demo-user-' + Date.now(),
          email: demoAccount.email,
          displayName: 'デモ管理者',
        }
        setUser(demoUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser))
        setLoading(false)
        return
      }
    }
    
    try {
      await loginAdmin(email, password)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      let errorMessage: string
      
      if (firebaseError.message === 'Firebase is not configured') {
        errorMessage = 'Firebase が設定されていません。開発用アカウントをお試しください。'
      } else if (firebaseError.code === 'auth/invalid-credential') {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません'
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください'
      } else {
        errorMessage = 'ログインに失敗しました'
      }
      
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      // ローカルストレージからユーザーを削除
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
      await logoutAdmin()
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    clearError: () => setError(null),
  }
}
