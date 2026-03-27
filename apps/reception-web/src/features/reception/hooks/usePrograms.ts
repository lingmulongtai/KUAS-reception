import { useQuery } from '@tanstack/react-query'
import { type ProgramChoice } from '../types'


async function fetchPrograms(): Promise<ProgramChoice[]> {
  const { apiClient } = await import('@/services')
  const data = await apiClient.get<{ programs: ProgramChoice[] }>('/programs')
  return data.programs
}

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    staleTime: 1000 * 30,
  })
}
