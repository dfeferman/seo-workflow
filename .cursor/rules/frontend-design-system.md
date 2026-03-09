# Frontend Design System

Referenz-Design-System basierend auf dem Starface Dashboard.
Gilt als verbindlicher Standard für alle zukünftigen Dashboard- und Web-App-Projekte.

---

## Stack

- **Framework:** React + Vite
- **Styling:** Tailwind CSS (Standard-Theme, keine Custom-Extensions)
- **Icons:** `lucide-react`
- **Charts:** `recharts`
- **Kein** Custom-CSS außer globalen Reset-Regeln

---

## Farben

### Primärpalette

| Rolle             | Klassen                                      | Hex         |
|-------------------|----------------------------------------------|-------------|
| Brand/CTA         | `bg-blue-600`, `text-blue-600`               | `#2563eb`   |
| Brand Hover       | `bg-blue-700`                                | `#1d4ed8`   |
| Focus Ring        | `ring-blue-500`                              | `#3b82f6`   |
| Seite Hintergrund | `bg-slate-50`                                | `#f8fafc`   |
| Cards / Header    | `bg-white`                                   | `#ffffff`   |
| Primärtext        | `text-slate-900`                             | `#0f172a`   |
| Fließtext         | `text-slate-800`                             | `#1e293b`   |
| Labels            | `text-slate-700`                             | `#334155`   |
| Sekundärtext      | `text-slate-500`, `text-slate-600`           | `#64748b`   |
| Deaktiviert       | `text-slate-400`                             | `#94a3b8`   |
| Rahmen Standard   | `border-slate-200`                           | `#e2e8f0`   |
| Rahmen Buttons    | `border-slate-300`                           | `#cbd5e1`   |
| Hover-Fläche      | `hover:bg-slate-100`                         | `#f1f5f9`   |

### Semantische Farben

| Status    | Hintergrund       | Text               | Rahmen              |
|-----------|-------------------|--------------------|---------------------|
| Erfolg    | `bg-emerald-50`   | `text-emerald-700` | `border-emerald-200`|
| Warnung   | `bg-amber-50`     | `text-amber-800`   | `border-amber-200`  |
| Fehler    | `bg-red-50`       | `text-red-600`     | `border-red-200`    |
| Info      | `bg-blue-50`      | `text-blue-700`    | `border-blue-200`   |
| Akzent    | `bg-indigo-50`    | `text-indigo-700`  |                     |

### Chart-Farben (Recharts / Inline)

```
Eingehend  #3b82f6  (blue-500)
Ausgehend  #10b981  (emerald-500)
Warnung    #f59e0b  (amber-500)
Fehler     #dc2626  (red-600)
Akzent     #8b5cf6  (violet-500)
```

### Brand-Shadow

```
Standard:  shadow-[0_2px_8px_rgba(37,99,235,0.25)]
Hover:     shadow-[0_2px_8px_rgba(37,99,235,0.35)]
```

---

## Typografie

**Schriftfamilie:** `font-sans` (System-Default-Stack)

| Element              | Klassen                                              |
|----------------------|------------------------------------------------------|
| App-Logo             | `text-[20px] font-bold leading-none tracking-tight`  |
| Logo-Icon (Kürzel)   | `text-[11px] font-extrabold tracking-tight`          |
| Sektion-Titel        | `text-xl font-bold` / `text-2xl font-bold`           |
| Card-Titel (KPI)     | `text-xs font-semibold uppercase tracking-wider`     |
| KPI-Wert groß        | `text-2xl font-bold text-slate-900`                  |
| Fließtext Standard   | `text-sm` (14px)                                     |
| Kleiner Hilfstext    | `text-xs text-slate-500`                             |
| Status-Pill          | `text-[12px] tracking-[0.025em]`                     |
| Badge-Text           | `text-[10px] font-medium`                            |
| Tabellen-Header      | `text-sm font-semibold text-slate-700`               |
| Tabellen-Zellen      | `text-sm`                                            |
| Logs / Code          | `font-mono text-sm`                                  |
| Button (primär)      | `text-[14px] font-semibold`                          |
| Button (sekundär)    | `text-[14px] font-medium`                            |

---

## Spacing

### Konsistente Abstände

| Kontext                  | Klassen                       |
|--------------------------|-------------------------------|
| Hauptinhalt Padding      | `px-[22px] py-5`              |
| Header Padding           | `px-[22px]`                   |
| Card Padding             | `p-6`                         |
| Modal Padding            | `p-6`                         |
| Button (Header)          | `px-[13px] py-[6px]`          |
| Button (Standard)        | `px-4 py-2`                   |
| Input                    | `px-4 py-2` / `px-3 py-1.5`  |
| Gap in Flex-Layouts      | `gap-4` / `gap-6`             |
| Gap Header-Elemente      | `gap-[10px]`                  |
| Gap Icon + Text          | `gap-[5px]` / `gap-2`         |
| Sektionsabstand          | `space-y-6` / `space-y-8`     |
| Trenn-Divider (vertikal) | `h-[18px] w-px bg-slate-200`  |
| Trenn-Divider (horiz.)   | `h-px bg-slate-200`           |

