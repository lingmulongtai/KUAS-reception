import { useState, useEffect } from 'react'
import { 
  listenPrograms, 
  addProgram, 
  updateProgram, 
  deleteProgram 
} from '@/services/firebase'
import type { Program } from '../types'

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenPrograms((items) => {
      setPrograms(items)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const add = async (program: Omit<Program, 'id'>) => {
    return await addProgram(program)
  }

  const update = async (id: string, data: Partial<Program>) => {
    await updateProgram(id, data)
  }

  const remove = async (id: string) => {
    await deleteProgram(id)
  }

  return {
    programs,
    loading,
    addProgram: add,
    updateProgram: update,
    deleteProgram: remove,
  }
}
