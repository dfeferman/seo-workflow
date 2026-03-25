import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

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
      const template = await apiClient.templates.getById(templateId)
      if (!template) throw new Error('Template nicht gefunden')

      const promptText = String(template.prompt_template ?? '').trim() || ' '
      const payload = {
        prompt_template: promptText,
        template_id: templateId,
      }

      const idsUpdated = new Set<string>()

      const byLink = await apiClient.artifacts.getByTemplate(templateId)
      for (const row of byLink) {
        await apiClient.artifacts.update(row.id as string, payload)
        idsUpdated.add(row.id as string)
      }

      let artifactCode = String(template.artifact_code ?? '').trim()
      if (artifactCode === '' && template.name) {
        const match = String(template.name).match(/^([A-Z0-9]+(?:\.[0-9]+)?)\s*[-–—]/)
        if (match) artifactCode = match[1].trim()
      }
      const phaseNorm = String(template.phase ?? '').toUpperCase().trim().slice(0, 1)

      if (artifactCode !== '' && phaseNorm !== '') {
        const candidates = await apiClient.artifacts.getByPhaseCode(phaseNorm, artifactCode)
        for (const row of candidates) {
          const tid = row.template_id as string | null | undefined
          if (tid == null || String(tid) !== String(templateId)) {
            await apiClient.artifacts.update(row.id as string, payload)
            idsUpdated.add(row.id as string)
          }
        }
      }

      return { count: idsUpdated.size }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['artifacts'] })
    },
  })
}
