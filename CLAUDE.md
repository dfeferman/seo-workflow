# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server (proxy /api → localhost:3001)
npm run server:dev       # Express API (tsx watch server/index.ts), port 3001
npm run build            # Type-check (tsc -b) + Vite build + server:build
npm run lint             # ESLint across the project
npm run test             # Vitest watch (src/utils tests, vite.config)
npm run test:run         # Vitest single run (frontend utils)
npm run test:run:server  # Vitest server tests (vitest.server.config.ts, e.g. server/tests/auth.test.ts)
npm run preview          # Preview production build locally
```

Run a single test file:
```bash
npx vitest run src/utils/replacePlaceholders.test.ts
npx vitest run --config vitest.server.config.ts server/tests/auth.test.ts
```

Before committing: `npm run lint && npm run test:run` must both pass (add `npm run test:run:server` when changing `server/`).

## Environment

Create a `.env` in the repo root (not committed; `vite.config.ts` loads it via `dotenv` for dev/tests):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
JWT_SECRET=<mindestens 32 Zeichen in Produktion>
```

Docker Compose: `DB_PASSWORD`, `JWT_SECRET` in `.env`; DB name defaults to `seo_workflow` (`POSTGRES_DB` in `docker-compose.yml`). DB name is also the path segment in `DATABASE_URL` after the host.

## Architecture

**React 18 + TypeScript SPA** (Vite, TanStack Router). **Backend: Express 5** in `server/` with `pg` (`server/db.ts`); the SPA calls **`src/lib/apiClient.ts`** (`/api/*`). Vite proxies `/api` to `http://localhost:3001` (`vite.config.ts`).

### Routing structure
Routes live under `src/routes/` using TanStack Router file-based conventions. The main nested route is:
```
/projects/$projectId/categories/$categoryId/          → WorkflowTable (artifact list)
/projects/$projectId/categories/$categoryId/overview  → DashboardCards (stats)
/projects/$projectId/categories/$categoryId/settings    → CategorySettingsTabs (metadata)
```

### Data layer
- `src/lib/apiClient.ts` — all REST calls to the Express API
- `src/hooks/` — TanStack Query hooks wrapping the API client
- `src/types/database.types.ts` — legacy/typing aid; regenerate if you still sync with Supabase CLI
- `supabase/` — historical migrations/export; **runtime DB** for local/Docker is PostgreSQL with `server/db/schema.sql`, not Supabase Auth

### PostgreSQL schema and drift
- **New DB:** `server/db/schema.sql` is the full baseline (also mounted as Docker `docker-entrypoint-initdb.d` — runs only when the data volume is **empty**).
- **Existing DB:** apply `server/db/migrations/*.sql` manually (e.g. `psql $DATABASE_URL -f server/db/migrations/003_users_updated_at.sql`). If `users.updated_at` is missing, password reset (`server/routes/auth.ts`) fails until `003` is applied.
- Postgres **ERROR** logs for `duplicate key` on `users_email_key` / `test-auth@example.com` are often from **`server/tests/auth.test.ts`** or repeated register; the API returns **409** for duplicate email (`23505`).

### Key business logic in `src/utils/`
- `replacePlaceholders.ts` — substitutes `[KATEGORIE]`, `[ZIELGRUPPEN]`, `[INPUT A]`, etc. in prompt templates. **No `[LAND]` or `[SPRACHE]` placeholders** (intentionally removed). **`[INPUT A]`–`[INPUT X]`** and **`[INPUT A1]`**-style codes (pro Phase) erscheinen in der Map **erst**, wenn für diese Phase **„Phase · Output generieren“** gelaufen ist (`category_phase_outputs`); **`[LINKS]`** erst nach Phase-B-Output. Vorher bleiben die Tokens in der Vorschau sichtbar (`usePlaceholderData`: `buildDependencyMap` + `applyPhaseOutputOverrides`).
- `createDefaultArtifacts.ts` — generates 18 default artifacts for a `category` type or 12 for a `blog` type when a new category is created.
- `exportCategory.ts` — exports all artifacts + results as Markdown.

These three utils have corresponding `.test.ts` files. Coverage is configured for `src/utils/**/*.ts` with 80% thresholds (statements, functions, lines) and 70% branches.

### Database schema (reference)
Core tables mirror the app domain: `users` → `projects` → `categories` → `artifacts` → `artifact_results`, plus `templates`, refresh/password-reset tokens, etc. See `server/db/schema.sql`. Older Supabase-oriented DDL lives under `supabase/migrations/` for comparison/migration work.

### Design system
All colors use CSS custom properties mapped to Tailwind tokens (defined in `tailwind.config.js`). Use only Tailwind classes — no inline styles. Light theme only. Fonts: **Figtree** (sans), **Fraunces** (display), monospace for prompts. Phase badges A–F use fixed colors (`phase-a` through `phase-f` in the Tailwind config).

### HTML prototypes
`html-referenz/` contains static HTML prototypes for all major screens. Use them as design references. **Ignore any "Markt & Sprache" sections** — those fields were intentionally removed from the schema and UI.

### Path alias
`@/` resolves to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
