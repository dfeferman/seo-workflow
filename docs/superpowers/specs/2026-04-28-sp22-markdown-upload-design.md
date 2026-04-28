# Design Spec: SP22 – Markdown-Upload und Parsing

**Projekt:** SEO Workflow Platform  
**Erstellt:** 2026-04-28  
**Basis:** Brainstorming-Session (Option A Quellseite, Storage-Pfad-Upsert, Pfad-/Slug-Matching, Upload via Express, Dateispeicher `UPLOAD_ROOT`, Link-Ersetzung in einer Transaktion)  
**Uebergeordnet:** `docs/superpowers/specs/2026-04-23-link-graph-design.md` (dort veraltet: Supabase Storage; siehe Abschnitt „Laufzeit-Umgebung“ unten)

---

## Ziel

Im Link Graph (`/projects/$projectId/link-graph`) koennen Nutzer Markdown-Dateien per **Drag & Drop** ueber dem Graph-Canvas hochladen. Der Server speichert die Datei, parst sie, aktualisiert die **Quell-Seite**, legt bei Bedarf **Ziel-Seiten** (planned) an und schreibt **`page_links`**. Anschliessend soll der Graph per TanStack Query neu geladen werden und die Visualisierung aktualisieren.

---

## Laufzeit-Umgebung (Abweichung von aelterer Gesamt-Spec)

- **Datenbank:** PostgreSQL (Betrieb z. B. auf NAS), **kein** Supabase-Produkt fuer Runtime.
- **Markdown-Dateien:** Lokales Dateisystem auf dem API-Host; Wurzel ueber Umgebungsvariable **`UPLOAD_ROOT`**. Optional kann dieselbe Pfadlogik per Mount auf ein NAS-Verzeichnis zeigen; das ist Betriebssache.
- Die historische Formulierung „`markdown_file_path` auf Supabase Storage“ in der Gesamt-Spec gilt fuer diese Installation **nicht**. Stattdessen: **relativer Pfad unter `UPLOAD_ROOT`** oder ein einheitlicher, dokumentierter Speicherstring, der die Datei eindeutig wiederauffindbar macht (siehe Identitaet Quell-Seite).

---

## UX

- **Drag & Drop-Zone** liegt **ueber** oder **im** Graph-Canvas-Bereich (implementierungskonkret: Overlay bei `dragenter`/`dragleave`, klar sichtbar wenn aktiv).
- Unterstuetzte Dateien: **`.md`** (MIME optional zusaetzlich pruefen; `.markdown` optional erlauben oder ablehnen – **Empfehlung:** nur `.md` im MVP).
- Nach erfolgreichem Import: **`usePages`** und **`usePageLinks`** fuer das Projekt invalidieren bzw. refetchen, sodass der Graph ohne manuellen Reload konsistent ist.
- Fehler (Validierung, Parsing, IO, DB): **klare Fehlermeldung** in der UI; kein persistierter Teilerfolg bei fehlgeschlagener Transaktion.

---

## Identitaet Quell-Seite und Upsert

- Logischer Speicherpfad fuer die Datei (relativ zu `UPLOAD_ROOT`):  
  `{projectId}/{originalFilename}`  
  wobei `originalFilename` der vom Client gelieferte Dateiname ist (sanitized: keine Path-Traversal-Segmente `..`, keine absoluten Pfade, konsistente Normalisierung fuer wiederholte Uploads).
- Existiert bereits eine **`pages`**, deren `markdown_file_path` diesem logischen Pfad entspricht (**Empfehlung:** exakter String-Vergleich nach derselben Normalisierung wie beim Schreiben), wird diese Zeile **aktualisiert**.
- Andernfalls wird eine **neue** `pages`-Zeile angelegt (**Option A** aus Brainstorming): keine Pflicht, vorher einen Knoten auszuwaehlen.
- **`name`:** aus dem ersten `#`-Heading im Dokument; fallback z. B. Dateiname ohne Erweiterung wenn kein Heading.
- **`word_count`:** aus dem Dokumentinhalt berechnet (Definition konsistent mit bestehendem Code, falls vorhanden).
- **`type` / `status`:** fuer neu angelegte Quell-Seiten fest **`type = 'spoke'`**, **`status = 'draft'`** (Kategorie `NULL`, bis SP23/UI das setzt).

---

## Parsing

- **Libraries:** `remark`, `remark-parse`, `unist-util-visit` (bereits in Gesamt-Spec fuer Link Graph genannt).
- **Extraktion:**
  - Erstes `#`-Heading als Titel (falls mehrere Ebenen: nur oberstes `#` als „Haupttitel“).
  - Alle Links in der Form `[anchor](url)` mit **Zeilennummer** im Quelltext (`line_number_start` / `line_number_end` je nach AST/Position – mindestens Startzeile; bei Bedarf Start=Ende fuer MVP).
- **Ignorieren / keine `page_links`:**
  - `mailto:...`
  - Reine Fragment-Links (`#abschnitt`) ohne Pfad
  - Leere oder ungueltige URLs nach Normalisierung (siehe unten)

---

## URL-Normalisierung und Ziel-Matching (Option A)

