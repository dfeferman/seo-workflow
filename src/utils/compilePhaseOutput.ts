/**
 * Kompiliert ein Phase-Output-Template, indem [artifact_code]-Platzhalter
 * mit den finalen Artefakt-Ergebnissen befüllt werden.
 *
 * Platzhalter-Format: [A1], [A2.1], [B2.1], [F5] etc.
 * Unbekannte Platzhalter bleiben unverändert.
 */
export function compilePhaseOutput(
  template: string,
  artifactResults: Map<string, string>
): string {
  if (!template) return ''
  if (artifactResults.size === 0) return template

  return template.replace(/\[([A-Z]\d+(?:\.\d+)?)\]/g, (match, code) => {
    return artifactResults.has(code) ? artifactResults.get(code)! : match
  })
}
