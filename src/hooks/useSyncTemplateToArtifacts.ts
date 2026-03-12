import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Aktuelles Template (prompt_template) in Artefakte übernehmen:
 * - alle mit template_id = dieses Template
 * - zusätzlich alle mit gleichem artifact_code + phase wie das Template (z. B. bestehende B1.1-Artefakte).
 * Diese werden dabei mit template_id verknüpft. Gibt die Anzahl aktualisierter Artefakte zurück.
 */
export function useSyncTemplateToArtifacts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string): Promise<{ count: number }> => {
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('prompt_template, artifact_code, phase, name')
        .eq('id', templateId)
        .single()
      if (fetchError || !template) throw fetchError ?? new Error('Template nicht gefunden')

      const promptText = template.prompt_template?.trim() || ' '
      const payload = {
        prompt_template: promptText,
        updated_at: new Date().toISOString(),
        template_id: templateId,
      }

      // 1) Alle mit template_id = dieses Template
      const { data: byLink, error: err1 } = await supabase
        .from('artifacts')
        .update(payload)
        .eq('template_id', templateId)
        .select('id')
      if (err1) throw err1
      const idsUpdated = new Set((byLink ?? []).map((r) => r.id))

      // artifact_code: aus Template oder aus Name ableiten (z. B. "B1.1 - Keyword..." → "B1.1")
      let artifactCode = (template.artifact_code ?? '').toString().trim()
      if (artifactCode === '' && template.name) {
        const match = (template.name as string).match(/^([A-Z0-9]+(?:\.[0-9]+)?)\s*[-–—]/)
        if (match) artifactCode = match[1].trim()
      }
      const phaseNorm = (template.phase ?? '').toString().toUpperCase().trim()

      // 2) Zusätzlich: Artefakte mit gleichem artifact_code + phase (z. B. B1.1)
      if (artifactCode !== '' && phaseNorm !== '') {
        // 2a) template_id IS NULL (bestehende, unverknüpfte Artefakte)
        const { data: byCodeNull, error: err2a } = await supabase
          .from('artifacts')
          .update(payload)
          .eq('artifact_code', artifactCode)
          .eq('phase', phaseNorm)
          .is('template_id', null)
          .select('id')
        if (err2a) throw err2a
        for (const r of byCodeNull ?? []) idsUpdated.add(r.id)
        // 2b) template_id gesetzt, aber anderes Template
        const { data: byCodeOther, error: err2b } = await supabase
          .from('artifacts')
          .update(payload)
          .eq('artifact_code', artifactCode)
          .eq('phase', phaseNorm)
          .not('template_id', 'is', null)
          .neq('template_id', templateId)
          .select('id')
        if (err2b) throw err2b
        for (const r of byCodeOther ?? []) idsUpdated.add(r.id)
      }

      const count = idsUpdated.size
      return { count }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['artifacts'] })
    },
  })
}
