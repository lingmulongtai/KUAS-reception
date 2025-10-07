import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services'

interface ReceptionStatsResponse {
  completed: number
  waiting: number
  walkIn: number
  reserved: number
}

async function fetchReceptionStats() {
  return apiClient.get<ReceptionStatsResponse>('/receptions/stats')
}

export function useReceptionStats() {
  return useQuery({
    queryKey: ['reception-stats'],
    queryFn: fetchReceptionStats,
    staleTime: 1000 * 10,
  })
}
