-- Add missing columns to verses table (without dropping data)
ALTER TABLE verses
ADD COLUMN IF NOT EXISTS chapter_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS verse_key VARCHAR(50),
ADD COLUMN IF NOT EXISTS text_arabic TEXT,
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS words TEXT;

-- Migrate existing data from content_ar → text_arabic
UPDATE verses SET text_arabic = COALESCE(content_ar, content) WHERE text_arabic IS NULL;

-- Generate verse_key if not set
UPDATE verses SET verse_key = chapter_number || ':' || verse_number WHERE verse_key IS NULL;

-- Add indexes if not exist
CREATE INDEX IF NOT EXISTS idx_verses_xassida_id ON verses(xassida_id);
CREATE INDEX IF NOT EXISTS idx_verses_verse_key ON verses(verse_key);

-- Add unique constraint
ALTER TABLE verses ADD CONSTRAINT unique_verse_key UNIQUE(xassida_id, verse_key) WHERE verse_key IS NOT NULL ON CONFLICT DO NOTHING;
