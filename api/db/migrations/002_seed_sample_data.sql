-- Migration: 002_seed_sample_data.sql
-- Created: 2026-04-10
-- Purpose: Seed sample data for testing

-- Insert sample authors
INSERT INTO authors (name, full_name, arabic, description, tradition) VALUES
('cheikh-anta-diop', 'Cheikh Anta Diop', 'الشيخ انطا ديوب', 'Savant sénégalais', 'Tidjane'),
('babacar-sy', 'Babacar Sy', 'بابا كار سي', 'Auteur xassidas célèbre', 'Tidjane'),
('coumba-sylla', 'Coumba Sylla', 'كومبا سيلا', 'Poète traditionnel', 'Tidjane')
ON CONFLICT (name) DO NOTHING;

-- Insert sample xassidas
INSERT INTO xassidas (title, author_id, description, verse_count, categorie) 
SELECT 'Tamurul Layali', authors.id, 'Une célèbre xassida tidjane', 10, 'spirituelle'
FROM authors WHERE name = 'cheikh-anta-diop'
ON CONFLICT DO NOTHING;

INSERT INTO xassidas (title, author_id, description, verse_count, categorie)
SELECT 'Ya Rabilanah', authors.id, 'Xassida de louange', 8, 'louange'
FROM authors WHERE name = 'babacar-sy'
ON CONFLICT DO NOTHING;