---

## Border Radius

| Element          | Klasse          |
|------------------|-----------------|
| Cards, Modals    | `rounded-xl`    |
| Buttons, Inputs  | `rounded-lg`    |
| Logo-Button      | `rounded-[10px]`|
| Badges / Pills   | `rounded-full`  |
| Kleine Elemente  | `rounded`       |

---

## Schatten (Elevation)

| Ebene          | Klasse                 | Einsatz                    |
|----------------|------------------------|----------------------------|
| Keine          | –                      | Inline-Elemente            |
| Subtil         | `shadow-sm`            | Cards, Tabellen, Inputs    |
| Standard       | `shadow-md`            | Hover-State von Cards      |
| Prominent      | `shadow-lg`            | Login-Formular             |
| Modal          | `shadow-2xl`           | Dialoge / Overlays         |
| Brand          | Custom (s.o.)          | Logo-Button, CTA           |

---

## Komponenten

### Buttons

**Primär (CTA, blau):**
```jsx
<button className="flex items-center gap-[5px] px-[13px] py-[6px] rounded-lg
  bg-blue-600 text-[14px] font-semibold text-white
  hover:bg-blue-700 transition-colors
  shadow-[0_1px_4px_rgba(37,99,235,0.25)] hover:shadow-[0_2px_8px_rgba(37,99,235,0.35)]
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
  whitespace-nowrap">
  <Icon className="w-[13px] h-[13px] shrink-0" />
  Label
</button>
```

**Sekundär (Rahmen, grau):**
```jsx
<button className="flex items-center gap-[5px] px-[13px] py-[6px] rounded-lg
  border border-slate-300 text-[14px] font-medium text-slate-500
  hover:bg-slate-100 hover:text-slate-900 transition-colors
  focus:outline-none focus:ring-2 focus:ring-blue-500
  whitespace-nowrap">
  Label
</button>
```

**Destruktiv (rot):**
```jsx
<button className="px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white
  hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
  Löschen
</button>
```

**Deaktiviert:** immer `disabled:opacity-70 disabled:pointer-events-none`

### Cards

```jsx
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6
  hover:shadow-md hover:-translate-y-px transition-all overflow-hidden">
  {/* Optionaler farbiger Stripe oben */}
  <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-500" />
  ...
</div>
```

### KPI-Card

```jsx
<div className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6
  hover:shadow-md hover:-translate-y-px transition-all overflow-hidden">
  <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-500" />  {/* Stripe */}
  <div className="flex items-start justify-between mb-3">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-700">
      <Icon className="w-[18px] h-[18px]" />
    </div>
    {/* Trend-Badge */}
  </div>
  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Titel</p>
  <p className="text-2xl font-bold text-slate-900">42</p>
</div>
```

KPI-Badge-Farben: `blue`, `emerald`, `indigo`, `orange` (je nach Kategorie)

### Modal / Dialog

```jsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
  {/* Dialog */}
  <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 p-6
    animate-in fade-in zoom-in duration-200">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-slate-900">Titel</h2>
      <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
        <X className="w-5 h-5" />
      </button>
    </div>
    {/* Content */}
    ...
    {/* Footer Buttons */}
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
      <button className="px-4 py-2 ...secondary...">Abbrechen</button>
      <button className="px-4 py-2 ...primary...">Bestätigen</button>
    </div>
  </div>
</div>
```

### Inputs

**Text-Input:**
```jsx
<input className="w-full px-4 py-2 border border-slate-200 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-blue-500
  bg-white text-slate-800 text-sm" />
```

**Select:**
```jsx
<select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm
  bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
```

### Tabellen

```jsx
<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/50">
        <th className="py-2 px-3 text-left text-sm font-semibold text-slate-700">Spalte</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors">
        <td className="py-2 px-3 text-sm text-slate-800">Wert</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status-Badges

```jsx
{/* Inline Badge */}
<span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
  Aktiv
</span>

{/* Live-Indikator */}
<span className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-pulse" />
```

### Pill-Gruppe (Toggle-Filter)

```jsx
<div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-px shadow-sm">
  <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
    bg-slate-100 text-slate-900">  {/* active */}
    Alle
  </button>
  <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
    text-slate-500 hover:text-slate-900">  {/* inactive */}
    Ausgewählte
  </button>
