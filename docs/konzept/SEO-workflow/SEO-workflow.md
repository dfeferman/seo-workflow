````md
# SEO Content SOP (Medizinprodukte E-Commerce) — HUB-Kategorie + Unterkategorien (UK)
**Tools:** Perplexity (Recherche), ChatGPT (Strategie/Briefing/Text/QA), SurferSEO (NLP/SERP-Optimierung)  
**Prinzipien:** E-E-A-T, Helpful Content, YMYL (keine Heilversprechen/Diagnosen, vorsichtige Claims, Quellenlog)

---

## 0) Variablen (einmal pro Cluster/Kategorie ausfüllen)
> Diese Variablen nutzt du in allen Prompts.

```text
[LAND]=Deutschland
[SPRACHE]=Deutsch
[ZIELGRUPPEN]=Privat / Pflege / Praxis (Priorität optional)
[USPs]=z. B. geprüfte Qualität, schnelle Lieferung, Beratung, Großgebinde
[NO_GOS]=keine Heilversprechen, keine Diagnosen, keine Garantien/„100%“, keine Angstmache, keine riskanten Schritt-für-Schritt-Anleitungen, Claims nur vorsichtig + belegbar

[HUB]=Hauptkategorie (z. B. „Desinfektionsmittel“)
[SLUG_HUB]=/hub-slug (z. B. /desinfektionsmittel)

[UK_LISTE]=Unterkategorien (z. B. Händedesinfektion; Flächendesinfektion; Desinfektionstücher Hände & Fläche; Instrumentendesinfektion)
[SLUG_UK]=Liste der Slugs (z. B. /haendedesinfektion, /flaechendesinfektion, /desinfektionstuecher, /instrumentendesinfektion)

[RATGEBER_LISTE]=vorhandene oder geplante Ratgeberartikel (Titel + Slug, falls vorhanden)
````

---

# TEIL 1 — HUB Workflow

## Phase A (Perplexity) — Recherche

**Wofür:** SERP-Intent & Muster verstehen, Must-have Themen/Kaufkriterien finden, Fragenpool aufbauen, seriöse Quellen/Normen für YMYL-Claims identifizieren.

### A1 SERP/Intent/Muster (HUB)

**Output:** `[INPUT A1]`

```text
Analysiere die Top-Ergebnisse in [LAND] für:
1) “[HUB]”
2) “[HUB] kaufen”
3) “beste [HUB]” (falls sinnvoll)

Aufgabe:
- Bestimme dominanten Intent (transaktional / informativ / gemischt).
- Extrahiere wiederkehrende Content-Muster: typische H2/H3-Topics, Strukturbausteine (Kaufberatung, Filter, FAQ, Sicherheit).
- Liste typische Auswahlkriterien (z. B. Größen, Normen/Zertifizierungen, Material, Kompatibilität, Leistungsmerkmale, Zubehör).
- Nenne typische Shop-Filter/Sortierungen, die häufig vorkommen.
Output: strukturierte Stichpunkte + “Must-have”-Liste.
```

### A1.1 Hub vs. UK aus SERP ableiten (optional, aber hilfreich)

**Output:** `[INPUT A1.1]`

```text
Für die Kategorie [HUB] mit Unterkategorien [UK_LISTE]:
- Welche Unterthemen passen besser auf die Hub-Seite (Überblick/Orientierung)?
- Welche Unterthemen gehören jeweils in die Unterkategorien (Detail-/Longtail-Themen)?
Leite das aus SERP-Mustern ab und gib Empfehlungen zur Abgrenzung (Kannibalisierung vermeiden).
Output als Liste: Hub-Inhalte vs. pro Unterkategorie.
```

### A2 Quellen/Normen/seriöse Referenzen (YMYL)

**Output:** `[INPUT A2]`

```text
Finde seriöse, zitierfähige Quellen (DE/EN) für [HUB] im Kontext Medizinprodukte/Ecommerce.
Priorität:
1) Behörden/öffentliche Institutionen
2) Fachgesellschaften/Leitlinien (falls relevant)
3) Normen/Standards/Prüfverfahren (falls relevant)
4) Herstellerdatenblätter/Gebrauchsanweisungen/SDS (produktbezogen)

