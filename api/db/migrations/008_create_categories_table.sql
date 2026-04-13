-- Migration: 008_create_categories_table.sql
-- Created: 2026-04-13
-- Purpose: Create categories table and update xassidas to reference categories

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#666666',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add categorie_id column to xassidas (keeping the old categorie column for backward compatibility)
ALTER TABLE xassidas ADD COLUMN IF NOT EXISTS categorie_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_xassidas_categorie_id ON xassidas(categorie_id);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_index ASC);

-- Create trigger for categories updated_at
CREATE TRIGGER IF NOT EXISTS update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description, color, order_index) VALUES
  (E'Eloge du Prophète', E'Xassidas célébrant le Prophète Muhammad', '#FFB347', 1),
  (E'Louange à Dieu', E'Xassidas de louange et gratitude', '#98FB98', 2),
  ('Invocation', 'Xassidas et invocations spirituelles', '#87CEEB', 3),
  (E'Sagesse', E'Xassidas d''enseignement et sagesse spirituelle', '#DDA0DD', 4),
  (E'Autre', E'Autres catégories', '#D3D3D3', 5)
ON CONFLICT (name) DO NOTHING;
