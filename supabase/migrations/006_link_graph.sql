-- SP16: Link Graph - Tabellen pages + page_links

-- =====================
-- 1. pages
-- =====================
CREATE TABLE pages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,

  name               VARCHAR(255) NOT NULL,
  type               VARCHAR(50) NOT NULL CHECK (type IN ('hub', 'spoke', 'blog')),
  status             VARCHAR(50) NOT NULL DEFAULT 'planned'
                                   CHECK (status IN ('published', 'draft', 'planned')),
  url_slug           VARCHAR(255),
  markdown_file_path TEXT,
  word_count         INT DEFAULT 0,

  -- Persistierte Graph-Position
  position_x         FLOAT,
  position_y         FLOAT,

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_project_id  ON pages(project_id);
CREATE INDEX idx_pages_category_id ON pages(category_id);
CREATE INDEX idx_pages_type        ON pages(type);
CREATE INDEX idx_pages_status      ON pages(status);

-- =====================
-- 2. page_links
-- =====================
CREATE TABLE page_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_page_id      UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  to_page_id        UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

  anchor_text       VARCHAR(500),
  context_sentence  TEXT,
  placement         VARCHAR(100),
  line_number_start INT,
  line_number_end   INT,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Link-Instanzen bleiben getrennt; gleiche Quelle/Ziel/Anchor sind erlaubt,
  -- solange sie an anderer Stelle im Dokument vorkommen.
  UNIQUE(from_page_id, to_page_id, anchor_text, line_number_start, line_number_end)
);

CREATE INDEX idx_page_links_project_id ON page_links(project_id);
CREATE INDEX idx_page_links_from       ON page_links(from_page_id);
CREATE INDEX idx_page_links_to         ON page_links(to_page_id);

-- =====================
-- 3. RLS - pages
-- =====================
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pages of own projects"
  ON pages FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create pages in own projects"
  ON pages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update pages in own projects"
  ON pages FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete pages in own projects"
  ON pages FOR DELETE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

-- =====================
-- 4. RLS - page_links
-- =====================
ALTER TABLE page_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view page_links of own projects"
  ON page_links FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create page_links in own projects"
  ON page_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update page_links in own projects"
  ON page_links FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete page_links in own projects"
  ON page_links FOR DELETE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));