Gib je Quelle:
- Name + Link
- wofür nutzbar (Sicherheit, Anwendung, Auswahlkriterien, Normen, Leistungsmerkmale)
- Hinweis: allgemein vs. produkt-/markenspezifisch
```
### A2.1 – Claim-Check (OBSOLET)
**Output:** `[INPUT A2.1]`

```text
Erstelle eine Liste potenziell heikler Aussagen (YMYL/Medical Claims) für [KATEGORIE], die auf Shopseiten oft vorkommen.
Für jede Aussage:
- warum heikel
- wie man sie sicher formuliert (vorsichtig, konditional)
- welche Art Quelle nötig wäre (Behörde/Norm/Herstellerangabe/Leitlinie).
```

### A3 FAQ-/Fragenpool (Nutzerfragen)

**Output:** `[INPUT A3]`

```text
Erstelle 30–40 typische Nutzerfragen vor dem Kauf von [HUB] in [LAND] ([SPRACHE]).
Bitte clustern nach:
- Auswahl/Kompatibilität/Größe
- Anwendung & Sicherheit
- Qualität/Normen/Zertifikate (falls relevant)
- Material/Verträglichkeit/Hautkontakt (falls relevant)
- Zubehör/Verbrauchsmaterial/Nachfüllung
- Lagerung/Haltbarkeit/Entsorgung (falls relevant)
Output: Liste je Cluster.
```

### A3.1 FAQ-Zuordnung

**Output:** `[INPUT A3.1]`

```text
Für [KATEGORIE] als Hub mit Unterkategorien [UNTERKATEGORIEN]:
- Wähle die besten 10–12 FAQs für die Hub-Seite (generisch, orientierend).
- Ordne die restlichen FAQs den passenden Unterkategorien zu.
Begründe kurz je Zuordnung (1 Satz).
```

### A4: Keyword-Recherche in SE Ranking

**Output:** `[INPUT A4]`

```text
Vorgehen in SE Ranking (kein KI-Tool – manuell):
•	Linkes Menü → Keyword-Analyse → Keyword-Recherche
•	[SEED-KEYWORDS] einzeln oder als Liste eingeben, Zielland: [LAND]
•	Tab „Ähnliche Keywords“ / „Keyword-Ideen“ aktivieren
•	Filter setzen: Suchvolumen ≥ 50, Sprache: [SPRACHE]
•	Export als CSV mit Pflichtfeldern: Keyword | Volumen/Mo. | KD | Suchintention | SERP-Features
•	Wiederhole für alle wichtigen Synonyme und Longtail-Varianten aus [SEED-KEYWORDS]

Prompt A4.1 – SE Ranking Export in ChatGPT aufbereiten
„Hier sind Keyword-Daten aus SE Ranking für die Kategorie [KATEGORIE] (Land: [LAND]):
```

### A4.1: Keyword-Gap in SE Ranking

**Output:** `[INPUT A4.1]`

```text
VVorgehen in SE Ranking (manuell):
•	Linkes Menü → Wettbewerbs-Recherche → Keyword Gap
•	[SHOP-DOMAIN] als eigene Domain eintragen, [WETTBEWERBER] in die weiteren Felder
•	Filter: „Fehlende Keywords“ (Wettbewerber rankt, du nicht) oder „Schwache Keywords“ (du ab Seite 2+)
•	Zusätzlicher Filter: Volumen ≥ 50, Land: [LAND]
•	Export als CSV

------------------------ 
„Hier ist der Keyword-Gap-Export aus SE Ranking für [KATEGORIE]:

[SE-RANKING-GAP-EXPORT – CSV-Inhalt hier einfügen]

