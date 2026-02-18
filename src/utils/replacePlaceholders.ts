import type { CategoryRow } from '@/types/database.types'

const MAX_RECURSIVE_ITERATIONS = 5

/**
 * Baut die Ersetzungsmap aus Kategorie-Metadaten.
 * Keine [LAND] oder [SPRACHE] (laut Guide nicht verfügbar).
 */
function buildCategoryReplacements(category: CategoryRow | null): Record<string, string> {
  if (!category) return {}
  return {
    '[KATEGORIE]': category.name ?? '[KATEGORIE]',
    '[ZIELGRUPPEN]':
      Array.isArray(category.zielgruppen) && category.zielgruppen.length > 0
        ? category.zielgruppen.join(', ')
        : '[ZIELGRUPPEN]',
    '[USPs]': category.usps ?? '[USPs]',
    '[TON]': category.ton ?? '[TON]',
    '[NO-GOS]': category.no_gos ?? '[NO-GOS]',
    '[SHOP-TYP]': category.shop_typ ?? '[SHOP-TYP]',
  }
}

/**
 * Ersetzt Platzhalter im Text. Fallback für undefined: Platzhalter-Name bleibt.
 * Rekursives Ersetzen: verschachtelte Platzhalter werden aufgelöst (z. B. Wert enthält selbst [KATEGORIE]).
 */
function replaceMap(
  template: string,
  replacements: Record<string, string>
): string {
  let result = template
  let prev = ''
  let iterations = 0
  while (result !== prev && iterations < MAX_RECURSIVE_ITERATIONS) {
    prev = result
    for (const [placeholder, value] of Object.entries(replacements)) {
      const safe = value ?? placeholder
      result = result.split(placeholder).join(safe)
    }
    iterations++
  }
  return result
}

/**
 * Ersetzt Platzhalter im Prompt-Template durch Kategorie-Metadaten.
 * Optional: dynamische Platzhalter (z. B. [INPUT A], [BRIEFING], [TEXT]) aus dependencyMap.
 * Keine [LAND] oder [SPRACHE] (laut Guide nicht verfügbar).
 */
export function replacePlaceholders(
  template: string,
  category: CategoryRow | null,
  dependencyMap?: Record<string, string> | null
): string {
  const categoryMap = buildCategoryReplacements(category)
  const merged: Record<string, string> = { ...categoryMap }
  if (dependencyMap && typeof dependencyMap === 'object') {
    for (const [key, value] of Object.entries(dependencyMap)) {
      merged[key] = value ?? key
    }
  }
  return replaceMap(template, merged)
}
