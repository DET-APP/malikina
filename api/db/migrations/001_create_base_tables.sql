-- Migration: 001_create_base_tables.sql
-- Created: 2026-04-10
-- Purpose: Create base tables for Malikina API

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  arabic VARCHAR(255),
  description TEXT,
  photo_url VARCHAR(500),
  tradition VARCHAR(100),
  birth_year INTEGER,
  death_year INTEGER,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Xassidas (Qassidas) table
CREATE TABLE IF NOT EXISTS xassidas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  description TEXT,
  verse_count INTEGER DEFAULT 0,
  audio_url VARCHAR(500),
  youtube_id VARCHAR(255),
  arabic_name VARCHAR(255),
  categorie VARCHAR(100),
  surah_reference VARCHAR(100),
  theme VARCHAR(100),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- Verses (Ayat) table
CREATE TABLE IF NOT EXISTS verses (
  id SERIAL PRIMARY KEY,
  xassida_id INTEGER NOT NULL REFERENCES xassidas(id) ON DELETE CASCADE,
  verse_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_ar TEXT,
  translation_fr TEXT,
  translation_en TEXT,
  audio_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (xassida_id) REFERENCES xassidas(id) ON DELETE CASCADE
);

-- Translations table
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  xassida_id INTEGER NOT NULL REFERENCES xassidas(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (xassida_id) REFERENCES xassidas(id) ON DELETE CASCADE,
  UNIQUE(xassida_id, language)
);

-- User favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  xassida_id INTEGER NOT NULL REFERENCES xassidas(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (xassida_id) REFERENCES xassidas(id) ON DELETE CASCADE,
  UNIQUE(user_id, xassida_id)
);

-- Prayer times cache table
CREATE TABLE IF NOT EXISTS prayer_times (
  id SERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  fajr TIME,
  sunrise TIME,
  dhuhr TIME,
  asr TIME,
  sunset TIME,
  maghrib TIME,
  isha TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(city, date)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  user_id VARCHAR(255),
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_xassidas_author_id ON xassidas(author_id);
CREATE INDEX IF NOT EXISTS idx_verses_xassida_id ON verses(xassida_id);
CREATE INDEX IF NOT EXISTS idx_translations_xassida_id ON translations(xassida_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_xassida_id ON favorites(xassida_id);
CREATE INDEX IF NOT EXISTS idx_prayer_times_city_date ON prayer_times(city, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_xassidas_updated_at BEFORE UPDATE ON xassidas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verses_updated_at BEFORE UPDATE ON verses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayer_times_updated_at BEFORE UPDATE ON prayer_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