Aufgabe:
Bereinige Duplikate und Marken-Keywords fremder Hersteller.
Gruppiere die Keywords in thematische Cluster (max. 5–8 Cluster).
Ordne jedem Cluster einen Seitentyp zu: Hub / Unterseite / Ratgeber / Produkt.
Markiere Keywords mit hohem Quick-Win-Potenzial: Wettbewerber auf Seite 1, du gar nicht.
YMYL-Filter: Therapeutische oder diagnose-nahe Keywords mit Flag 🔴 markieren und nicht in B1 übernehmen.

Output als Tabelle: Keyword | Volumen | KD | YMYL-Flag | Cluster | Seitentyp | Priorität
Zusätzlich: kurze Zusammenfassung neuer Cluster, die noch keine Unterseite im Shop haben.“
```
---

## Phase B (ChatGPT) — Architektur & Planung

### B1 Keyword-/Topic-Mapping (Hub vs. UK vs. Ratgeber)

**Wofür:** Zuordnen „Was kommt wohin?“ → verhindert Kannibalisierung, definiert Scope.
**Inputs:**

* `[INPUT A1]` (Pflicht)
* `[INPUT A1.2]
* `[INPUT A2]
* `[INPUT A3]` (Pflicht)
* `[INPUT A4]` (Optional)
* Seitenstruktur/Slugs: `[SLUG_HUB] [SLUG_UK] [RATGEBER_LISTE]`
  **Output:** `[INPUT B1]`

```text
Kontext:
- Hub: [HUB] ([SLUG_HUB])
- Unterseiten (UK): [UK_LISTE] ([SLUG_UK])
- Land/Sprache: [LAND] / [SPRACHE]
- Zielgruppen: [ZIELGRUPPEN]
- No-Gos: [NO_GOS]

Input:
SERP/Must-haves (A1.1): [INPUT A1.1]
(optional) SERP Hub vs UK (A1.2): [INPUT A1.2]
FAQ-Cluster (A3): [INPUT A3]
(optional) Quellen/Claims (A2/A4): [INPUT A2] + [INPUT A4]
Vorhandene/geplante Ratgeber: [RATGEBER_LISTE]

Aufgabe:
Erstelle ein Mapping als Tabelle:
Keyword/Topic/Frage | Suchintention (transaktional/informativ) | Funnel (TOFU/MOFU/BOFU) |
Zielseite (Hub oder welche UK oder Ratgeber) | Priorität (H/M/L) | Begründung (1 Satz)

Zusatz:
- Markiere Kannibalisierungsrisiken + gib 3–6 Abgrenzungsregeln (Hub teasert, UK detailliert etc.).
- Gib am Ende eine Scope-Definition: Hub MUSS / Hub DARF NICHT.
```

### B1.1 Topic-Cluster je UK (Unique H2/H3 pro Unterseite)

**Wofür:** Jede UK wird einzigartig (Unique Topics + FAQs) und rankt eigenständig.
**Inputs:** `[INPUT A1.1] [INPUT A3] [INPUT B1.1] + Seitenstruktur`
**Output:** `[INPUT B1.1]`

```text
Kontext:
Hub: [HUB]
Unterseiten: [UK_LISTE]
No-Gos: [NO_GOS]

Input:
SERP/Must-haves (A1.1): [INPUT A1.1]
FAQ-Cluster (A3): [INPUT A3]
Mapping (B1): [INPUT B1]

Aufgabe:
1) Erstelle pro Unterseite 6–12 einzigartige Topic-Cluster (H2/H3-Ideen), die NICHT 1:1 in der Hub-Seite tief behandelt werden sollen.
2) Zusätzlich: 5 Topics, die auf der Hub-Seite nur als kurzer Teaser stehen sollen (mit Link zur passenden UK).
3) Optional: pro UK 8–12 passende FAQs (aus A3 zuordnen).
Output: je UK als Liste + Abgrenzungshinweise.
```

### B2 Interlinking-Plan (Hub ↔ UK ↔ Ratgeber)

**Wofür:** Systematische interne Verlinkung (SEO/UX/Conversion).
**Pflicht-Inputs:**

* Seitenstruktur/Slugs: `[SLUG_HUB] [SLUG_UK] [RATGEBER_LISTE]`
* `[INPUT B1]` (Pflicht)
* A-Kurzsummary aus `[INPUT A1]` & `[INPUT A3]` (Pflicht)
  **Optional:** `[INPUT B1.2]` (präzisere Platzierung)
  **Output:** `[INPUT B2.1]`

```text
Kontext:
- Hub: [HUB] ([SLUG_HUB])
- UK: [UK_LISTE] ([SLUG_UK])
- Ziel: SEO + UX + Conversion
- No-Gos: [NO_GOS]

