import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PhaseOutputTemplateRow } from '@/types/database.types'

/**
 * Alle Phase-Output-Templates des eingeloggten Users (global, eine pro Phase).
 */
export function usePhaseOutputTemplates() {
  return useQuery({
    queryKey: ['phase_output_templates'],
    queryFn: async (): Promise<PhaseOutputTemplateRow[]> => {
      return apiClient.phaseOutputTemplates.getAll()
    },
  })
}
