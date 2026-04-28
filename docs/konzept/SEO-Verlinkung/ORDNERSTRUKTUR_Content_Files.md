# Ordnerstruktur für Content-Files (.md)

## Übersicht

Eine klare, skalierbare Ordnerstruktur für alle Content-Markdown-Dateien, die:
1. **Projekt-basiert** ist (Multi-Projekt-Support)
2. **Content-Typ** unterscheidet (Hub, Spokes, Blog)
3. **Phase/Status** abbildet (Draft, Review, Published)
4. **Versionierung** ermöglicht (optional)
5. **Upload-freundlich** ist (Drag & Drop)

**Wichtig**: Ratgeber = Blog (kein separater Ordner nötig)

---

## Empfohlene Struktur

```
content/
├── medizinprodukte-shop/              # Projekt-Name (slug)
│   ├── _meta.json                     # Projekt-Metadaten
│   │
│   ├── kategorien/                    # Hauptkategorien (Hubs)
│   │   ├── desinfektionsmittel/
│   │   │   ├── desinfektionsmittel-hub.md    # Hub-Seite
│   │   │   ├── _meta.json                    # Hub-Metadaten (Zielgruppen, USPs, etc.)
│   │   │   │
│   │   │   └── uk/                           # Unterkategorien (Spokes)
│   │   │       ├── haendedesinfektion-uk.md
│   │   │       ├── flaechendesinfektion-uk.md
│   │   │       ├── desinfektionstucher-uk.md
│   │   │       ├── hautdesinfektion-uk.md
│   │   │       ├── instrumentendesinfektion-manuell-uk.md
│   │   │       ├── instrumentendesinfektion-maschinell-uk.md
│   │   │       ├── abdruckdesinfektion-uk.md
│   │   │       └── saugrohrdesinfektion-uk.md
│   │   │
│   │   ├── handschuhe/
│   │   │   ├── handschuhe-hub.md
│   │   │   ├── _meta.json
│   │   │   └── uk/
│   │   │       ├── untersuchungshandschuhe-uk.md
│   │   │       ├── op-handschuhe-uk.md
│   │   │       └── schutzhandschuhe-uk.md
│   │   │
│   │   └── masken/
│   │       ├── masken-hub.md
│   │       ├── _meta.json
│   │       └── uk/
│   │           ├── op-masken-uk.md
│   │           ├── ffp2-masken-uk.md
│   │           └── ffp3-masken-uk.md
│   │
│   ├── blog/                          # Blog-Artikel & Anleitungen
│   │   ├── anleitungen/               # How-To, Guides (früher "Ratgeber")
│   │   │   ├── 2025-01-vah-vs-rki.md
│   │   │   ├── 2025-01-haendedesinfektion-anleitung.md
│   │   │   ├── 2025-02-flaechendesinfektion-krinko.md
│   │   │   ├── 2025-02-desinfektionsmittel-gastronomie.md
│   │   │   ├── 2025-03-lagerung-sicherheit.md
│   │   │   └── 2025-03-coronavirus-desinfektion.md
│   │   │
│   │   ├── hygiene/                   # Themen-Artikel
│   │   │   ├── 2025-01-hygienekette-krankenhaus.md
│   │   │   ├── 2025-02-nosokomiale-infektionen.md
│   │   │   └── 2025-03-rki-empfehlungen.md
│   │   │
│   │   ├── best-practices/            # Tipps & Tricks
│   │   │   ├── 2025-01-hygieneplan-erstellen.md
│   │   │   └── 2025-02-hygieneschulung.md
│   │   │
│   │   └── produktwissen/             # Produkt-bezogene Artikel
│   │       ├── 2025-01-handschuhgroessen-tabelle.md
│   │       └── 2025-02-ffp-masken-vergleich.md
│   │
│   ├── drafts/                        # Work in Progress
│   │   ├── kategorien/
│   │   │   └── beatmung/              # Neuer Hub in Arbeit
│   │   │       └── beatmung-hub-draft.md
│   │   ├── uk/
│   │   │   └── hautdesinfektion-chirurgisch-uk-draft.md
│   │   └── blog/
│   │       └── 2025-04-mpg-novelle-draft.md
│   │
│   └── archive/                       # Alte Versionen / Archiv
│       └── desinfektionsmittel/
│           └── desinfektionsmittel-hub-v1-2024-12.md
│
└── zahnarzt-praxis/                   # Zweites Projekt
    ├── _meta.json
    ├── kategorien/
    │   └── prophylaxe/
    │       ├── prophylaxe-hub.md
    │       └── uk/
    │           ├── zahnreinigung-uk.md
    │           └── fluoridierung-uk.md
    └── blog/
        ├── zahngesundheit/
        │   └── 2025-01-richtig-zaehneputzen.md
        └── anleitungen/
            └── 2025-01-pzr-ablauf.md
```

---

## Datei-Namenskonventionen

### Hub-Seiten
```
{kategorie-name}-hub.md      # Immer mit -hub Suffix
desinfektionsmittel-hub.md
handschuhe-hub.md
masken-hub.md
```