Input:
Seitenstruktur/Slugs: Hub + UK + Ratgeber: [SLUG_HUB], [SLUG_UK], [RATGEBER_LISTE]
Mapping (B1): [INPUT B1]
A-Kurzsummary:
- Intent (aus A1): [INPUT A1]
- Must-have Topics/Kriterien (aus A1.1): [INPUT A1.1]
- FAQ-Cluster oder Top-Fragen (aus A3): [INPUT A3][INPUT A3.1]
Unique Topics je UK (B1.1): [INPUT B1.1]

Aufgabe:
Erstelle einen internen Verlinkungsplan als Tabelle:
Von-Seite | Nach-Seite | Empfohlener Anchor (2 Varianten) | Kontextsatz | Zweck (SEO/UX/Conversion) | Platzierung (Intro/Teaser/Kaufberatung/FAQ/Ende)

Mindestumfang:
- Hub → jede UK mind. 2 Links (an unterschiedlichen Stellen)
- Jede UK → Hub mind. 1 Link + zu 1–2 Schwester-UK (wenn logisch)
- 6 Ratgeberideen (Titel + Zielkeyword + wo verlinken) falls [RATGEBER_LISTE] dünn ist
```

---

## Phase C (ChatGPT) — Content Brief (HUB)

**Wofür:** Writer-tauglicher Bauplan: Struktur, Scope, SEO-Elemente, FAQ, Links, E-E-A-T & YMYL-Regeln.
**Inputs:** `[INPUT A1.1] [INPUT A2] [INPUT A3] [INPUT A4] [INPUT B1.1] [INPUT B2.1]`
**Output:** `[INPUT C1]`

```text
Kontext:
- Hub-Seite: [HUB]
- Unterseiten: [UK_LISTE]
- Land/Sprache: [LAND]/[SPRACHE]
- Zielgruppen: [ZIELGRUPPEN]
- USPs: [USPs]
- Ton: seriös, klar, kaufnah
- No-Gos: [NO_GOS]

Input:
Phase A: [INPUT A1.1] + [INPUT A2] + [INPUT A3] + [INPUT A4]
Phase B: Mapping (B1) [INPUT B1.1] + Interlinking (B2) [INPUT B2]

Pflicht: Kategorie STANDARD-OUTLINE (Hub/Collection – Default)
1) Intro (80–120 Wörter)
2) Schnell zur richtigen Auswahl (Teaser/Kacheln + Mini-„Wenn…, dann…“)
3) Welche Variante wofür? (UK kurz + Links)
4) Kaufberatung (6–10 Kriterien)
5) Beliebte Anwendungsfälle (neutral)
6) FAQ (6–10)
7) Sicherheit & Hinweise (kurz)
8) E-E-A-T (Autor/Review/Stand/Quellenkasten)

Aufgabe:
Erstelle ein vollständiges Content-Briefing NUR für die Hub-Seite [HUB] mit:
- Ziel & Suchintention + Jobs-to-be-done
- Scope/Abgrenzung (Hub teasert, UK detailliert) basierend auf B1.1
- 3 H1-Varianten
- 10 Meta Titles (55–60 Zeichen) + 10 Meta Descriptions (150–160)
- Outline H2/H3 + Bulletpoints je Abschnitt (nach Standard-Outline)
- Kaufberatung: Kriterienliste (6–10) + Hinweis, was in UK/Ratgeber gehört
- FAQ 6–10 (hub-geeignet) + Zuordnung restlicher FAQs auf UK/Ratgeber
- Interlinking: Hub→UK + Hub→Ratgeber nach B2.1 (Anchors + Platzierung)
- E-E-A-T/YMYL: Autorbox, Review-Hinweis, Stand/Update, Quellenkasten-Template,
  heikle Claims + sichere Formulierungen (Quelle nötig ja/nein)