</div>
```

---

## Layout-Struktur

```
┌────────────────────────────────────────────────────┐
│ HEADER  h-[54px]  bg-white  border-b border-slate-200 │
│ px-[22px]  gap-[10px]                               │
├──────┬─────────────────────────────────────────────┤
│ SIDE │  MAIN CONTENT                               │
│ w-16 │  flex-1  px-[22px] py-5                    │
│ bg-  │  overflow-y-auto                            │
│white │                                             │
│      │                                             │
└──────┴─────────────────────────────────────────────┘
```

**Gesamtlayout:** `flex h-screen overflow-hidden bg-slate-50`

**Sidebar (`aside`):**
- `w-16 shrink-0 bg-white border-r border-slate-200`
- `flex flex-col items-center pt-3.5 pb-4 z-50`
- Logo-Button: `w-[38px] h-[38px] bg-blue-600 rounded-[10px]`
- Nav-Items: `w-[42px] h-[42px] rounded-[10px]`, `gap-0.5`

**Header:**
- `h-[54px] flex items-center gap-[10px] px-[22px] shrink-0 z-40`
- Separator: `h-[18px] w-px bg-slate-200`
- Brand-Logo: `text-[20px] font-bold leading-none tracking-tight text-slate-900`

**Hauptinhalt:**
- `flex-1 overflow-y-auto overflow-x-hidden px-[22px] py-5`

---

## Icons (lucide-react)

**Größen:**

| Kontext           | Klasse                          |
|-------------------|---------------------------------|
| Kleine Inline      | `w-4 h-4`                      |
| Header-Buttons    | `w-[13px] h-[13px] shrink-0`    |
| KPI-Badge         | `w-[18px] h-[18px]`             |
| Modal-Header      | `w-6 h-6`                       |
| Spinner           | gleiche Größe + `animate-spin`  |

**Häufig genutzte Icons:**

| Kategorie   | Icons                                                              |
|-------------|--------------------------------------------------------------------|
| Navigation  | `LayoutDashboard`, `User`, `Users`, `ShieldCheck`                  |
| Telefonie   | `Phone`, `PhoneIncoming`, `PhoneOutgoing`                          |
| Aktionen    | `Upload`, `Download`, `RefreshCw`, `Trash2`, `Search`              |
| UI-Controls | `X`, `Check`, `ChevronLeft`, `ChevronRight`, `ArrowLeft`           |
| Status      | `Loader2`, `AlertCircle`, `Eye`, `EyeOff`, `LogOut`               |

Immer `aria-hidden` auf Icon-Elemente setzen wenn rein dekorativ.

---

## Animationen & Übergänge

| Typ                 | Klassen                                   |
|---------------------|-------------------------------------------|
| Farb-Übergang       | `transition-colors`                       |
| Alle Eigenschaften  | `transition-all`                          |
| Komponenten-Eingang | `animate-in fade-in duration-200`         |
| Modal-Eingang       | `animate-in fade-in zoom-in duration-200` |
| Card Hover-Lift     | `hover:-translate-y-px hover:shadow-md`   |
| Live-Puls           | `animate-pulse`                           |
| Lade-Spinner        | `animate-spin`                            |

---

## Fokus & Accessibility

- Immer `focus:outline-none focus:ring-2 focus:ring-blue-500` auf interaktiven Elementen
- Bei Buttons über farbigem Hintergrund: `focus:ring-offset-1` ergänzen
- Icon-Buttons: `aria-label` pflichtmäßig setzen
- Dekorative Icons: `aria-hidden`
- Deaktivierte Elemente: `disabled:opacity-70 disabled:pointer-events-none`

---

## Global CSS (index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
}
```

Keine Custom-Klassen – alles in Tailwind-Utilities.

---

## Tailwind Config

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },  // Standard-Theme – keine Custom-Tokens
  plugins: [],
}
```

---

## Checkliste für neue Komponenten

- [ ] Farben aus der Primärpalette (blue/slate) verwenden
- [ ] `rounded-xl` für Cards, `rounded-lg` für Buttons/Inputs
- [ ] `shadow-sm` als Standard-Elevation, `shadow-2xl` für Modals
- [ ] `border border-slate-200` als Standard-Rahmen
- [ ] `focus:outline-none focus:ring-2 focus:ring-blue-500` auf alle Inputs/Buttons
- [ ] `transition-colors` oder `transition-all` für Hover-States
- [ ] `text-sm` als Standard-Schriftgröße, `text-xs` für Hilfstexte
- [ ] Icons aus `lucide-react`, `aria-hidden` auf dekorative Icons
- [ ] Spacing konsistent mit `px-[22px]` (Content), `p-6` (Cards), `gap-4` (Layouts)
