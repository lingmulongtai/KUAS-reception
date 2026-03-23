import { useState, useEffect } from 'react'
import { 
  subscribeToAuth, 
  loginAdmin, 
  logoutAdmin 
} from '@/services/firebase'
import type { AdminUser } from '../types'

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
    
    try {
      await loginAdmin(email, password)
      // onAuthStateChanged callback will handle setting user
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      let errorMessage: string
      
      if (firebaseError.message === 'Firebase is not configured') {
        errorMessage = 'Firebase 環境変数が設定されていません。.env ファイルの VITE_FIREBASE_* を確認してください。'
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
