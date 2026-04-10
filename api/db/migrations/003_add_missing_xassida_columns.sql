-- Migration: 003_add_missing_xassida_columns.sql
-- Purpose: Add missing columns to xassidas table if they don't exist

-- Check and add arabic_name column
ALTER TABLE xassidas ADD COLUMN IF NOT EXISTS arabic_name VARCHAR(255);

-- Check and add audio_url column
ALTER TABLE xassidas ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);

-- Check and add youtube_id column
ALTER TABLE xassidas ADD COLUMN IF NOT EXISTS youtube_id VARCHAR(255);

-- Check and add categorie column
ALTER TABLE xassidas ADD COLUMN IF NOT EXISTS categorie VARCHAR(100);

-- Check and add verse_count column
ALTER TABLE xassidas ADD COLUMN IF NOT EXISTS verse_count INTEGER DEFAULT 0;

-- Set default categorie for existing records
UPDATE xassidas SET categorie = 'Autre' WHERE categorie IS NULL;

COMMIT;
