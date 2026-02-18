-- Platzhalter pro Oberkategorie (Hub): gültig für Hub und alle Unterkategorien.
-- Key = Platzhalter-Name (z. B. [MEIN_TAG]), Value = Ersetzungstext.
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS custom_placeholders JSONB DEFAULT '{}';

COMMENT ON COLUMN categories.custom_placeholders IS 'Benutzerdefinierte Platzhalter (Key/Value) der Oberkategorie; in Unterkategorien wird die Oberkategorie verwendet.';
