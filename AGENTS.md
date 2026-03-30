# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the Vite + React frontend: `components/` for UI, `hooks/` for data/state helpers, `routes/` for TanStack Router route files, `utils/` for pure helpers, and `types/` for shared types. `server/` contains the Express API, route handlers, middleware, services, and SQL schema/migrations. Static files live in `public/`, deployment and container files in `docker/`, and Supabase reference SQL in `supabase/`. Project notes and runbooks are kept in `docs/`.

## Build, Test, and Development Commands
Use `npm run dev` to start the frontend on Vite. Use `npm run server:dev` to run the backend with hot reload on port `3001`. `npm run build` builds the frontend and then compiles the server. `npm run lint` runs ESLint across the repo. `npm run test` starts Vitest in watch mode, `npm run test:run` runs frontend tests once, and `npm run test:run:server` runs the backend suite from `server/tests/`.

## Coding Style & Naming Conventions
This repo uses TypeScript with ESM imports, React function components, and Tailwind utility classes. Follow the existing style: 2-space indentation, no semicolons, and small typed helpers over inline complex logic. Use `PascalCase` for components (`CreateArtifactWizard.tsx`), `camelCase` for hooks and utilities (`useProjects.ts`, `replacePlaceholders.ts`), and TanStack-style route filenames under `src/routes/`. Prefer the `@/` alias for frontend imports from `src/`.

## Testing Guidelines
Frontend tests live next to the code as `*.test.ts` or `*.test.tsx`; backend tests live in `server/tests/`. Vitest is used for both, with Supertest for API coverage. Current coverage thresholds in `vite.config.ts` apply to `src/utils/**/*.ts`: 80% statements/functions/lines and 70% branches. Run `npm run test:run -- --coverage` before merging utility-heavy changes.

## Commit & Pull Request Guidelines
Recent history uses short conventional prefixes such as `feat:`, `merge:`, and focused imperative summaries. Keep commits scoped and descriptive, especially for schema or auth changes. Pull requests should include a brief problem/solution summary, linked issue if available, test evidence (`npm run lint`, relevant Vitest command), and screenshots for visible UI changes.

## Security & Configuration Tips
Copy values from `.env.example` and keep real secrets only in local `.env`. `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, and container-related variables must be set before running auth or integration tests. Husky runs `npm run test:run` on pre-commit, so keep the frontend suite passing before committing.
