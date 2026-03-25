import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { TemplateRow } from '@/types/database.types'

/**
 * Alle Templates des eingeloggten Users.
 */
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<TemplateRow[]> => {
      const rows = await apiClient.templates.getAll()
      return [...rows].sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
    },
  })
}
