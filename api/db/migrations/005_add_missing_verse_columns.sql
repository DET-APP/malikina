-- Add missing verse columns
ALTER TABLE verses
ADD COLUMN IF NOT EXISTS chapter_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS verse_key VARCHAR(50),
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS words TEXT;

-- Update verse_key for existing records
UPDATE verses SET verse_key = chapter_number || ':' || verse_number WHERE verse_key IS NULL;
