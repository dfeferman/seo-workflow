-- Phase Output Templates & Category Phase Outputs
-- phase_output_templates: globale Output-Vorlagen pro Phase (pro User, eine pro Phase)
-- category_phase_outputs: kompilierte Outputs pro Kategorie + Phase (versioniert)

-- 1. phase_output_templates
CREATE TABLE phase_output_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase       CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  template_text TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phase)
);

COMMENT ON TABLE phase_output_templates IS 'Globale Output-Vorlagen pro Phase. Platzhalter [A1], [B2.1] etc. werden beim Kompilieren mit Artefakt-Ergebnissen befüllt.';
COMMENT ON COLUMN phase_output_templates.template_text IS 'Markdown-Vorlage mit [artifact_code]-Platzhaltern, z.B. ## SERP-Analyse\n[A1]\n\n## Keyword-Daten\n[A4]';

CREATE INDEX idx_phase_output_templates_user_id ON phase_output_templates(user_id);

-- 2. category_phase_outputs
CREATE TABLE category_phase_outputs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  phase       CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  output_text TEXT,
  version     INT NOT NULL DEFAULT 1,
  status      result_status NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE category_phase_outputs IS 'Kompilierte Phase-Outputs pro Kategorie. Jede Neugenerierung erzeugt eine neue Version.';
COMMENT ON COLUMN category_phase_outputs.output_text IS 'Befüllte Vorlage – ersetzt [artifact_code]-Platzhalter mit den finalen Artefakt-Ergebnissen.';

CREATE INDEX idx_category_phase_outputs_category_id ON category_phase_outputs(category_id);
CREATE INDEX idx_category_phase_outputs_lookup ON category_phase_outputs(category_id, phase, version DESC);

-- ----------
-- RLS
-- ----------

-- phase_output_templates: Zugriff über user_id
ALTER TABLE phase_output_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phase output templates"
  ON phase_output_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own phase output templates"
  ON phase_output_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phase output templates"
  ON phase_output_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phase output templates"
  ON phase_output_templates FOR DELETE
  USING (auth.uid() = user_id);

-- category_phase_outputs: Zugriff über Kategorie -> Projekt -> User
ALTER TABLE category_phase_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view phase outputs of own categories"
  ON category_phase_outputs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_phase_outputs.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create phase outputs in own categories"
  ON category_phase_outputs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_phase_outputs.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update phase outputs in own categories"
  ON category_phase_outputs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_phase_outputs.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete phase outputs in own categories"
  ON category_phase_outputs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = category_phase_outputs.category_id AND p.user_id = auth.uid()
  ));