Output: writer-tauglich.
```

---

## Phase D (ChatGPT) — Schreiben (HUB)

**Wofür:** Volltext gemäß Briefing (kaufnah + Orientierung), inkl. UK-Teaser, FAQ, Hinweise, E-E-A-T Module.
**Input:** `[INPUT C1]`
**Output:** `[OUTPUT D1]`

```text
Schreibe den vollständigen Text für die Hub-Seite „[HUB]“ strikt nach diesem Briefing:
[INPUT C1]

Anforderungen:
- Ton: seriös, klar, kaufnah; scannable (kurze Absätze, Listen)
- No-Gos: [NO_GOS]
- Strukturpflicht: exakt nach Briefing/Standard-Outline
- Linkpflicht: setze interne Links nach B2.1 (Anchors/Platzierung)
- Enthalten: Teaserblöcke zu [UK_LISTE], Kaufberatung, Mini-„Wenn…, dann…“, FAQ (6–10),
  Sicherheit & Hinweise, Quellenkasten + Autor/Reviewer/Stand (Templates)
Ausgabe: Nur der fertige Seiten-Text.
```

---

## Phase E (SurferSEO + ChatGPT) — Optimierung (HUB)

**Wofür:** SERP-/NLP-Abdeckung, Missing Topics, Headings/Terms optimieren, ohne Stuffing/Scope-Verletzung.
**Inputs:** `[SURFER_OUTPUT_HUB]` (aus Surfer) + `[OUTPUT D_HUB]`
**Output:** `[OUTPUT E1]`

```text
Kontext: Hub-Seite [HUB], No-Gos [NO_GOS]
Input:
Surfer Output (Terms/Topics/Questions/Outline/Wordcount): [SURFER_OUTPUT_HUB]
Aktueller Text: [OUTPUT D1]

Aufgabe:
1) Integriere fehlende Terms/Topics natürlich (kein Stuffing).
2) Optimiere Headings/Reihenfolge.
3) Ergänze Missing Topics, aber halte Scope: Hub = Überblick, Details → UK/Ratgeber.
4) Bewahre Link-Slots/Interlinking gemäß B2.1.
5) Bewahre YMYL-Sicherheit (vorsichtig formulieren, keine Garantien).

Output:
- Vollständig überarbeiteter Text
- Liste der Änderungen
- Liste bewusst NICHT übernommener Terms/Topics + Grund (off-topic, Kannibalisierung, YMYL-Risiko).
```

---

## Phase F (ChatGPT) — QA/Freigabe (HUB)

**Wofür:** YMYL-Risiken entfernen, E-E-A-T vollständig, Quellenlog erstellen, Go/No-Go.
**Inputs:** `[OUTPUT E_HUB]` + `[INPUT A2]` (Quellen)
**Outputs:** `[OUTPUT F1_HUB] [OUTPUT F3_HUB] [OUTPUT F4_HUB]`

### F1 Red-Flag Check

```text
Prüfe den Text auf YMYL-Risiken:
[INPUT E1]

Output als Tabelle:
Stelle/Abschnitt | Risikoart (Heilversprechen/Diagnose/Übertreibung/Sicherheit/Rechtliches) |
Warum riskant | Sichere Alternativformulierung | Quelle nötig (ja/nein) | Priorität (P1/P2/P3)

Regeln: [NO_GOS]
```

### F2 Quellenlog / Claim-Mapping

```text
Text: [OUTPUT E_HUB]
Quellenliste: [INPUT A2]