### Spokes (Unterkategorien)
```
{name}-uk.md                 # Immer mit -uk Suffix (Unterkategorie)
haendedesinfektion-uk.md
flaechendesinfektion-uk.md
op-handschuhe-uk.md
```

### Blog-Artikel (inkl. Anleitungen)
```
YYYY-MM-{slug}.md            # Datum-Präfix (YYYY-MM)
2025-01-hygienekette-krankenhaus.md
2025-02-nosokomiale-infektionen.md
2025-01-vah-vs-rki.md
2025-01-haendedesinfektion-anleitung.md
2025-02-lagerung-sicherheit.md
```

**Warum Suffixe (-hub, -uk)?**
- Vermeidet Namenskollisionen (hub.md vs. hub.md)
- Typ sofort erkennbar im Dateinamen
- Eindeutig bei Suche (flaechendesinfektion-uk.md ≠ flaechendesinfektion-hub.md)

**Warum Datum-Präfix bei ALLEN Blog-Artikeln?**
- Sortierung chronologisch
- Vermeidet Duplikate (z.B. zwei Artikel "neues-mpg")
- Zeigt Aktualität
- Einheitlich für Blog + Anleitungen

---

## Metadata-Dateien (_meta.json)

Jedes Projekt und jeder Hub hat eine `_meta.json` mit Metadaten:

### Projekt-Level: `/content/medizinprodukte-shop/_meta.json`
```json
{
  "project_id": "uuid-123",
  "name": "Medizinprodukte-Shop",
  "slug": "medizinprodukte-shop",
  "created_at": "2025-01-15",
  "owner": "user@example.com"
}
```

### Hub-Level: `/content/medizinprodukte-shop/kategorien/desinfektionsmittel/_meta.json`
```json
{
  "category_id": "uuid-456",
  "name": "Desinfektionsmittel",
  "hub_name": "Desinfektionsmittel kaufen",
  "type": "category",
  "zielgruppen": ["Privat", "Pflege", "Praxis", "Klinik"],
  "shop_typ": "B2C + B2B",
  "usps": "Schnelle Lieferung, VAH/RKI-gelistet, Fachberatung",
  "ton": "Seriös-medizinisch, leicht verständlich",
  "no_gos": "Keine Heilversprechen, keine Garantien, keine Angst-Kommunikation",
  "url_slug": "/desinfektionsmittel",
  "created_at": "2025-01-20"
}
```

---

## Markdown-File-Format (Frontmatter)

Jede `.md`-Datei hat Frontmatter (YAML) am Anfang:

### Beispiel: Hub-Seite (`desinfektionsmittel-hub.md`)
```markdown
---
type: hub
category_id: uuid-456
name: Desinfektionsmittel kaufen
url_slug: /desinfektionsmittel
status: published
word_count: 1450
last_updated: 2025-02-15
author: max@example.com
---

# Desinfektionsmittel kaufen

[Intro-Text...]

## Schnell zur richtigen Auswahl

- [Händedesinfektion](/haendedesinfektion)
- [Flächendesinfektion](/flaechendesinfektion)
...
```

### Beispiel: Spoke (`haendedesinfektion-uk.md`)
```markdown
---
type: spoke
category_id: uuid-789
parent_hub: desinfektionsmittel
name: Händedesinfektionsmittel kaufen
url_slug: /haendedesinfektion
status: published
word_count: 1820
last_updated: 2025-02-16
author: max@example.com
---

# Händedesinfektionsmittel kaufen

Zurück zu [allen Desinfektionsmitteln](/desinfektionsmittel).

## Übersicht
...
```

### Beispiel: Blog/Anleitung (`2025-01-vah-vs-rki.md`)
```markdown
---
type: blog
category: anleitungen
name: VAH vs. RKI – Welche Zertifizierung brauche ich?
url_slug: /blog/vah-vs-rki
status: published
word_count: 980
published_date: 2025-01-15
author: sarah@example.com
tags:
  - VAH
  - RKI
  - Zertifizierung
related_hubs:
  - desinfektionsmittel
  - handschuhe
---

# VAH vs. RKI – Welche Zertifizierung brauche ich?

...
```

---

## Upload-Workflow (Drag & Drop)

### Szenario 1: Einzelne Datei hochladen
1. User zieht `haendedesinfektion-uk.md` in Graph-View
2. System liest Frontmatter:
   ```yaml
   type: spoke
   parent_hub: desinfektionsmittel
   url_slug: /haendedesinfektion
   ```
3. System:
   - Erstellt Node "UK Händedesinfektion"
   - Parst Links im Markdown
   - Speichert File in `/content/medizinprodukte-shop/kategorien/desinfektionsmittel/uk/haendedesinfektion-uk.md`

### Szenario 2: Ganzen Hub-Ordner hochladen
1. User zieht Ordner `desinfektionsmittel/` in Graph-View
2. System findet:
   - `desinfektionsmittel-hub.md` → Hub-Node
   - `uk/*.md` → 8 Spoke-Nodes
