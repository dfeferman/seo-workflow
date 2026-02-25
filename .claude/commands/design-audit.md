# Design-Audit

Design-, UX- und Accessibility-Audit nach **frontend-design**-Skill und den unten festgelegten Kriterien (Cal.com Web Design Guidelines / Report-Erkenntnisse). Erzeugt einen strukturierten Audit-Report. **Kein Zugriff auf design-audit-report.md oder externe Cal.com-Dateien nötig** – alle Kriterien und die Report-Struktur sind hier definiert.

---

## Referenz: Skill frontend-design

Nutze die Kriterien und das Design-Thinking aus `.cursor/skills/frontend-design/skill.md` (bzw. `SKILL.md`). Dort: Design Thinking, Konsistenz, Hierarchie, Accessibility, UX-Feedback, technische Qualität. Fehlt der Skill: Audit trotzdem mit den unten stehenden Kategorien und Best Practices (WCAG, UX) durchführen.

---

## Audit-Kategorien und Kriterien (fest definiert)

Prüfe jede Kategorie anhand dieser Kriterien. Pro Kriterium: Status ✅ (erfüllt), ⚠️ (Verbesserung möglich), ❌ (nicht erfüllt/kritisch) und kurze Anmerkung/Befund.

### 1. Allgemein (Design Thinking, Konsistenz, Hierarchie)

| Kriterium | Was prüfen |
|-----------|-------------|
| Zweck & Zielgruppe | Ist Zweck der Anwendung und Zielgruppe klar erkennbar und konsistent umgesetzt? |
| Konsistenz Farben/Typo | Einheitliche Farbpalette und Typografie (z. B. durchgängige Klassen, keine Wildwuchs-Farben/Schriftgrößen). |
| Hierarchie | Klare H1/H2/H3, logische Struktur (z. B. KPI-Cards: Titel → Wert → SubValue), Buttons/CTAs visuell gruppiert. |
| Komponenten-Wiederverwendung | Gemeinsame Komponenten (Cards, Filter, Layout) werden mehrfach genutzt, kein unnötiges Duplizieren. |

**Empfehlung pro Kategorie:** Kurz festhalten (keine Änderung nötig / konkrete Verbesserungen).

---

### 2. Barrierefreiheit (Accessibility)

