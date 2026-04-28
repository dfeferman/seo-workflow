# SP22 — Markdown-Upload und Parsing

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drag-&-Drop von `.md`-Dateien im Link Graph, Upload per Express nach `UPLOAD_ROOT`, Parsing mit remark, Upsert der Quell-`page`, Ersetzen der ausgehenden `page_links`, Legen geplanter Ziel-`pages` bei fehlendem Slug-Match, anschließend Invalidierung von TanStack Query.

**Architecture:** Reine Parse- und Normalisierungslogik in **losen Modulen** unter `server/` (testbar ohne HTTP). **Ein** Transaktions-Handler nutzt `pg` `Client` mit `BEGIN`/`COMMIT`/`ROLLBACK`. **HTTP:** `POST` mit `multipart/form-data` (multer `diskStorage` nach `UPLOAD_ROOT/<projectId>/`), **vor** generischen `GET /api/pages/:id` registrieren. **Frontend:** `FormData` + neuer `fetch`-Pfad in `apiClient` (ohne `Content-Type` Header), `useMutation` + `queryClient.invalidateQueries` für `['pages', projectId]` und `['page-links', projectId]`.

**Tech Stack:** Express 5, `pg`, `multer`, `remark`, `remark-parse`, `unist-util-visit`, `mdast` (über remark), React 18, TanStack Query, Tailwind, Vitest (Server-Config)

**Spec:** `docs/superpowers/specs/2026-04-28-sp22-markdown-upload-design.md`

---

## Datei-Übersicht

| Aktion | Pfad | Zweck |
|--------|------|-------|
| Create | `server/lib/sanitizeUploadFilename.ts` | Nur Basename, kein `..`, erlaubte Zeichen, `.md` |
| Create | `server/lib/normalizeLinkTarget.ts` | URL → Kanonischer Slug/Pfad zum Abgleich mit `url_slug` |
| Create | `server/lib/extractMarkdownMetadata.ts` | remark: erstes `#`-Heading, Wortzahl, Liste `(url, anchor, zeile)` |
| Create | `server/lib/dedupeLinkInstances.ts` | Sicherstellung eindeutiger `(from,to,anchor,line_start,line_end)` pro Batch |
| Create | `server/services/markdownProjectImport.ts` | Transaktion: Datei schreiben (vorher oder in TX — siehe Task 4), DELETE links, UPSERT Quellpage, INSERT Zielpages + links |
| Modify | `server/routes/pages.ts` | `POST /import-markdown/:projectId` vor `GET /:id`, multer-Middleware |
| Modify | `server/index.ts` | Kein globales `express.json` auf Upload-Route — multer nur auf dieser Route |
| Modify | `src/lib/apiClient.ts` | `requestFormData`, `pages.importMarkdown` |
| Modify | `src/components/link-graph/LinkGraphView.tsx` | DnD-Overlay, `useMutation`, Fehler-State |
| Create | `server/tests/normalizeLinkTarget.test.ts` | Unit-Tests Normalisierung |
| Create | `server/tests/extractMarkdownMetadata.test.ts` | Parser-Fixtures |
| Modify | `vitest.server.config.ts` | `include` um `server/lib/**/*.test.ts` erweitern (falls nur `server/tests` erfasst) |
| Modify | `.env.example` | `UPLOAD_ROOT=./uploads` |
| Modify | `docs/RUNBOOK.md` | `UPLOAD_ROOT` erklären |
| Modify | `docs/ROADMAP_LinkGraph.md` | SP22 Log + Status |

**Neue npm-Abhängigkeiten:**

```bash
npm install remark remark-parse unist-util-visit multer
npm install -D @types/multer
```

---

## Task 1: Abhängigkeiten und Umgebung

- [ ] **Step 1:** Befehl ausführen (siehe oben).

- [ ] **Step 2:** `.env.example` um folgende Zeile ergänzen (Pfad relativ zum Server-CWD oder absolut):

```
# Markdown-Uploads (SP22): absolut oder relativ zum Prozess-Start
UPLOAD_ROOT=./uploads
```

- [ ] **Step 3:** `docs/RUNBOOK.md` — Abschnitt „Link Graph Upload“: Produktion muss `UPLOAD_ROOT` setzen und Verzeichnis beschreibbar machen; Backups falls auf NAS gemountet.

- [ ] **Step 4:** Commit

```bash
git add package.json package-lock.json .env.example docs/RUNBOOK.md
git commit -m "chore(sp22): remark, multer, UPLOAD_ROOT Hinweis"
```

---

## Task 2: `sanitizeUploadFilename`