Aufgabe:
- Identifiziere fachliche Claims (Wirkung/Normen/Sicherheit/Anwendung/Leistungswerte).
- Erstelle Quellenlog:
Claim/Aussage | Abschnitt | Risiko (H/M/L) | Benötigter Quellentyp | Quelle vorhanden (ja/nein) |
Empfohlene Aktion (Belegen/Abschwächen/Entfernen) | Sichere Formulierung
- Wenn Quelle fehlt: neutralere Formulierung vorschlagen.
```

### F3 Go/No-Go Report (inkl. Outline & Links)

```text
Erstelle einen QA-Report für [HUB] basierend auf:
Text: [OUTPUT E_HUB]
Briefing: [INPUT C_HUB] (optional)
Surfer: [SURFER_OUTPUT_HUB] (optional)

Output:
1) Go/No-Go + Begründung
2) Top 10 Fixes (P1/P2/P3)
3) YMYL-Risiken + konkrete Textänderungen
4) E-E-A-T Ergänzungen (Autor/Review/Stand/Quellen)
5) SEO/UX Hinweise (Struktur, Links, FAQ, Scannability)
Zusatz: Prüfe Interlinking nach B2 (alle UK mind. 2 Links, Ratgeber sinnvoll eingebunden).
```

---

# TEIL 2 — Unterkategorien Workflow (UK)

> Pro Unterkategorie führst du denselben A–F Prozess durch — aber mit UK-Scope (Details/Longtails). Der Hub wird verlinkt, aber nicht dupliziert.

## UK Phase A (Perplexity) — Recherche pro Unterkategorie

**Wofür:** UK-SERP verstehen (Detail-Intent), spezifische Kriterien/FAQs, Quellen/Normen falls nötig.
**Outputs:** je UK: `[INPUT A_UK_SERP] [INPUT A_UK_Q] [INPUT A_UK_FAQ]`

### A_UK_SERP (SERP/Intent/Muster)

```text
Analysiere die Top-Ergebnisse in [LAND] für:
1) “[UK_NAME]”
2) “[UK_NAME] kaufen”
3) “beste [UK_NAME]” (falls sinnvoll)

Gib:
- dominanter Intent
- wiederkehrende H2/H3-Topics & Kaufkriterien (UK-spezifisch)
- typische FAQs (People also ask)
- typische Filter/Attribute für diese Unterkategorie
Output: strukturierte Stichpunkte + Must-have UK-Topics.
```

### A_UK_Q (Quellen, wenn UK heikle Claims enthält)

```text
Finde seriöse Quellen (DE/EN) für die Unterkategorie [UK_NAME]:
- Normen/Standards/Listen (falls relevant)
- Behörden/Institutionen (falls relevant)
- Herstellerdatenblätter (produktbezogen)

Gib je Quelle: Name + Link + wofür nutzbar.
```

### A_UK_FAQ (Fragenpool)

```text
Erstelle 20–30 Nutzerfragen zu [UK_NAME] (DE) und cluster sie nach:
- Auswahlkriterien
- Anwendung & Sicherheit
- Kompatibilität/Material/Größe
- Zubehör/Verbrauchsmaterial
- FAQ
Output: Liste je Cluster.
```

---

## UK Phase B (ChatGPT) — UK-Scope & Mini-Mapping

**Wofür:** UK-Seite wird einzigartig (Longtails/Details), klare Abgrenzung zum Hub, Links definieren.
**Inputs:** UK-A-Outputs + globales `[INPUT B1.1]` + optional `[INPUT B1.2]`
**Output:** `[INPUT B_UK]`

```text
Kontext:
- Hub: [HUB] ([SLUG_HUB])
- Unterseite: [UK_NAME] ([UK_SLUG])
- No-Gos: [NO_GOS]

Input:
UK SERP/Topics: [INPUT A_UK_SERP]
UK FAQs: [INPUT A_UK_FAQ]
(optional) UK Quellen: [INPUT A_UK_Q]
Globales Mapping (B1.1): [INPUT B1.1]
(optional) Unique Topics je UK (B1.2): [INPUT B1.2]

