import { useState, useEffect } from 'react'
import { listenSettings, updateSettings } from '@/services/firebase'
import type { ReceptionSettings } from '../types'

const defaultSettings: ReceptionSettings = {
  isOpen: true,
  maxSelections: 3,
  eventName: 'オープンキャンパス',
}

export function useSettings() {
  const [settings, setSettings] = useState<ReceptionSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenSettings((data) => {
      if (data) {
        setSettings(data)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const update = async (data: Partial<ReceptionSettings>) => {
    await updateSettings(data)
  }

  return {
    settings,
    loading,
    updateSettings: update,
  }
}
