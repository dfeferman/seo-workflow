import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlt in .env. Connection wird fehlschlagen.'
  )
}

/**
 * Supabase Browser-Client für die SEO Workflow Platform.
 * RLS ist aktiv – alle Queries laufen im Kontext des eingeloggten Users.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
