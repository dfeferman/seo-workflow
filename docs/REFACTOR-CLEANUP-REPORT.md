# Refactor & Cleanup – Bericht

**Datum:** 2026-02-20  
**Scope:** SEO-workflow `src/` + Abhängigkeiten

---

## Durchgeführte Säuberungen

### 1. Ungenutzte npm-Abhängigkeiten entfernt

In `package.json` wurden folgende **nicht verwendeten** Dependencies entfernt:

| Paket | Grund |
|-------|--------|
| `react-hook-form` | Kein `useForm`/`Controller`/`register` in der Codebase |
| `@hookform/resolvers` | Wird nur mit react-hook-form genutzt |
| `zod` | Keine Schema-Validierung (z. B. `z.object`) in `src/` |
| `zustand` | Kein `create()`/Store in `src/` |

**Aktion:** Diese vier Einträge wurden aus `dependencies` gelöscht.  
**Nächster Schritt:** Im Projektroot `npm install` ausführen, damit `package-lock.json` und `node_modules` angepasst werden.

---

## Bewusst unverändert

### 1. `createDefaultArtifacts.ts` – Legacy-Exports

- **`getDefaultArtifactsForCategory`**, **`CATEGORY_DEFAULT_ARTIFACTS`**, **`BLOG_DEFAULT_ARTIFACTS`**, **`DefaultArtifactSpec`** werden in der App **nicht mehr genutzt** (Kategorie-Erstellung nutzt nur noch `buildArtifactsFromTemplates`).
- Sie werden nur noch in **`createDefaultArtifacts.test.ts`** verwendet und dort getestet.
- **Entscheidung:** Vorerst beibehalten. Die Tests dokumentieren das alte Verhalten; ein späterer Schritt kann die Tests auf `buildArtifactsFromTemplates` umstellen und die Legacy-Exports entfernen.

### 2. `LoadingSkeleton.tsx` – alle Exports genutzt

- **SkeletonLine**, **SkeletonBox**: Nur intern von anderen Skeleton-Komponenten genutzt.
- **SidebarProjectSkeleton**, **SidebarCategorySkeleton**, **WorkflowTableRowSkeleton**, **TemplateCardSkeleton**: Werden von den jeweiligen „Grid“-Komponenten (SidebarProjectsSkeleton, WorkflowTableSkeleton, TemplateGridSkeleton) verwendet.
- Kein toter Export.

### 3. `database.types.ts` – **ArtifactDependencyRow** / **ArtifactDependencyInsert**

- Werden aktuell nirgends importiert.
- Typen für die Tabelle `artifact_dependencies`; Beibehaltung sinnvoll für zukünftige Features oder generierte Typen. Keine Änderung.

---

## Keine weiteren Funde

- **Tote Imports:** Keine systematische Prüfung (z. B. per knip/ts-prune) durchgeführt; ESLint-Konfiguration (v9) war im Projekt nicht nutzbar.
- **Doppelte Logik:** Keine offensichtlichen Duplikate, die eine sofortige Konsolidierung erfordern.
- **Ungenutzte Variablen:** Nicht flächendeckend geprüft.

---

## Empfehlungen für später

1. **Legacy in createDefaultArtifacts:** Tests auf `buildArtifactsFromTemplates` umstellen und danach `getDefaultArtifactsForCategory`, `CATEGORY_DEFAULT_ARTIFACTS`, `BLOG_DEFAULT_ARTIFACTS` sowie ggf. `DefaultArtifactSpec` entfernen.
2. **Dead-Code-Check:** Tool wie **knip** oder **ts-prune** einbinden, um ungenutzte Exports/Imports dauerhaft zu finden.
3. **ESLint:** Auf `eslint.config.js` (Flat Config) migrieren, damit `npm run lint` wieder läuft und z. B. unused vars/imports gemeldet werden.