**Files:**
- Create: `server/lib/sanitizeUploadFilename.ts`
- Create: `server/tests/sanitizeUploadFilename.test.ts`

- [ ] **Step 1:** Implementierung — Eingabe `name: string`, Rückgabe `{ ok: true, name: string } | { ok: false, error: string }`:

  - `path` importieren von `node:path`, `path.basename(name)` verwenden (verhindert `a/../../b`).
  - Wenn Basisname leer oder nicht auf `.md` endet (case-insensitive): `ok: false`.
  - Nur Zeichen `[a-zA-Z0-9._-]` erlauben; alle anderen durch `_` ersetzen oder ablehnen — **fest:** nicht-alphanumerische Zeichen durch `_` ersetzen, Länge max. 200 Zeichen vor `.md`.
  - Mindestens ein Zeichen vor `.md`.

```typescript
// server/lib/sanitizeUploadFilename.ts
import path from 'node:path'

const MAX_BASE = 200

export function sanitizeUploadFilename(original: string):
  | { ok: true; filename: string }
  | { ok: false; error: string } {
  const base = path.basename(original).replace(/\\/g, '/')
  if (!base.toLowerCase().endsWith('.md')) {
    return { ok: false, error: 'Nur .md-Dateien erlaubt' }
  }
  const stem = base.slice(0, -3)
  const safe = stem.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, MAX_BASE)
  if (!safe.length) {
    return { ok: false, error: 'Ungültiger Dateiname' }
  }
  return { ok: true, filename: `${safe}.md` }
}
```

- [ ] **Step 2:** Tests — gültiger Name, Pfad mit `..`, keine `.md`, Sonderzeichen → `_`.

- [ ] **Step 3:** `npm run test:run:server -- server/tests/sanitizeUploadFilename.test.ts`

- [ ] **Step 4:** Commit `test(sp22): sanitize upload filename`

---

## Task 3: `normalizeLinkTarget`

**Files:**
- Create: `server/lib/normalizeLinkTarget.ts`
- Create: `server/tests/normalizeLinkTarget.test.ts`

**Spec-Zulassung:** `mailto:` und reine `#fragment` → `null` (skip). Leer nach Normalisierung → `null`.

- [ ] **Step 1:** Funktion `normalizeLinkTarget(raw: string): string | null`:

  - Trim.
  - `mailto:` oder `tel:` → `null`.
  - Nur `#...` ohne Pfad → `null`.
  - `http://` / `https://`: `new URL(raw)` — bei `pathname` leer oder nur `/` ohne weiteren Kontext → `null` (**Spec:** kein Pfadsegment). Sonst `pathname` nehmen (Node liefert mit führendem `/`), mit `normalizeUrlSlug` vereinheitlichen.
  - Relative Pfade `./a`, `../b`, `/c`: führende `./` streichen; kein vollständiger URL-Resolver nötig für MVP — **Pfad kanonisch:** Slashes normalisieren, doppelte entfernen, kein `..` auflösen gegen echte FS — **vereinfacht:** `raw` wenn mit `/` beginnt: Pfadteil; sonst Segmente splitten und `..`/`.` reduzieren wie Posix (nutze `path.posix.normalize` auf einem mit `/` prefixten String). Ergebnis ohne führenden Slash in DB speichern **oder** mit führendem Slash — **fest:** in `url_slug` **ohne** führenden Slash, Kleinbuchstaben für Vergleich optional — **fest:** keine erzwungene Lowercase-Casing (DB case-sensitive); nur Slash-Normalisierung und Trim.
  - Rückgabe `string` als kanonischer Slug.

