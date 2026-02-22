# Sync: Utils → .cursor / .claude

Synchronisiert Ordner und Dateien aus dem zentralen **utils**-Verzeichnis in das aktuelle Projekt – entweder nach `.cursor` oder nach `.claude`, gesteuert über **listing.md**.

## Ablauf

### 1. Listing einlesen

Lies die Datei **listing.md** aus dem utils-Ordner:

- **Pfad:** `D:\development\cursor_workspace\utils\listing.md`  
  (oder relativ vom Workspace-Root: `../utils/listing.md` / `../../utils/listing.md`, je nach aktuellem Projekt)

In **listing.md** sind die Artefakte nach Ziel-System aufgeteilt:

- Abschnitt **# .cursor** – Skills, Agents, Commands, Rules für Cursor (Ordner `.cursor/`)
- Abschnitt **# .claude** – Skills, Agents, Commands, Rules für Claude Code (Ordner `.claude/`)

Pro Abschnitt gibt es Unterüberschriften `## Skills`, `## Agents`, `## Commands`, `## Rules` mit jeweils einer Liste der **Namen** (ein Name pro Zeile, z. B. `- coding-standards`). Nur diese gelisteten Artefakte werden übernommen.

### 2. Ziel abfragen

Frage den Nutzer eindeutig:

- **„Sync nach .cursor oder .claude?“**  
  (oder: „Cursor oder Claude?“)

- Auswertung:
  - Antwort bedeutet **Cursor** (z. B. „cursor“, „c“, „.cursor“) → Zielordner im aktuellen Projekt: **`.cursor/`**
  - Antwort bedeutet **Claude** (z. B. „claude“, „cl“, „.claude“) → Zielordner im aktuellen Projekt: **`.claude/`**

Ohne klare Auswahl: einmal nachfragen, dann abbrechen oder Standard (z. B. .cursor) nutzen, wie zuvor vereinbart.

### 3. Quellpfad festlegen

- **Quell-Root:** `D:\development\cursor_workspace\utils\`  
  (bzw. der gleiche utils-Ordner, aus dem listing.md gelesen wurde)

Strukturen darunter (nur als Vorlage, tatsächlich nur das kopieren, was in listing.md für das gewählte Ziel steht):

- `utils/skills/<name>/` → Skills (ganzer Ordner inkl. SKILL.md und Unterdateien)
- `utils/agents/<name>.md` → Agents
- `utils/commands/<name>.md` → Commands
- `utils/rules/<name>.md` → Rules

### 4. Nur gelistete Artefakte übernehmen

Aus **listing.md** nur die Einträge des **gewählten Ziels** (.cursor oder .claude) verwenden:

- Unter **# .cursor** gelistet → nur bei Wahl „Cursor“ übernehmen.
- Unter **# .claude** gelistet → nur bei Wahl „Claude“ übernehmen.

Für jeden gelisteten Namen:

- **Skills:** Ordner `utils/skills/<name>/` vollständig nach `<Projekt>/.cursor/skills/<name>/` bzw. `<Projekt>/.claude/skills/<name>/` kopieren.
- **Agents:** Datei `utils/agents/<name>.md` nach `<Projekt>/.cursor/agents/<name>.md` bzw. `.claude/agents/<name>.md`.
- **Commands:** Datei `utils/commands/<name>.md` nach `<Projekt>/.cursor/commands/<name>.md` bzw. `.claude/commands/<name>.md`.
- **Rules:** Datei `utils/rules/<name>.md` nach `<Projekt>/.cursor/rules/<name>.md` bzw. `.claude/rules/<name>.md`.

Fehlende Zielordner (z. B. `.cursor/skills`, `.cursor/agents`, …) anlegen. Vorhandene Dateien/Ordner am Ziel **überschreiben**, damit der Stand von utils übernommen wird.

### 5. Kurze Bestätigung

Nach dem Kopiervorgang ausgeben:

- Welches Ziel verwendet wurde (.cursor oder .claude).
- Welche Kategorien (Skills, Agents, Commands, Rules) und wie viele Einträge pro Kategorie übernommen wurden.
- Bei Fehlern: welche Artefakte in utils fehlen (Name/Datei/Ordner).

## Wichtige Hinweise

- **Projekt-Root:** Immer das aktuell geöffnete Projekt / der Workspace-Ordner, in dem die Command ausgeführt wird. Darunter liegen `.cursor/` bzw. `.claude/`.
- **listing.md:** Muss im utils-Ordner existieren und die Abschnitte `# .cursor` und `# .claude` mit den Unterkategorien und Namenslisten enthalten. Fehlt die Datei oder ein Eintrag, das jeweilige Artefakt nicht kopieren und in der Ausgabe vermerken.
- **Keine anderen Dateien:** Es werden nur die in listing.md für das gewählte Ziel genannten Skills, Agents, Commands und Rules aus utils übernommen – keine zusätzlichen Ordner/Dateien aus utils (z. B. README, mcp.json), sofern sie nicht explizit in listing.md aufgeführt sind.