- Ziel: Abgleich mit bestehenden **`pages`** **innerhalb desselben `project_id`** ueber **Pfad/Slug**, nicht ueber beliebige externe Domains.
- **Normalisierung (MVP, explizit):**
  - Relative Pfade (`/kategorie/x`, `./y`, `../z`) auf einen **kanonischen Pfadstring** bringen (ohne doppelte Slashes; trailing slash optional vereinheitlichen).
  - `https://` / `http://`: Host und Query entfernen; es bleibt der **Pfadname** (ohne fuehrenden Slash oder mit – gleiche Normalisierung wie bei `url_slug`). Kein projektweites „Base-URL“-Feld noetig fuer MVP: Abgleich erfolgt **nur** gegen in der DB gespeicherte Slug-/Pfadwerte derselben Normalisierung.
  - Wenn nach Normalisierung **kein Pfadsegment** uebrig bleibt (nur `https://domain` oder leer), Link **ueberspringen** (kein Knoten, kein `page_link`).
  - **Treffer:** existierende `pages` im Projekt mit gleichem normalisierten `url_slug` → diese als Ziel (`to_page_id`).
  - **Kein Treffer:** neue **planned**-Seite; Name und `url_slug` aus dem letzten sinnvollen Pfadsegment ableiten.

---

## Link-Synchronisation bei erneutem Upload

- **Strategie 1 (vereinbart):** Alle `page_links` mit `from_page_id` = **dieser Quell-Seite** in **einer Datenbank-Transaktion** **loeschen**, danach die aus dem aktuellen Parsing neu **einfuegen**.
- Begruendung: Die Markdown-Datei ist **Quelle der Wahrheit** fuer ausgehende Links; kein diff-Pflichtaufwand im MVP.
- Unique-Constraint auf `page_links` bleibt erhalten; identische Instanzen aus einer Datei duerfen nicht gegen den Constraint verstossen.

---

## API

- **Transport:** `multipart/form-data` an **Express** (kein direkter Browser-Upload zu Objektstorage).
- **Endpoint (Skizze):** z. B. `POST /api/projects/:projectId/link-graph/import-markdown` oder `POST /api/pages/from-markdown-upload` mit `project_id` aus Route/Body konsistent zur bestehenden API-Struktur – **festzulegen** beim Umsetzen anhand vorhandener Routen-Konventionen.
- Request: Feld **`file`** (eine `.md`-Datei).
- Server:
  1. Auth/Ownership fuer `projectId` pruefen.
  2. Groessenlimit enforced (Konfigurationskonstante, z. B. wenige MB).
  3. Datei nach `UPLOAD_ROOT/{projectId}/{sanitizedFilename}` schreiben.
  4. Parsing + DB-Arbeit in **einer Transaktion** (mind.: Loeschen alter Links dieser Quelle, Upsert Page, Insert Links, neue Ziel-Pages fuer fehlende Slugs innerhalb der Transaktion).
  5. Response: Aktualisierte IDs / Kurzbestaetigung; Frontend invalidiert Queries.

---

## Innerer Editor („Im Editor oeffnen“)

- Basis bleibt `markdown_file_path` + optional Zeilenangabe aus bestehender UI-Spec.
- **SP22** liefert den **gespeicherten Inhalt** und Pfad; eine vollstaendige read-only Vorschau oder Bearbeitung kann minimal sein, solass der Button von Placeholder auf **funktionsfaehig** (z. B. Modal mit Markdown-Text) umgestellt werden kann. **Tiefe Editor-Features** sind nicht Ziel von SP22.

---

## Fehlerbehandlung und Spaeteres (SP25)

- **SP22:** Transaktion bei Fehler **rollt zurueck**; Nutzer sieht verstaendliche Meldung.
- **SP25 (Polish):** verfeinerte Meldungen bei „unbekannten URLs“, Tooltips, etc. (Referenz `docs/ROADMAP_LinkGraph.md`).

---

## Tests (Mindestempfehlung)

- **Unit:** URL-Normalisierung (relative, absolute gleicher Host-Pfad, Fragment-only, mailto).
- **Unit / Integration:** Parser extrahiert erwartete Anzahl Links und Zeilen aus Fixture-`.md`.
- **Integration (optional):** Mock-Filesystem oder tempdir + Transaktion: erneuter Upload ersetzt Links, keine Duplikate der Quell-Seite bei gleichem Pfad.

---

## Abgrenzung

- **SP23:** manuelles Anlegen von Seiten/Links ohne Upload.
- **SP24:** Exporte.
- **SP25:** UX-Polish inkl. erweitertem Fehlerhandling fuer Randfaelle.

---

## Checkliste Self-Review

- [x] Keine TBD-Platzhalter ohne Entscheidung; offene „empfohlene“ Defaults sind markiert (`spoke`+`draft`, Route-Name an Konvention).
- [x] Konsistent mit Transaktions- und Upsert-Logik.
- [x] Scope: ein SP, klar von SP23–SP25 getrennt.
- [x] Laufzeit (Postgres + `UPLOAD_ROOT`) explizit von alter Supabase-Formulierung abgegrenzt.
