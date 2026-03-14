import { useState, useEffect } from 'react'
import { 
  subscribeToAuth, 
  loginAdmin, 
  logoutAdmin 
} from '@/services/firebase'
import type { AdminUser } from '../types'

// デモ用のアカウント情報（開発環境のみ）
const DEMO_ACCOUNTS = [
  { email: 'admin@kuas.ac.jp', password: 'admin123' },
  { email: 'demo@example.com', password: 'demo123' },
]

export function useAdmin() {
  const [user, setUser] = useState<AdminUser | null>(null)
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
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    
    // デモアカウントのチェック（開発環境のみ）
    // Note: Emulator が接続されている場合、Firebase Auth 側で処理される
    if (import.meta.env.DEV) {
      const demoAccount = DEMO_ACCOUNTS.find(
        (acc) => acc.email === email && acc.password === password
      )
      if (demoAccount) {
        // Emulator Auth が使えない場合のフォールバック
        try {
          await loginAdmin(email, password)
          // Firebase Auth が成功すれば onAuthStateChanged で処理される
          return
        } catch {
          // Firebase Auth が使えない場合、デモユーザーを設定
          const demoUser: AdminUser = {
            uid: 'demo-user-' + Date.now(),
            email: demoAccount.email,
            displayName: 'デモ管理者',
          }
          setUser(demoUser)
          setLoading(false)
          return
        }
      }
    }
    
    try {
      await loginAdmin(email, password)
      // onAuthStateChanged callback will handle setting user
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
