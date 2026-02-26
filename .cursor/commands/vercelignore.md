# .vercelignore anlegen oder aktualisieren

Erstellt oder aktualisiert eine **.vercelignore** im Projektroot, sodass für das Vercel-Deploy nur benötigte Dateien hochgeladen werden. Beim Update werden nur **neue** Einträge ergänzt; bestehende bleiben erhalten.

---

## Ablauf

### 1. Projekt prüfen

- **Projektroot** ermitteln (Workspace-Root).
- **Alle Einträge im Root** auflisten (Ordner und Dateien, z. B. per `Get-ChildItem` oder List-Dir), um zu sehen, was tatsächlich existiert.
- **vercel.json** und **api/** (falls vorhanden) prüfen: Wird etwas aus **scripts/** oder anderen Ordnern per Import genutzt? Diese Ordner/Dateien **dürfen nicht** in .vercelignore.

### 2. Kandidaten für .vercelignore

Folgende **Standard-Patterns** sollen in .vercelignore stehen (sofern nicht schon vorhanden):

- `node_modules`, `dist`, `coverage`
- `server` (Ordner, falls vorhanden – lokaler Node-Server)
- `data` (Ordner, falls vorhanden)
- `.env`, `.env.example`
- `*.log`, `server.log`, `ftp-scheduler.log`, `task.log`
- `.cursor`, `.cursorignore`, `.claude`, `.vscode`, `.idea`, `.DS_Store`
- `docs`, `*.md`
- `prototype.html` (falls vorhanden)

Zusätzlich: **Projektspezifische** Namen, die im Root **existieren** und typischerweise nicht für Vercel nötig sind, z. B.:

- `pyton` (Python-Skript)
- `starface-export-exe` oder andere **-exe** / **-build** Ordner
- Weitere Ordner/Dateien, die nur lokal oder für andere Zwecke genutzt werden (z. B. Tests, Prototypen, Backups), **ohne** api/, src/, public/, package.json, vite.config.js, vercel.json, index.html oder von der API importierte Scripts zu ignorieren.

### 3. Bestehende .vercelignore einlesen

- Gibt es bereits eine **.vercelignore** im Projektroot?
  - **Nein** → mit Schritt 4 eine neue Datei anlegen (Baseline + alle Kandidaten, die im Projekt existieren).
  - **Ja** → Inhalt einlesen; alle Zeilen, die keine Kommentare (#) und keine Leerzeilen sind, als „bereits vorhandene Einträge“ betrachten (Patterns und exakte Namen).

### 4. Neue Einträge ermitteln

- Für jedes **Standard-Pattern** und jeden **projektspezifischen Kandidaten**, der im Projekt **existiert** (Ordner/Datei im Root):
  - Prüfen, ob es bereits durch die bestehende .vercelignore abgedeckt ist (exakter Eintrag oder passendes Glob-Pattern).
  - Wenn **nicht** abgedeckt → als **neuen Eintrag** vormerken.
- Keine Einträge hinzufügen, die für den Vercel-Build nötig sind (z. B. api/, src/, public/, scripts/ falls von api importiert, package.json, vite.config.js, vercel.json, index.html, etc.).

### 5. .vercelignore anlegen oder aktualisieren

- **Falls keine .vercelignore existierte:**  
  Neue Datei **.vercelignore** mit Kommentar (z. B. „Für Vercel-Deploy nicht benötigt …“), gruppierten Einträgen (Kommentar-Blöcke wie „# Abhängigkeiten“, „# Lokale Daten“) und allen vorgesehenen Einträgen anlegen.

- **Falls .vercelignore bereits existierte:**  
  Nur die **neu ermittelten Einträge** am Ende der Datei ergänzen (evtl. mit kurzem Kommentar „# Ergänzt durch vercelignore-Command“ und einer sinnvollen Gruppe). Bestehende Zeilen und Kommentare **nicht** löschen oder umstellen.

### 6. Kurze Rückmeldung

- Ausgeben: Ob .vercelignore **neu erstellt** oder **aktualisiert** wurde und welche Einträge **hinzugefügt** wurden (oder „Keine neuen Einträge“).

---

## Wichtig

- **api/** und alles, was von der API (z. B. api/*.js) per Import genutzt wird (z. B. scripts/ oder bestimmte Script-Dateien), **nicht** in .vercelignore aufnehmen.
- Nur Einträge ergänzen, die im **aktuellen Projekt** tatsächlich vorkommen (z. B. `starface-export-exe` nur, wenn der Ordner existiert).
- Kommentare in .vercelignore beibehalten; bei Update nur neue Zeilen anhängen oder eine neue Kommentarzeile für die Ergänzung setzen.
