import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PhaseOutputTemplateRow } from '@/types/database.types'

/**
 * Alle Phase-Output-Templates des eingeloggten Users (global, eine pro Phase).
 */
export function usePhaseOutputTemplates() {
  return useQuery({
    queryKey: ['phase_output_templates'],
    queryFn: async (): Promise<PhaseOutputTemplateRow[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('phase_output_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('phase', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}
