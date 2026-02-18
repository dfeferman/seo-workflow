import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-auto min-h-[400px]">
      <div className="flex-1 p-8 max-w-2xl mx-auto w-full min-h-0">
        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-text mb-2">
            SEO Workflow Platform
          </h1>
          <p className="text-text-secondary mb-6">
            Willkommen. Wähle ein Projekt in der Sidebar oder lege ein neues an.
          </p>
          <p className="text-sm text-muted">
            Wenn du noch keine Projekte siehst: In Supabase unter <strong>Authentication</strong> einen User anlegen und danach das <code className="text-2xs bg-surface-2 px-1 rounded">seed.sql</code> im SQL-Editor ausführen – dann erscheint das Demo-Projekt „Medizinprodukte-Shop“.
          </p>
        </div>
      </div>
    </main>
  )
}
