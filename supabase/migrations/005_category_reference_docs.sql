-- Referenz-Dokumente (.md) pro Kategorie

CREATE TABLE category_reference_docs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  display_order INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE category_reference_docs IS 'Markdown-Referenzdokumente pro Kategorie (Guidelines, Briefings etc.), z.B. für Copy-&-Paste in externe Chat-UIs.';
COMMENT ON COLUMN category_reference_docs.title IS 'Anzeigename / Dateiname des Referenzdokuments (z.B. \"Guidelines.md\").';

CREATE INDEX idx_category_reference_docs_category_id ON category_reference_docs(category_id);

-- ----------
-- RLS
-- ----------

ALTER TABLE category_reference_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reference docs of own categories"
  ON category_reference_docs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_reference_docs.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create reference docs in own categories"
  ON category_reference_docs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_reference_docs.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update reference docs in own categories"
  ON category_reference_docs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_reference_docs.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete reference docs in own categories"
  ON category_reference_docs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_reference_docs.category_id AND p.user_id = auth.uid()
  ));

