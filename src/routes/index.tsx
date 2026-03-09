import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-auto min-h-[400px]">
      <div className="flex-1 px-8 py-6 max-w-2xl mx-auto w-full min-h-0">
        <div className="rounded-xl border border-slate-100 bg-white p-8 hover:border-slate-200 hover:shadow-sm transition-all">
          <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">
            SEO Workflow Platform
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Willkommen. Wähle ein Projekt in der Sidebar oder lege ein neues an.
          </p>
          <p className="text-sm text-slate-500">
            Wenn du noch keine Projekte siehst: In Supabase unter <strong>Authentication</strong> einen User anlegen und danach das <code className="text-2xs bg-slate-100 px-1 rounded">seed.sql</code> im SQL-Editor ausführen – dann erscheint das Demo-Projekt „Medizinprodukte-Shop“.
          </p>
        </div>
      </div>
    </main>
  )
}
