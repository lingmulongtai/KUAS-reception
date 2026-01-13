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
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        })
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
    } catch (err: unknown) {
      const firebaseError = err as { code?: string }
      const errorMessage = firebaseError.code === 'auth/invalid-credential' 
        ? 'メールアドレスまたはパスワードが正しくありません'
        : firebaseError.code === 'auth/too-many-requests'
        ? 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください'
        : 'ログインに失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
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