Aufgabe:
1) Definiere UK-Scope: was diese Seite tief abdeckt (Longtails/Details) und was NICHT (Hub/Ratgeber).
2) Liste 6–12 UK-spezifische Topic-Cluster (H2/H3) + 8–12 UK-FAQs.
3) Interlinking-Minimum:
   - UK → Hub (mind. 1 Link)
   - UK → 1–2 Schwester-UK (wenn logisch)
   - UK → 1–2 Ratgeber (wenn vorhanden) + Vorschläge falls nicht
Output: strukturiert.
```

---

## UK Phase C (ChatGPT) — Content Brief pro Unterkategorie

**Wofür:** Writer-tauglicher Bauplan je UK, Abgrenzung zum Hub, Linkplatzierung.
**Inputs:** `[INPUT A_UK_SERP] [INPUT A_UK_FAQ] (optional [INPUT A_UK_Q]) + [INPUT B_UK] + [INPUT B2.1]`
**Output:** `[INPUT C_UK]`

```text
Erstelle ein Content-Briefing für die Unterkategorie:
[UK_NAME] ([UK_SLUG])
Zugehöriger Hub: [HUB] ([SLUG_HUB])
Zielgruppen: [ZIELGRUPPEN]
No-Gos: [NO_GOS]
USPs: [USPs]

Input:
UK Recherche: [INPUT A_UK_SERP] + [INPUT A_UK_FAQ] + (optional) [INPUT A_UK_Q]
UK Planung/Scope: [INPUT B_UK]
Globaler Linkplan: [INPUT B2.1]

Anforderungen:
- Klare Abgrenzung: Hub = Überblick; UK = Details/Longtails
- 3 H1-Varianten
- 10 Meta Titles (55–60 Zeichen) + 10 Meta Descriptions (150–160)
- H2/H3 Outline + Bulletpoints je Abschnitt (UK-spezifisch)
- Kaufberatung (UK-spezifische Kriterien)
- FAQ (8–12)
- Interlinking: UK→Hub, UK→Schwester-UK, UK→Ratgeber (Anchors + Platzierung)
- E-E-A-T/YMYL: Autor/Review/Stand/Quellenkasten + heikle Claims Liste
Output: writer-tauglich.
```

---

## UK Phase D (ChatGPT) — Schreiben pro Unterkategorie

**Wofür:** UK-Text, detailreich, aber YMYL-sicher, inkl. Links/FAQ/E-E-A-T Module.
**Input:** `[INPUT C_UK]`
**Output:** `[OUTPUT D_UK]`

```text
Schreibe den vollständigen Text für die Unterkategorie „[UK_NAME]“ strikt nach diesem Briefing:
[INPUT C_UK]

Regeln:
- Ton: seriös, klar, kaufnah
- No-Gos: [NO_GOS]
- Setze Links wie im Briefing (UK→Hub, UK→Schwester-UK, UK→Ratgeber)
- FAQ (8–12), Sicherheit/Hinweise, Quellenkasten + Autor/Review/Stand
Ausgabe: Nur der fertige UK-Text.
```

---

## UK Phase E (SurferSEO + ChatGPT) — Optimierung pro Unterkategorie

**Wofür:** SERP-/NLP-Abdeckung je UK, Missing Topics, Struktur/Terms.
**Inputs:** `[SURFER_OUTPUT_UK]` + `[OUTPUT D_UK]`
**Output:** `[OUTPUT E_UK]`

```text
Kontext: Unterkategorie [UK_NAME], No-Gos [NO_GOS]
Input:
Surfer Output: [SURFER_OUTPUT_UK]
Text: [OUTPUT D_UK]

