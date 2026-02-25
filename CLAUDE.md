# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server with hot reload
npm run build        # Type-check (tsc -b) + Vite production build
npm run lint         # ESLint across the project
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run (CI)
npm run preview      # Preview production build locally
```

Run a single test file:
```bash
npx vitest run src/utils/replacePlaceholders.test.ts
```

Before committing: `npm run lint && npm run test:run` must both pass.

## Environment

Create a `.env.local` (not committed) with:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Architecture

**React 18 + TypeScript SPA** built with Vite. Routing via TanStack Router (file-based, auto-generates `src/routeTree.gen.ts` — do not edit manually). Data fetching via TanStack Query. Supabase (PostgreSQL + Auth) as the backend.

### Routing structure
Routes live under `src/routes/` using TanStack Router file-based conventions. The main nested route is:
```
/projects/$projectId/categories/$categoryId/          → WorkflowTable (artifact list)
/projects/$projectId/categories/$categoryId/overview  → DashboardCards (stats)
/projects/$projectId/categories/$categoryId/settings  → CategorySettingsTabs (metadata)
```

### Data layer
- `src/lib/supabase.ts` — single Supabase client instance
- `src/types/database.types.ts` — generated DB types (regenerate with Supabase CLI after schema changes)
- `src/hooks/` — one custom TanStack Query hook per entity (e.g. `useArtifacts`, `useCategories`)
- All Supabase tables have RLS enabled; user data is always scoped to `auth.uid()`

### Key business logic in `src/utils/`
- `replacePlaceholders.ts` — substitutes `[KATEGORIE]`, `[ZIELGRUPPEN]`, `[INPUT A]`, etc. in prompt templates. **No `[LAND]` or `[SPRACHE]` placeholders** (intentionally removed).
- `createDefaultArtifacts.ts` — generates 18 default artifacts for a `category` type or 12 for a `blog` type when a new category is created.
- `exportCategory.ts` — exports all artifacts + results as Markdown.

These three utils have corresponding `.test.ts` files. Coverage is configured for `src/utils/**/*.ts` with 80% thresholds (statements, functions, lines) and 70% branches.

### Database schema (Supabase)
Core tables: `projects` → `categories` (Hub/Spoke via self-referential `parent_id`) → `artifacts` → `artifact_results`. Supporting: `artifact_dependencies`, `templates`. Migrations are in `supabase/migrations/`.

### Design system
All colors use CSS custom properties mapped to Tailwind tokens (defined in `tailwind.config.js`). Use only Tailwind classes — no inline styles. Light theme only. Fonts: **Figtree** (sans), **Fraunces** (display), monospace for prompts. Phase badges A–F use fixed colors (`phase-a` through `phase-f` in the Tailwind config).

### HTML prototypes
`html-referenz/` contains static HTML prototypes for all major screens. Use them as design references. **Ignore any "Markt & Sprache" sections** — those fields were intentionally removed from the schema and UI.

### Path alias
`@/` resolves to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
