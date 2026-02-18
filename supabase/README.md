# Supabase – SEO Workflow Platform

## Migration & Seed ausführen

### Option A: Supabase Dashboard (SQL Editor)

1. **Migration**: [Supabase Dashboard](https://supabase.com/dashboard) → dein Projekt → **SQL Editor**.
   - Inhalt von `migrations/001_initial_schema.sql` einfügen und **Run** ausführen.

2. **Seed** (optional, nach erstem User):
   - In **Authentication → Users** mindestens einen User anlegen (z. B. Sign-up testen).
   - Im SQL Editor den Inhalt von `seed.sql` einfügen und **Run** ausführen.
   - Legt an: 1 Demo-Projekt „Medizinprodukte-Shop“, 3 Kategorien, 4 Unterkategorien, 18 Artefakte, 3 Templates.

### Option B: Supabase CLI

```bash
supabase link --project-ref tkkemleubrajawxsdktp
supabase db push
# Seed: Inhalt von seed.sql im Dashboard ausführen (benötigt auth.users-Eintrag).
```

---

**Hinweis:** Die `.env` im Projektroot enthält `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` und ist in `.gitignore` – nicht committen.