Aufgabe:
- Terms/Topics natürlich integrieren (kein Stuffing)
- Headings optimieren
- UK-Scope behalten (nicht in Hub-Themen abdriften)
- Links/FAQ beibehalten und verbessern
Output:
- Finaltext
- Änderungen (Stichpunkte)
- nicht übernommene Terms/Topics + Grund
```

---

## UK Phase F (ChatGPT) — QA/Freigabe pro Unterkategorie

**Wofür:** YMYL-Sicherheit, Quellenlog, Go/No-Go, Link-Check (UK→Hub Pflicht).
**Inputs:** `[OUTPUT E_UK]` + Quellenliste (UK: `[INPUT A_UK_Q]` oder global `[INPUT A2]`)

### F1 UK Red-Flag Check

```text
Prüfe den Text auf YMYL-Risiken:
[OUTPUT E_UK]

Tabelle:
Stelle/Abschnitt | Risikoart | Warum riskant | sichere Alternative | Quelle nötig | Priorität

Regeln: [NO_GOS]
```

### F3 UK Quellenlog

```text
Text: [OUTPUT E_UK]
Quellenliste: [INPUT A_UK_Q] (falls vorhanden) oder [INPUT A2] (global)

Erstelle Quellenlog:
Claim | Abschnitt | Risiko | Quellentyp | Quelle vorhanden | Aktion | sichere Formulierung
```

### F4 UK Go/No-Go

```text
QA-Report für [UK_NAME]:
- Go/No-Go + Begründung
- Top Fixes (P1/P2/P3)
- E-E-A-T Ergänzungen
- Link-Check: UK→Hub vorhanden? Schwester-UK Links sinnvoll? Ratgeber Links passend?
```

---

# 7) Quick Reference — Welche Inputs kommen woher?

## Inputs aus Phase A (Perplexity)

* `[INPUT A1.1]` = SERP/Intent/Muster (Hub)
* `[INPUT A1.2]` = Hub vs UK SERP-Abgrenzung (optional)
* `[INPUT A2]` = Quellen/Normen/seriöse Referenzen
* `[INPUT A3]` = Fragenpool/FAQ-Cluster
* `[INPUT A4]` = Claim-Risiken + sichere Formulierungen

## Inputs aus Phase B (ChatGPT)

* `[INPUT B1.1]` = Mapping Hub/UK/Ratgeber + Scope-Regeln
* `[INPUT B1.2]` = Unique Topic-Cluster je UK + Teaser-Topics für Hub
* `[INPUT B2.1]` = Interlinking-Plan (Hub↔UK↔Ratgeber) inkl. Anchors/Platzierung

## Inputs aus SurferSEO

* `[SURFER_OUTPUT_HUB]` = Terms/Topics/Questions/Outline/Wordcount für Hub
* `[SURFER_OUTPUT_UK]` = Terms/Topics/Questions/Outline/Wordcount für UK

---

# 8) E-E-A-T/YMYL Standard-Bausteine (Templates)

## Transparenzhinweis

```text
Hinweis: Diese Informationen dienen der allgemeinen Orientierung und ersetzen keine medizinische Beratung. Maßgeblich sind die Herstellerangaben (Etikett/Datenblatt) sowie ggf. relevante Normen oder Vorgaben.
```

## Autorbox (Template)

```text
Autor: Das Team von [Shopname] – spezialisiert auf Medizinprodukte für Alltag, Pflege und Praxis. Inhalte basieren auf seriösen Quellen und Herstellerangaben.
```

## Review-Hinweis (optional)

```text
Fachliche Prüfung: Dieser Inhalt wurde durch [Name, Funktion/Qualifikation] geprüft. Stand: [Datum].
```

## Stand/Update

```text
Stand/Letzte Aktualisierung: [Datum]. Inhalte und Produkthinweise können sich ändern; maßgeblich sind die Herstellerinformationen.
```

## Quellenkasten

```text
Quellen & Grundlagen (Auswahl):
- [Behörde/Institution] – [Thema/Bezug]
- [Norm/Standard] – [Thema/Bezug]
- [Herstellerdatenblatt/SDS] – [Produkt/Bezug]
- [Weitere seriöse Quelle] – [Thema/Bezug]
```

```
```
