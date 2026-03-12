-- Optional reference from artifact to template (for sync when template is updated).
-- Existing artifacts keep template_id NULL.

ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_artifacts_template_id ON artifacts(template_id);
