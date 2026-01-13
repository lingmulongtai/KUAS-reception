import { useState, useEffect } from 'react'
import { 
  listenReservations, 
  updateReservation, 
  deleteReservation 
} from '@/services/firebase'
import type { Reservation } from '../types'

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenReservations((items) => {
      setReservations(items)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const update = async (id: string, data: Partial<Reservation>) => {
    await updateReservation(id, data)
  }

  const remove = async (id: string) => {
    await deleteReservation(id)
  }

  // 統計を計算
  const stats = {
    total: reservations.length,
    waiting: reservations.filter((r) => r.status === 'waiting').length,
    completed: reservations.filter((r) => r.status === 'completed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
    reserved: reservations.filter((r) => r.attendee.reserved).length,
    walkIn: reservations.filter((r) => !r.attendee.reserved).length,
  }

  return {
    reservations,
    loading,
    stats,
    updateReservation: update,
    deleteReservation: remove,
  }
}