3. System parst alle Files, erstellt Nodes + Edges
4. Graph zeigt kompletten Hub-Cluster

**Hinweis**: Blog-Artikel werden separat hochgeladen (nicht Hub-spezifisch)

### Szenario 3: Bulk-Upload (ZIP)
1. User uploaded `projekt.zip`
2. System entpackt, liest Struktur
3. Erstellt Nodes + Edges für alle Files

---

## Integration mit Supabase Storage

Files werden in Supabase Storage abgelegt:

```
Supabase Storage Bucket: "content-files"
├── medizinprodukte-shop/
│   ├── kategorien/
│   │   └── desinfektionsmittel/
│   │       ├── desinfektionsmittel-hub.md
│   │       └── uk/
│   │           └── haendedesinfektion-uk.md
│   └── blog/
│       └── anleitungen/
│           └── 2025-01-vah-vs-rki.md
```

**In DB (`pages` Tabelle):**
```sql
| id   | name                   | type  | markdown_file_path                                                          |
|------|------------------------|-------|-----------------------------------------------------------------------------|
| uuid | Hub Desinfektionsmittel| hub   | medizinprodukte-shop/kategorien/desinfektionsmittel/desinfektionsmittel-hub.md |
| uuid | UK Händedesinfektion   | spoke | medizinprodukte-shop/kategorien/desinfektionsmittel/uk/haendedesinfektion-uk.md |
| uuid | VAH vs. RKI            | blog  | medizinprodukte-shop/blog/anleitungen/2025-01-vah-vs-rki.md                |
```

---

## Git-Integration (Optional, Post-MVP)

Für Teams, die mit Git arbeiten:

```
content-repo/                         # Git-Repository
├── .git/
├── medizinprodukte-shop/
│   ├── kategorien/
│   │   └── desinfektionsmittel/
│   │       ├── desinfektionsmittel-hub.md
│   │       └── uk/
│   │           └── haendedesinfektion-uk.md
│   └── blog/
│       └── anleitungen/
│           └── 2025-01-vah-vs-rki.md
└── zahnarzt-praxis/
    └── ...
```

**Workflow**:
1. Writer committed `.md`-File zu Git
2. Webhook triggered Platform
3. Platform lädt File, updated Graph
4. Graph zeigt "🔄 Synced from Git"

---

## Zusammenfassung: Beste Praxis

### Empfohlene Struktur
```
content/
└── {project-slug}/
    ├── _meta.json
    ├── kategorien/
    │   └── {hub-slug}/
    │       ├── {hub-slug}-hub.md
    │       ├── _meta.json
    │       └── uk/
    │           └── {spoke-slug}-uk.md
    ├── blog/
    │   └── {category}/
    │       └── YYYY-MM-{slug}.md
    ├── drafts/
    └── archive/
```

### Namenskonventionen
- **Ordner**: `kebab-case` (klein, Bindestriche)
- **Hubs**: `{name}-hub.md` (Suffix -hub)
- **Spokes**: `{name}-uk.md` (Suffix -uk)
- **Blogs**: `YYYY-MM-{slug}.md` (Datum-Präfix)

### Frontmatter (Pflichtfelder)
```yaml
type: hub|spoke|blog
name: "Seitentitel"
url_slug: /pfad
status: published|draft|review|planned
```

### Blog-Kategorien (Empfehlung)
```
blog/
├── anleitungen/         # Früher "Ratgeber" → How-To, Guides
├── hygiene/             # Themen-Artikel
├── produktwissen/       # Produkt-spezifisch
└── best-practices/      # Tipps & Tricks
```

### Upload-Strategien
1. **Einzelfile**: Drag & Drop einer `.md`-Datei
2. **Hub-Ordner**: Drag & Drop eines Hub-Ordners (mit UKs)
3. **Blog-Ordner**: Drag & Drop einer Kategorie (z.B. `anleitungen/`)
4. **Bulk**: ZIP-Upload für ganzes Projekt

---

**Vorteile dieser Struktur:**
✅ Skalierbar (Multi-Projekt)  
✅ Übersichtlich (kategorien/ → Hub → uk/)  
✅ Git-freundlich (keine tiefen Verschachtelungen)  
✅ Upload-freundlich (klare Ordner-Hierarchie)  
✅ Metadata-unterstützt (JSON + Frontmatter)  
✅ Status-flexibel (Draft/Review/Published)  
✅ **Vereinfacht: Blog = Ratgeber** (keine Duplikate)  
✅ **Eindeutige Dateinamen** (Suffixe -hub, -uk)

**Content-Typen:**
- **Hub**: Hauptkategorie (1 pro Kategorie) → `{name}-hub.md`
- **Spoke**: Unterkategorie (n pro Hub) → `{name}-uk.md`
- **Blog**: Artikel + Anleitungen (alle im `/blog`-Ordner) → `YYYY-MM-{slug}.md`
