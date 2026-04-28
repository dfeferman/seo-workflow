# SP23 — Manuelle Seiten und Links (Create + Update)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `POST`/`PUT` fuer `pages` und `page_links`, UI: Sidebar-Block „Graph bearbeiten“, `PageFormModal` + `AddLinkModal`, bestehendes `LinkEditModal` persistieren; `NodeDetailsPanel` **Bearbeiten** oeffnet Seiten-Formular — **ohne DELETE**.

**Architecture:** Ownership wie bei `categories`: Body enthaelt `project_id`; Express prueft `projects.user_id`. Slug-Eindeutigkeit per **SELECT** vor Schreibzugriff. **PostgreSQL Unique-Violation** (`code 23505`) bei `page_links` als **400** mit `{ error: string }` zurueckgeben (Spec: einheitlich 400 fuer Nutzerkonflikte). **Route-Reihenfolge:** **`POST /`** (Collection Create) **vor** `GET /:id` registrieren, damit `id` nie mit Reservewoertern kollidiert; `import-markdown` bleibt eigene Route vor `GET /:id`.

**Tech Stack:** Express 5, `pg`, React 18, TanStack Query, Tailwind, bestehende `apiClient`-Patterns

**Spec:** `docs/superpowers/specs/2026-04-29-sp23-manual-page-link-design.md`

---

## Datei-Uebersicht

| Aktion | Pfad |
|--------|------|
| Create | `src/components/link-graph/PageFormModal.tsx` |
| Create | `src/components/link-graph/AddLinkModal.tsx` |
| Modify | `server/routes/pages.ts` — `POST /`, `PUT /:id` (Reihenfolge!) |
| Modify | `server/routes/pageLinks.ts` — `POST /`, `PUT /:id` (Reihenfolge: `POST /` und ggf. Queries vor `GET /:id`, falls spaeter ergaenzt) |
| Modify | `src/lib/apiClient.ts` — `pages.create/update`, `pageLinks.create/update` |
| Modify | `src/components/link-graph/FilterSidebar.tsx` — Props + Block „Graph bearbeiten“ |
| Modify | `src/components/link-graph/LinkGraphView.tsx` — Modal-State, `invalidateQueries`, Kategorien-Hook |
| Modify | `src/components/link-graph/LinkEditModal.tsx` — Inputs aktiv, Speichern -> `PUT` |
| Modify | `src/components/link-graph/NodeDetailsPanel.tsx` — Bearbeiten-Button callback |
| Modify | `src/components/link-graph/EdgeDetailsPopup.tsx` — bei Bedarf `onLinkSaved`-Invalidate (meist durch Parent-Query-Schon) |
| Create | `server/tests/pages-mutations.test.ts` (oder bestehendes Testfile erweitern) |
| Modify | `docs/ROADMAP_LinkGraph.md` — SP23 Log |

**Hilfsfunktionen (optional eigene Datei):** `server/routes/pagesShared.ts` mit `ensureProjectOwnedByUser`, `slugTaken` — oder inline in Routen wenn < 40 Zeilen.

---

### Task 0: Routen-Reihenfolge (pages.ts)

Aktuelle Reihenfolge: `GET /by-project/...` → `POST /import-markdown/...` → `GET /:id`.

**Einfuegen** direkt **nach** `GET /by-project` Block, **vor** `import-markdown`:

- `router.post('/', ...)` — Create Page

**Einfuegen** **vor** `GET /:id` (aber nach import-markdown):

- `router.put('/:id', ...)`

Damit gilt: keine Kollision zwischen `POST /` und `GET /:id`.

---

### Task 1: Server — Projekt + Slug-Hilfen

**Files:**
- Modify: `server/routes/pages.ts`

- [ ] **Step 1:** Funktion **`async function projectOwnedByUsers(projectId: string, userId: string): Promise<boolean>`** — `SELECT 1 FROM projects WHERE id = $1 AND user_id = $2`.

- [ ] **Step 2:** **`async function slugTakenByOther(projectId: string, slug: string, excludeId: string | null)`** — `SELECT id FROM pages WHERE project_id = $1 AND trim(url_slug) <> '' AND lower(trim(url_slug)) = lower(trim($2))` und wenn Zeile exists und `(excludeId IS NULL OR id <> excludeId)` return true.

- [ ] **Step 3:** **`normalizeSlug(s: string): string`** — `trim`; wenn leer: werfen oder 400 durch Caller.

---

### Task 2: `POST /api/pages`

**Body (JSON):** `project_id` (Pflicht), `name`, `type` (`hub`|`spoke`|`blog`), `url_slug` (Pflicht), `status` (Pflicht), optional `category_id`.

