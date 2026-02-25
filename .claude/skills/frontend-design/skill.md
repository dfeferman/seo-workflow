---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

---

## Verwendung

- **UI prüfen:** „Review my UI“, „Check accessibility“, „Audit design“, „Review UX“
- **Zweck:** Code an Web Interface Guidelines, Barrierefreiheit und konsistente UX prüfen

---

## Web Design Guidelines (Kurzreferenz)

### Allgemein

- **Zweck & Zielgruppe** vor dem Umsetzen klären (Design Thinking).
- **Konsistenz:** Einheitliche Farben, Typo, Abstände, Komponenten (z. B. Tailwind-Klassen).
- **Hierarchie:** Klare visuelle Hierarchie (Überschriften, Gewichtung, Kontrast).

### Barrierefreiheit (Accessibility)

- **Kontrast:** Ausreichender Kontrast (z. B. WCAG 2.1 Level AA).
- **Fokus:** Sichtbare Fokus-Indikatoren für Tastaturbedienung.
- **Semantik:** Sinnvolle HTML-Struktur (`heading`, `main`, `nav`, `button` vs. `div`).
- **Labels:** Formulare mit `<label>`, Buttons mit verständlichem Text/`aria-label`.
- **Fehlermeldungen:** Fehler klar zuordenbar und lesbar (Screenreader).

### UX

- **Feedback:** Loading- und Erfolgs-/Fehler-States für Aktionen.
- **Fehlerbehandlung:** Verständliche Meldungen, ggf. Hinweise zur Behebung.
- **Mobile:** Touch-Ziele groß genug, lesbare Schrift, kein reines Hover-UI.

### Technik (z. B. React / Vite)

- **Wiederverwendung:** Gemeinsame Komponenten statt Duplikate.
- **Zustand:** Vorhersehbare State-Updates, keine unnötigen Re-Renders.
- **Performance:** Lazy Loading, schlanke Bundles, sinnvolle Abhängigkeiten.


## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

