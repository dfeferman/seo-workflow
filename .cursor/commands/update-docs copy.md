# Update Documentation

Sync documentation from source-of-truth:

1. Read package.json scripts section
   - Generate scripts reference table
   - Include descriptions from comments

2. Read .env.example
   - Extract all environment variables
   - Document purpose and format

3. Generate docs/CONTRIB.md with:
   - Development workflow
   - Available scripts
   - Environment setup
   - Testing procedures

4. Generate docs/RUNBOOK.md with:
   - Deployment procedures
   - Monitoring and alerts
   - Common issues and fixes
   - Rollback procedures

5. Identify obsolete documentation:
   - Find docs not modified in 90+ days
   - List for manual review

6. **Bereinigung und Struktur aller .md-Dateien:**
   - Alle .md-Dateien des Projekts (außer in node_modules/.git) in den Ordner **docs** verschieben.
   - Unter **docs** folgende Unterordner anlegen und nutzen:
     - **reports** – Berichte, Analyse-Outputs (z. B. *report*.md, .reports/)
     - **dokumentation** – Anleitungen, CONTRIB, RUNBOOK, technische Doku (CONTRIB.md, RUNBOOK.md, README-ähnliche Doku)
     - **konzept** – Konzepte, Pläne, Architektur (z. B. plan-*.md, konzept*.md, Architektur)
     - **learned** – Lessons Learned, gesammelte Erkenntnisse (z. B. learned/, *learned*.md)
     - **responsiveness** – Responsiveness-Tests, Viewport-/Layout-Dokumentation
     - **data** – Datenformate, Schemas, CSV/Import-Doku, zähllogik
   - Jede .md-Datei einem dieser Ordner zuordnen (nach Inhalt/Dateiname/Konvention); bei Unklarheit **dokumentation** wählen.
   - Vorhandene docs-Unterordner (z. B. docs/learned) in die neue Struktur überführen; doppelte oder veraltete Kopien nicht anlegen.
   - Nach der Sortierung: kurze Übersicht ausgeben (welche Datei → welcher Ordner).

7. Show diff summary

Single source of truth: package.json and .env.example
