-- SEO Workflow Platform – Initial Schema
-- Enums zuerst (für Tabellen-Referenzen)

CREATE TYPE content_type AS ENUM ('category', 'blog');

CREATE TYPE result_status AS ENUM ('draft', 'final');

-- 1. projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- 2. categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type content_type NOT NULL DEFAULT 'category',
  hub_name VARCHAR(255),
  zielgruppen TEXT[],
  shop_typ VARCHAR(100),
  usps TEXT,
  ton TEXT,
  no_gos TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_project_id ON categories(project_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- 3. artifacts
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  phase CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  artifact_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  recommended_source VARCHAR(50),
  estimated_duration_minutes INT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, artifact_code)
);

CREATE INDEX idx_artifacts_category_id ON artifacts(category_id);
CREATE INDEX idx_artifacts_phase ON artifacts(phase);

-- 4. artifact_results
CREATE TABLE artifact_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  result_text TEXT,
  source VARCHAR(50),
  version INT DEFAULT 1,
  status result_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifact_results_artifact_id ON artifact_results(artifact_id);
CREATE INDEX idx_artifact_results_version ON artifact_results(artifact_id, version DESC);

-- 5. artifact_dependencies
CREATE TABLE artifact_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_phase CHAR(1),
  placeholder_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (depends_on_artifact_id IS NOT NULL AND depends_on_phase IS NULL) OR
    (depends_on_artifact_id IS NULL AND depends_on_phase IS NOT NULL)
  )
);

CREATE INDEX idx_artifact_dependencies_artifact_id ON artifact_dependencies(artifact_id);

-- 6. templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phase CHAR(1) NOT NULL,
  artifact_code VARCHAR(10),
  prompt_template TEXT NOT NULL,
  tags TEXT[],
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_phase ON templates(phase);

-- ----------
-- RLS
-- ----------

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE USING (auth.uid() = user_id);

-- categories: Zugriff nur über eigenes Projekt
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of own projects"
  ON categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = categories.project_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can create categories in own projects"
  ON categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = categories.project_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update categories in own projects"
  ON categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = categories.project_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete categories in own projects"
  ON categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = categories.project_id AND p.user_id = auth.uid()));

-- artifacts: Zugriff nur über Kategorie -> Projekt -> User
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view artifacts of own categories"
  ON artifacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = artifacts.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create artifacts in own categories"
  ON artifacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = artifacts.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update artifacts in own categories"
  ON artifacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = artifacts.category_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete artifacts in own categories"
  ON artifacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM categories c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = artifacts.category_id AND p.user_id = auth.uid()
  ));

-- artifact_results
ALTER TABLE artifact_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view results of own artifacts"
  ON artifact_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM artifacts a
    JOIN categories c ON c.id = a.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE a.id = artifact_results.artifact_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create results for own artifacts"
  ON artifact_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM artifacts a
    JOIN categories c ON c.id = a.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE a.id = artifact_results.artifact_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update results of own artifacts"
  ON artifact_results FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM artifacts a
    JOIN categories c ON c.id = a.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE a.id = artifact_results.artifact_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete results of own artifacts"
  ON artifact_results FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM artifacts a
    JOIN categories c ON c.id = a.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE a.id = artifact_results.artifact_id AND p.user_id = auth.uid()
  ));

-- artifact_dependencies
ALTER TABLE artifact_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dependencies of own artifacts"
  ON artifact_dependencies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM artifacts a
    JOIN categories c ON c.id = a.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE a.id = artifact_dependencies.artifact_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage dependencies of own artifacts"
  ON artifact_dependencies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM artifacts a
    JOIN categories c ON c.id = a.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE a.id = artifact_dependencies.artifact_id AND p.user_id = auth.uid()
  ));

-- templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON templates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE USING (auth.uid() = user_id);
