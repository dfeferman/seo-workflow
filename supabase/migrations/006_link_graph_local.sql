-- SP16: Link Graph - Tabellen pages + page_links (lokales PostgreSQL, kein Supabase RLS)

-- =====================
-- 1. pages
-- =====================
CREATE TABLE IF NOT EXISTS pages (
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

  position_x         FLOAT,
  position_y         FLOAT,

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_project_id  ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_category_id ON pages(category_id);
CREATE INDEX IF NOT EXISTS idx_pages_type        ON pages(type);
CREATE INDEX IF NOT EXISTS idx_pages_status      ON pages(status);

-- =====================
-- 2. page_links
-- =====================
CREATE TABLE IF NOT EXISTS page_links (
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

  UNIQUE(from_page_id, to_page_id, anchor_text, line_number_start, line_number_end)
);

CREATE INDEX IF NOT EXISTS idx_page_links_project_id ON page_links(project_id);
CREATE INDEX IF NOT EXISTS idx_page_links_from       ON page_links(from_page_id);
CREATE INDEX IF NOT EXISTS idx_page_links_to         ON page_links(to_page_id);
