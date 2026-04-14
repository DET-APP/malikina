-- Fix missing columns from migration 007 if they were skipped
-- This is a safe idempotent migration that only adds missing columns

BEGIN;

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verses' AND column_name = 'chapter_number'
    ) THEN
        ALTER TABLE verses ADD COLUMN chapter_number INTEGER DEFAULT 1;
        RAISE NOTICE 'Added chapter_number column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verses' AND column_name = 'verse_key'
    ) THEN
        ALTER TABLE verses ADD COLUMN verse_key VARCHAR(50);
        RAISE NOTICE 'Added verse_key column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verses' AND column_name = 'text_arabic'
    ) THEN
        ALTER TABLE verses ADD COLUMN text_arabic TEXT;
        RAISE NOTICE 'Added text_arabic column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verses' AND column_name = 'transcription'
    ) THEN
        ALTER TABLE verses ADD COLUMN transcription TEXT;
        RAISE NOTICE 'Added transcription column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verses' AND column_name = 'words'
    ) THEN
        ALTER TABLE verses ADD COLUMN words TEXT;
        RAISE NOTICE 'Added words column';
    END IF;
END $$;

-- Populate text_arabic from content_ar or content if empty
UPDATE verses SET text_arabic = COALESCE(content_ar, content) WHERE text_arabic IS NULL;

-- Populate verse_key from chapter_number and verse_number if empty
UPDATE verses SET verse_key = chapter_number::TEXT || ':' || verse_number::TEXT WHERE verse_key IS NULL;

COMMIT;
