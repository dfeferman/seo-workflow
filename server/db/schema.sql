-- Enums
CREATE TYPE content_type AS ENUM ('category', 'blog');
CREATE TYPE result_status AS ENUM ('draft', 'final');

-- 1. users (ersetzt auth.users)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. projects
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- 3. categories
CREATE TABLE categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id           UUID REFERENCES categories(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  type                content_type NOT NULL DEFAULT 'category',
  hub_name            VARCHAR(255),
  zielgruppen         TEXT[],
  shop_typ            VARCHAR(100),
  usps                TEXT,
  ton                 TEXT,
  no_gos              TEXT,
  display_order       INT DEFAULT 0,
  custom_placeholders JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_project_id ON categories(project_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- 4. artifacts
CREATE TABLE artifacts (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id                UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  phase                      CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  artifact_code              VARCHAR(10) NOT NULL,
  name                       VARCHAR(255) NOT NULL,
  description                TEXT,
  prompt_template            TEXT NOT NULL,
  recommended_source         VARCHAR(50),
  estimated_duration_minutes INT,
  display_order              INT DEFAULT 0,
  template_id                UUID,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, artifact_code)
);
CREATE INDEX idx_artifacts_category_id ON artifacts(category_id);
CREATE INDEX idx_artifacts_phase ON artifacts(phase);

-- 5. artifact_results
CREATE TABLE artifact_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  result_text TEXT,
  source      VARCHAR(50),
  version     INT DEFAULT 1,
  status      result_status DEFAULT 'draft',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_artifact_results_artifact_id ON artifact_results(artifact_id);
CREATE INDEX idx_artifact_results_version ON artifact_results(artifact_id, version DESC);

-- 6. artifact_dependencies
CREATE TABLE artifact_dependencies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id             UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_artifact_id  UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_phase        CHAR(1),
  placeholder_name        VARCHAR(50) NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (depends_on_artifact_id IS NOT NULL AND depends_on_phase IS NULL) OR
    (depends_on_artifact_id IS NULL AND depends_on_phase IS NOT NULL)
  )
);
CREATE INDEX idx_artifact_dependencies_artifact_id ON artifact_dependencies(artifact_id);

-- 7. templates
CREATE TABLE templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  phase           CHAR(1) NOT NULL,
  artifact_code   VARCHAR(10),
  prompt_template TEXT NOT NULL,
  tags            TEXT[],
  usage_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_phase ON templates(phase);

-- 8. phase_output_templates
CREATE TABLE phase_output_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase         CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  template_text TEXT NOT NULL DEFAULT '',
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phase)
);
CREATE INDEX idx_phase_output_templates_user_id ON phase_output_templates(user_id);

-- 9. category_phase_outputs
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
CREATE INDEX idx_category_phase_outputs_category_id ON category_phase_outputs(category_id);
CREATE INDEX idx_category_phase_outputs_lookup ON category_phase_outputs(category_id, phase, version DESC);

-- 10. category_reference_docs
CREATE TABLE category_reference_docs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_category_reference_docs_category_id ON category_reference_docs(category_id);
