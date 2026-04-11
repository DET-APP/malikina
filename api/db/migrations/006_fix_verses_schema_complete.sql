-- Drop old verses table to rebuild with proper schema
DROP TABLE IF EXISTS verses CASCADE;

-- Create proper verses table with all required fields
CREATE TABLE verses (
  id SERIAL PRIMARY KEY,
  xassida_id INTEGER NOT NULL REFERENCES xassidas(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL DEFAULT 1,
  verse_number INTEGER NOT NULL,
  verse_key VARCHAR(50) NOT NULL,
  text_arabic TEXT NOT NULL,
  transcription TEXT,
  translation_fr TEXT,
  translation_en TEXT,
  words TEXT,
  audio_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(xassida_id, verse_key),
  INDEX idx_verses_xassida_id (xassida_id),
  INDEX idx_verses_verse_key (verse_key)
);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_verses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verses_update_trigger
BEFORE UPDATE ON verses
FOR EACH ROW
EXECUTE FUNCTION update_verses_updated_at();