```typescript
// server/lib/normalizeLinkTarget.ts — vollständig (relative + absolute URLs)
import path from 'node:path'

/** null = kein page_link (mailto, #only, leer, nur Domain ohne Pfad) */
export function normalizeLinkTarget(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const lower = t.toLowerCase()
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return null
  if (t.startsWith('#')) return null

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const u = new URL(t)
      const p = u.pathname
      if (!p || p === '/') return null
      return stripLeadingSlash(path.posix.normalize(p))
    } catch {
      return null
    }
  }

  // Relativ oder root-relativ: /a/b, ./x, ../y
  const asPath = t.startsWith('/') ? t : `/${t.replace(/^\.\//, '')}`
  const n = path.posix.normalize(asPath)
  if (n === '/' || n === '.') return null
  return stripLeadingSlash(n)
}

function stripLeadingSlash(s: string): string {
  return s.replace(/^\/+/, '')
}
```

- [ ] **Step 2:** Tests: `https://x.de/a/b` → `a/b`; `/a//b` → `a/b`; `mailto:x` → `null`; `#x` → `null`; leer → `null`.

- [ ] **Step 3:** `npm run test:run:server -- server/tests/normalizeLinkTarget.test.ts`

- [ ] **Step 4:** Commit

---

## Task 4: `extractMarkdownMetadata`

**Files:**
- Create: `server/lib/extractMarkdownMetadata.ts`
- Create: `server/tests/extractMarkdownMetadata.test.ts`

- [ ] **Step 1:** Export `ExtractedLink { url: string; anchor: string; line: number }` und `extractMarkdownMetadata(markdown: string): { title: string | null; wordCount: number; links: ExtractedLink[] }`:

  - `remark().use(remarkParse).parse(markdown)` → AST.
  - `unist-util-visit`: erste `heading` mit `depth === 1` → Titeltext aus Kindern (`node.children` zu Plaintext reduzieren — kleine Hilfsfunktion `textContent`).
  - `wordCount`: `markdown.trim().split(/\s+/).filter(Boolean).length` bei nicht-leerem trim, sonst `0`.
  - `visit` für `link`: `node.url`, Link-Text aus Kindern; Zeile: `node.position?.start.line` (1-basiert). Wenn keine Position: Zeile `1` als Fallback (und in Tests vermeiden).

- [ ] **Step 2:** Fixture-String in Testdatei:

```markdown
# Mein Titel

Hallo [a](https://example.com/pfad) und [b](/other).
```

  Erwartung: `title === 'Mein Titel'`, zwei Links, `normalize` separat testen.

- [ ] **Step 3:** `npm run test:run:server -- server/tests/extractMarkdownMetadata.test.ts`

---

## Task 5: `dedupeLinkInstances`

**Files:**
- Create: `server/lib/dedupeLinkInstances.ts`

- [ ] **Step 1:** Eingabe: Array von `{ anchor, lineStart, lineEnd }` (Zeilen aus Parser, zunächst `lineEnd === lineStart`). Ausgabe: gleiche Länge, aber bei Duplikat gleichen `(anchor, lineStart)` nacheinander: `lineEnd = lineStart + k` für k-te Kopie (**Minimalvariante Unique-Constraint**), damit `(from,to,anchor,line_start,line_end)` eindeutig.

```typescript
export type LinkLine = { anchorText: string; lineStart: number; lineEnd: number }

export function dedupeLinkInstances(rows: Omit<LinkLine, 'lineEnd'>[]): LinkLine[] {
  const seen = new Map<string, number>()
  return rows.map((r) => {
    const key = `${r.anchorText}\0${r.lineStart}`
    const n = (seen.get(key) ?? 0) + 1
    seen.set(key, n)
    const lineEnd = n === 1 ? r.lineStart : r.lineStart + (n - 1)
    return { anchorText: r.anchorText, lineStart: r.lineStart, lineEnd }
  })
}
```

  **Hinweis:** Wenn Parser zwei verschiedene URLs auf derselben Zeile liefert, unterscheiden sich `to_page_id` — kein Konflikt. Konflikt nur bei gleicher Zielseite + gleichem Anchor + gleicher Zeile — dann `lineEnd` increment.

- [ ] **Step 2:** Kleiner Test in `dedupeLinkInstances.test.ts` oder inline in extract-Tests.

---

## Task 6: Service `runMarkdownProjectImport`

**Files:**
- Create: `server/services/markdownProjectImport.ts`

**Signatur:**

```typescript
export type ImportResult = {
  sourcePageId: string
  markdownPathRelative: string
  targetsCreated: number
  linksInserted: number
}

export async function runMarkdownProjectImport(options: {
  pool: import('pg').Pool
  userId: string
  projectId: string
  markdownBody: string
  sanitizedFilename: string
  uploadRoot: string
}): Promise<ImportResult>
```

- [ ] **Step 1:** `markdownPathRelative = `${projectId}/${sanitizedFilename}`` (exakter DB-Wert für `markdown_file_path`).

- [ ] **Step 2:** Dateisystem: `fs.mkdir` recursive, `writeFile` vollständiger Pfad `path.join(uploadRoot, projectId, sanitizedFilename)`. **Reihenfolge:** Datei schreiben, dann `BEGIN`; bei `ROLLBACK` im `catch` die geschriebene Datei `unlink` (oder ganzen Pfad löschen). So liegt nie eine DB ohne Datei vor; kurzes FS-Zombie-File bei Crash akzeptiert (RUNBOOK).

- [ ] **Step 3:** `extractMarkdownMetadata`, `normalizeLinkTarget` pro Link, `dedupeLinkInstances` nach Auflösung `to_page_id`.

- [ ] **Step 4:** `client = await pool.connect()`; `BEGIN`:

  1. `SELECT id FROM projects WHERE id = $1 AND user_id = $2` — sonst `ROLLBACK` + 404-Fehler.
  2. `SELECT id, ... FROM pages WHERE project_id = $1 AND markdown_file_path = $2` für Upsert Quellseite.
  3. Wenn Zeile existiert: `UPDATE pages SET name=..., word_count=..., updated_at=NOW()` wo `id=...`.
  4. Sonst: `INSERT INTO pages (project_id, name, type, status, markdown_file_path, word_count, ...) VALUES (..., 'spoke', 'draft', path, wc)` — `RETURNING id`.
  5. `DELETE FROM page_links WHERE from_page_id = $sourceId`.
  6. Für jeden Link: `normalizedSlug = normalizeLinkTarget(url)` — wenn `null`, continue.
  7. `SELECT id FROM pages WHERE project_id = $1 AND url_slug = $2` (ggf. zusätzlicher Vergleich normalisierter Slug wenn DB gemischte Formate hat — beim ersten Insert konsistent schreiben).
  8. Wenn keine Zeile: `INSERT pages (..., status 'planned', type 'spoke', name aus letztem Segment, url_slug = normalizedSlug) RETURNING id`.
  9. `INSERT INTO page_links (project_id, from_page_id, to_page_id, anchor_text, line_number_start, line_number_end, placement, context_sentence) VALUES (...)` mit `placement`/`context_sentence` **`NULL`**.
  10. `COMMIT`.

- [ ] **Step 5:** `word_count` und `name` aus Metadata; `name` Fallback: stem von `sanitizedFilename` ohne `.md`.

- [ ] **Step 6:** Export für Route nutzbar; Fehler mit `throw` und englische oder deutsche `Error` message für API.

---

## Task 7: HTTP-Route und Multer

**Files:**
- Modify: `server/routes/pages.ts`

- [ ] **Step 1:** Konstante `MAX_UPLOAD_BYTES = 5 * 1024 * 1024` (5 MB).

- [ ] **Step 2:** Multer `diskStorage` — `destination` `(req, file, cb) => { ... }` — Ziel nur nach `sanitize` + `projectId` validiert in Route-Handler — **Reihenfolge:** Multer nach `projectId`-Check schwer; **Alternative:** `multer.memoryStorage()`, in Handler nach Sanitize Buffer mit `fs.writeFile` schreiben — **einfacher für Validierung:** **memoryStorage**, Größenlimit `limits: { fileSize: MAX_UPLOAD_BYTES }`, ein Feld `file`.

- [ ] **Step 3:** Route **vor** `router.get('/:id')` registrieren:

```typescript
// POST /api/pages/import-markdown/:projectId
router.post(
  '/import-markdown/:projectId',
  (req: AuthRequest, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message })
        return
      }
      next()
    })
  },
  async (req: AuthRequest, res: Response) => {
    const projectId = routeParamOne(req.params.projectId)
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file?.buffer) {
      res.status(400).json({ error: 'Datei fehlt' })
      return
    }
    const s = sanitizeUploadFilename(file.originalname)
    if (!s.ok) {
      res.status(400).json({ error: s.error })
      return
    }
    const uploadRoot = process.env.UPLOAD_ROOT?.trim()
    if (!uploadRoot) {
      res.status(500).json({ error: 'UPLOAD_ROOT nicht konfiguriert' })
      return
    }
    const body = file.buffer.toString('utf8')
    try {
      const result = await runMarkdownProjectImport({
        pool,
        userId: req.userId!,
        projectId,
        markdownBody: body,
        sanitizedFilename: s.filename,
        uploadRoot,
      })
      res.status(200).json(result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import fehlgeschlagen'
      if (msg.includes('nicht gefunden') || msg.includes('Not found')) {
        res.status(404).json({ error: msg })
        return
      }
      console.error(e)
      res.status(500).json({ error: msg })
    }
  }
)
```

  `runMarkdownProjectImport` muss „Projekt nicht gefunden“ als kontrollierten Fehler werfen, wenn User nicht owner.

- [ ] **Step 4:** `npm run server:build` — muss ohne Fehler durchlaufen.

- [ ] **Step 5:** Commit `feat(sp22): import-markdown API`

---

## Task 8: `apiClient` und FormData

**Files:**
- Modify: `src/lib/apiClient.ts`

- [ ] **Step 1:** Hilfsfunktion `requestFormData<T>(method, path, formData: FormData): Promise<T>` — **kein** `Content-Type` setzen; gleiche 401-Refresh-Logik wie `request` (Token im Header).

- [ ] **Step 2:** `pages: { ..., importMarkdown: (projectId: string, file: File) => requestFormData<ImportMarkdownResponse>('POST', `/api/pages/import-markdown/${projectId}`, (() => { const fd = new FormData(); fd.append('file', file); return fd })()) }`

- [ ] **Step 3:** Type `ImportMarkdownResponse` in `src/types/` oder inline am apiClient mit Feldern wie Service-`ImportResult`.

- [ ] **Step 4:** `npm run build` (Frontend)

---

## Task 9: `LinkGraphView` Drag & Drop

**Files:**
- Modify: `src/components/link-graph/LinkGraphView.tsx`

- [ ] **Step 1:** `useQueryClient` von `@tanstack/react-query`, `useMutation`.

- [ ] **Step 2:** State `dragActive: boolean`, `uploadError: string | null`, `uploading: boolean`.

- [ ] **Step 3:** Wrapper um den ReactFlow-Bereich: `onDragEnter`/`onDragOver` (preventDefault, `dropEffect='copy'`), `onDragLeave`, `onDrop` — nur erste `.md` Datei aus `dataTransfer.files`.

- [ ] **Step 4:** `mutation.mutate(file)` ruft `apiClient.pages.importMarkdown(projectId, file)`, `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['pages', projectId] })`, `queryClient.invalidateQueries({ queryKey: ['page-links', projectId] })` — **exakte Keys wie usePages/usePageLinks**.

- [ ] **Step 5:** Visuelles Overlay (halbtransparente Fläche, Text „Markdown hier ablegen“) wenn `dragActive`.

- [ ] **Step 6:** Fehler unterhalb Topbar oder als Toast — minimal: roter Text mit `uploadError`.

---

## Task 10: Dokumentation und Roadmap

- [ ] **Step 1:** `docs/ROADMAP_LinkGraph.md` — SP22 Status `[x]`, Log mit Datum, Deliverables abhaken wo erfüllt.

- [ ] **Step 2:** Diese Plan-Datei am Ende „Status: umgesetzt“ setzen wenn fertig.

---

## Manuelle Verifikation

1. `.env`: `UPLOAD_ROOT` auf beschreibbares Verzeichnis setzen.
2. Dev: API `server:dev`, Frontend `npm run dev`, Login.
3. Link Graph öffnen, `.md` mit `# Titel` und `[x](/ziel)` per Drag auf Graph — Erfolg, neue/aktualisierte Knoten sichtbar.
4. Gleiche Datei erneut hochladen — eine Quell-Seite, Links ersetzt.
5. Ungültige Datei (`.txt` umbenannt) — klare Fehlermeldung.

---

## Gesamt-Commit (Beispiel)

```bash
git add server/ src/lib/apiClient.ts src/components/link-graph/LinkGraphView.tsx \
  docs/ROADMAP_LinkGraph.md docs/superpowers/plans/2026-04-28-sp22-markdown-upload.md
git commit -m "feat(sp22): Markdown-Upload Link Graph mit remark und UPLOAD_ROOT"
```

---

## Spec-Coverage (Self-Review)

| Spec-Anforderung | Task |
|------------------|------|
| DnD über Canvas | Task 9 |
| UPLOAD_ROOT + relativer Pfad | Task 1, 6, 7 |
| remark Title + Links + Zeilen | Task 4 |
| mailto/# skip | Task 3 `null` |
| URL → Slug-Match / planned-Ziel | Task 3, 6 |
| DELETE + INSERT Links in TX | Task 6 |
| Quell-Upsert per `markdown_file_path` | Task 6 |
| spoke/draft neue Quelle | Task 6 INSERT |
| multipart Express | Task 7 |
| Query-Invalidierung | Task 9 |
| Kein Supabase | implizit überall |

## Placeholder-Scan

Keine „TBD“-Schritte; offene Punkte bewusst **festgelegt** (memory-multer, Datei vor/nach TX mit catch-unlink).

## Typ-Konsistenz

`ImportResult`/`ImportMarkdownResponse` — einmal in `server/services`, einmal als Frontend-Type exportiert oder duplicate interface gleiche Feldnamen.

---

**Plan gespeichert unter:** `docs/superpowers/plans/2026-04-28-sp22-markdown-upload.md`

**Status:** Umgesetzt 2026-04-28 (subagent-gestützt / Hauptsession).

---

**Ausführung wählen (historisch):**

1. **Subagent-Driven (empfohlen)** — ein Subagent pro Task, Review zwischen Tasks, schnelle Iteration (`superpowers:subagent-driven-development`).

2. **Inline** — Tasks in dieser Session nacheinander mit Checkpoints (`superpowers:executing-plans`).

Welche Variante möchtest du?