| Kriterium | Was prüfen |
|-----------|-------------|
| Kontrast | Text/Hintergrund ausreichend für WCAG AA (z. B. dunkle Schrift auf hellem Grund, ausreichende Kontrastverhältnisse). |
| Fokus sichtbar | Fokusring bei Tastaturnavigation sichtbar (`focus:ring-*`); idealerweise `focus-visible`, damit Fokus nur bei Tastatur erscheint. |
| Semantik | Header mit `<nav>` wo sinnvoll; Modals mit `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. |
| Labels für Formulare | Jedes Formularfeld hat `<label for="...">` bzw. `id`/`htmlFor`; Custom-Komponenten mit sichtbaren oder `aria-label`-Labels. |
| Fehlermeldungen | Fehlertext sichtbar; für Screenreader: `aria-live`/`role="alert"` bei Fehlern, `aria-describedby`/`aria-invalid` am Feld. |
| Icon-Only Buttons | Buttons nur mit Icon haben `aria-label` (zusätzlich zu `title`); Modal-Schließen etc. nicht nur visuell, sondern für Screenreader benannt. |

**Umsetzung:** Siehe Abschnitt „Empfohlene Anpassungen“ im Report.

---

### 3. UX (Feedback, Fehler, Mobile)

| Kriterium | Was prüfen |
|-----------|-------------|
| Loading/Erfolg/Fehler | Klare Zustände: Loading (z. B. „Bereite vor…“, „Läuft…“), Erfolg, Fehler mit Text und ggf. Icon. |
| Fehler verständlich | Fehlermeldungen in Nutzersprache (z. B. „Falsches Passwort.“, „Bitte mindestens eine Datei auswählen.“), API-Fehler mit lesbarer Meldung. |
| Mobile / Touch | Touch-Ziele mind. ~44px (`min-h-[44px]` o. ä.), responsive Breakpoints, nutzbare Filter/Selektoren auf Mobile. |
| Hover nicht exklusiv | Wichtige Aktionen auch ohne Hover erkennbar (Labels, Kontrast), keine kritischen Infos nur per Hover. |

**Empfehlung:** Optional z. B. Erfolgs-Toast mit Auto-Close, Verfeinerung von Feedback nach Aktionen.

---

### 4. Technik (Struktur, State, Performance)

| Kriterium | Was prüfen |
|-----------|-------------|
| Wiederverwendung | Gemeinsame Komponenten (Layout, Cards, Filter) konsequent genutzt. |
| State | Klare Aufteilung (Daten-Hooks vs. lokaler UI-State), keine offensichtlichen Re-Render-Probleme. |
| Performance | Sinnvolle Build-/Bundling-Konfiguration; Daten z. B. einmal pro Kontext (Zeitraum/Filter) geladen, keine unnötigen Duplikate. |

---

## Report-Struktur (Ausgabeformat)

Der Audit-Report soll folgende Struktur haben:

1. **Titel:** „Design-Audit: <Projektname>“, **Datum**, **Referenz:** frontend-design + „Design-Audit Command (Cal.com/Report-Kriterien)“.
2. **Abschnitte 1–4** – je einer pro Kategorie (Allgemein, Barrierefreiheit, UX, Technik):
   - Tabelle: Kriterium | Status (✅/⚠️/❌) | Anmerkung/Befund
   - Kurz **Empfehlung** unter der Tabelle.
3. **Abschnitt 5: Empfohlene Anpassungen (nach Audit)** – konkrete Maßnahmen in Stichpunkten (ohne Code-Änderung durchzuführen, sofern nicht vom Nutzer gewünscht). Orientierung an der Checkliste unten.
4. **Abschnitt 6: Kurzfassung** – Stärken, verbesserte Punkte, optionale Nachbesserungen.

---

## Empfohlene Anpassungen (Checkliste für den Report)

Diese Punkte als Muster nutzen, um im Report „Empfohlene Anpassungen“ zu formulieren (projektbezogen anpassen):

- **Formulare:** Inputs mit `id`, zugehörigem `<label for="...">`; Fehler mit `aria-describedby` und `aria-invalid` am Feld.
- **Modal/Dialog:** Container mit `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; Schließen-Button mit `aria-label`; Status/Fehler mit `role="status"` bzw. `role="alert"` bei Fehlern.
- **Icon-Only-Buttons:** Header-Aktionen und Modal-Schließen mit `aria-label` (zusätzlich zu `title`).
- **Custom-Formularfelder:** Sichtbare `<label>` und `id`/`htmlFor`-Verknüpfung.
- **Fokus:** Einheitlicher Fokusring (`focus:ring-2 focus:ring-*`); optional `focus-visible` für reine Tastatur-Fokus-Anzeige.

---

## Ablauf

1. **Kontext laden** – frontend-design-Skill lesen (falls vorhanden).
2. **Relevante UI-Dateien ermitteln** – Komponenten, Layouts, Seiten (z. B. `src/`, `app/`, `components/`); Fokus auf sichtbare UI und Formulare.
3. **Audit durchführen** – alle Kriterien der Kategorien 1–4 prüfen, Status und Befund notieren.
4. **Report erzeugen** – nach der oben definierten Report-Struktur; „Empfohlene Anpassungen“ anhand der Checkliste formulieren.
5. **Ausgabe** – Report im Chat ausgeben; optional in `docs/design-audit-report.md` (oder vom Nutzer gewünschter Pfad) schreiben.

---

## Wichtige Hinweise

- **Status:** ✅ erfüllt, ⚠️ Verbesserung möglich, ❌ nicht erfüllt / kritisch.
- **Keine Änderungen ohne Auftrag** – Audit nur bewerten und reporten; Code nur anpassen, wenn der Nutzer es ausdrücklich wünscht.
- **Priorität:** Accessibility-Probleme (fehlende Labels, fehlende ARIA, Kontrast) klar als ⚠️/❌ kennzeichnen und konkrete Fix-Vorschläge nennen.