- [ ] **Step 1:** 400 wenn `project_id`, `name`, `type`, `url_slug`, `status` fehlen oder Typ/Status nicht im CHECK der DB.

- [ ] **Step 2:** Wenn nicht `projectOwnedByUsers` → 403.

- [ ] **Step 3:** Wenn `category_id` gesetzt: `SELECT project_id FROM categories WHERE id = $1` — muss gleich Body-`project_id` sein, sonst 400.

- [ ] **Step 4:** `slugTakenByOther(projectId, normalizeSlug(...), null)` → 400 `"URL-Slug ist im Projekt bereits vergeben"`.

- [ ] **Step 5:**

```sql
INSERT INTO pages (project_id, category_id, name, type, status, url_slug, word_count)
VALUES ($1, $2, $3, $4, $5, $6, 0)
RETURNING *
```

---

### Task 3: `PUT /api/pages/:id`

**Body:** partiell erlaubt: `name`, `type`, `status`, `url_slug`, `category_id`.

- [ ] **Step 1:** `pageBelongsToUser(id, req.userId)` sonst 404.

- [ ] **Step 2:** Lade aktuelle Zeile fuer `project_id`.

- [ ] **Step 3:** Wenn `url_slug` geaendert: Slug-Konflikt-Check mit `excludeId = id`.

- [ ] **Step 4:** Wenn `category_id` gesetzt: gleiche Validierung wie POST.

- [ ] **Step 5:** **Ignoriere** `markdown_file_path` wenn Client `null`/leeren Clear sendet — **Spec:** keine Loesch-Logik in SP23 (ignorieren statt Feld setzen).

- [ ] **Step 6:** Dynamisches `UPDATE pages SET ...` nur fuer gesetzte Felder / `RETURNING *`.

---

### Task 4: `POST /api/page-links`

**Body:** `project_id`, `from_page_id`, `to_page_id`, optional `anchor_text`, `context_sentence`, `placement`, `line_number_start`, `line_number_end`.

- [ ] **Step 1:** 400 wenn Pflichtfelder fehlen; `from_page_id === to_page_id` → 400 `"Quelle und Ziel muessen verschiedene Seiten sein"`.

- [ ] **Step 2:** `projectOwnedByUsers(project_id, userId)` sonst 403.

- [ ] **Step 3:** Verifiziere zwei Queries:

```sql
SELECT project_id FROM pages WHERE id IN ($from, $to)
```

Beide Rows, beide gleich Body-`project_id`, sonst 400.

- [ ] **Step 4:** `INSERT INTO page_links (...) VALUES (...) RETURNING *` — try/catch: bei `23505`, Response **400** `{ error: 'Diese Link-Instanz existiert bereits (gleicher Anker/Zeilen).' }`.

---

### Task 5: `PUT /api/page-links/:id`

- [ ] **Step 1:** Join `page_links` mit `projects` auf Ownership (`p.user_id`).

- [ ] **Step 2:** Erlaube Update von `anchor_text`, `context_sentence`, `placement`, `line_number_start`, `line_number_end` ohne `from`/`to` zu aendern (**Spec SP23 minimal** — Keine Kanten-Umzuege ueber diese Route; wenn spaeter gewuenscht, eigenes Ticket).

- [ ] **Step 3:** try/catch 23505 → 400 wie POST.

---

### Task 6: `apiClient`

**Modify:** `src/lib/apiClient.ts`

```typescript
pages: {
  // ... bestehend
  create: (data: PageCreatePayload) =>
    request<PageRow>('POST', '/api/pages', data),
  update: (id: string, data: Partial<PageUpdatePayload>) =>
    request<PageRow>('PUT', `/api/pages/${id}`, data),
},
pageLinks: {
  getByProject: ...
  create: (data: PageLinkCreatePayload) =>
    request<PageLinkRow>('POST', '/api/page-links', data),
  update: (id: string, data: Partial<PageLinkUpdatePayload>) =>
    request<PageLinkRow>('PUT', `/api/page-links/${id}`, data),
},
```

Payload-Typen in `src/types/` oder direkt unter `database.types.ts` ergaenzen (minimal).

---

### Task 7: `PageFormModal`

**Create:** `src/components/link-graph/PageFormModal.tsx`

- Props: `open`, `onClose`, `projectId`, `mode: 'create'|'edit'`, `initialPage?: PageRow`, `onSuccess?: () => void`

- Hook: `useAllCategories(projectId)` fuer `<select>` Kategorie.

- Submit: `create` → `apiClient.pages.create`, `edit` → `apiClient.pages.update`.

- Vor Submit: Frontend-Validierung Slug nonempty.

