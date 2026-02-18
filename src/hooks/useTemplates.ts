import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TemplateRow } from '@/types/database.types'

/**
 * Alle Templates des eingeloggten Users.
 */
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<TemplateRow[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}