- Nach Erfolg: `queryClient.invalidateQueries` — **Rueckgabe** `onSuccess` oder Parent ruft Invalidate (eine Stelle konsistent halten).

---

### Task 8: `AddLinkModal`

**Create:** `src/components/link-graph/AddLinkModal.tsx`

- Props: `open`, `onClose`, `projectId`, `pages: PageRow[]`.

- Zwei `<select>` oder searchable — **MVP:** `<select>` mit allen `pages` sortiert nach `name`; filter `from !== to` nach Auswahl dynamisch grey-out.

- Submit: `apiClient.pageLinks.create`.

---

### Task 9: `FilterSidebar`

**Modify:** `FilterSidebar.tsx`

Neue Props z. B.:

```typescript
graphEditActions?: {
  onAddPage: () => void
  onAddLink: () => void
}
```

Neuer Abschnitt **nach** Phase-Block **oder** vor Analyse-Bereich — **Spec:** eigener Bereich unter den Filtern/nahe unteren Sidebar:

```tsx
{graphEditActions && (
  <div className="p-4 border-b border-slate-100">
    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Graph bearbeiten</p>
    <div className="flex flex-col gap-2">
      <button type="button" ... onClick={graphEditActions.onAddPage}>Seite anlegen</button>
      <button ... onClick={graphEditActions.onAddLink}>Link anlegen</button>
    </div>
  </div>
)}
```

---

### Task 10: `LinkGraphView`

- State: `pageModalOpen`, `pageModalMode`, `linkModalOpen`, `editPageInitial: PageRow | null`.

- `FilterSidebar` mit Callbacks verdrahten; `pages` aus Query an `AddLinkModal` geben.

- Nach erfolgreichen Modals: `invalidateQueries`.

---

### Task 11: `LinkEditModal`

- Alle Inputs **aktiv** (kein `disabled` ausser waehrend `isPending`).

- `useMutation`: `PUT /api/page-links/:link.id`.

- Entfernen des gelben Hinweis-Kastens oder Text „Gespeichert“ Kurztoast optional minimal.

- Optional Prop `onSaved?: () => void` → Parent invalidated.

---

### Task 12: `NodeDetailsPanel`

- Neue Props: `onEdit?: () => void`.

- Button **Bearbeiten:** `disabled={!onEdit}` → false wenn Handler gesetzt.

- **`LinkGraphView`** setzt `onEdit={() => { setEditInitial(page); setPageModal('edit')}}`.

---

### Task 13: Tests (Server)

**File:** z. B. `server/tests/pages-mutations.test.ts` (Nutze bestehendes auth-Setup wenn moeglich, sonst kleine Supertest-Zeilen mit Login-Cookie wie `auth.test.ts`).

**Mindestens:**

- Zweimal POST gleicher Slug im gleichen Projekt → zweiter **400**.
- PUT Slug ohne Konflikt mit eigener ID → **200**.
- POST Selbst-Link → **400**.

---

### Task 14: Verifikation und Roadmap

- [ ] **`npm run build`** und **`npm run test:run:server`** gruen.

- [ ] **`docs/ROADMAP_LinkGraph.md`:** SP23 auf `[x]`, Log ergaenzen, Deliverables angepasst (ohne DELETE).

---

## Manuelle Verifikation

1. Einloggen, Projekt mit Kategorien oeffnen, Link Graph.
2. **Seite anlegen** mit neuem Slug → Knoten sichtbar (ggf. Filter pruefen).
3. Zweite Seite mit **gleichem Slug** → Fehlermeldung.
4. **Link anlegen** zwischen zwei Seiten → Kante im Graph.
5. **Edge** klicken, **Bearbeiten** auf Instanz → speichern, Daten neu laden.
6. **Node** → Bearbeiten → Slug/Status aendern → Graph aktualisiert.

---

## Spec-Coverage (Self-Review)

| Spec-Anforderung | Task |
|------------------|------|
| POST pages + Ownership | Task 2 |
| PUT pages ohne markdown clear | Task 3 |
| Slug eindeutig | Task 1–3 |
| POST/PUT page-links | Task 4–5 |
| Sidebar UI | Task 9–10 |
| Modals | Task 7–8 |
| LinkEditModal Persistenz | Task 11 |
| NodeDetails Bearbeiten | Task 12 |
| Kein DELETE | nicht implementieren |

---

**Plan gespeichert unter:** `docs/superpowers/plans/2026-04-29-sp23-manual-page-link.md`

**Ausfuehrung:** Subagent-driven (Task fuer Task mit Review) oder Inline-Session mit Checkpoints zwischen Task-Gruppen (Backend → Client → Panel).
