#!/bin/bash
set -e

SERVER="root@165.245.211.201"
KEY="$HOME/.ssh/id_ed25519"

echo "=== Connexion au serveur ==="
ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" 'bash -s' << 'REMOTE'
set -e

echo "--- Étape 1: Création de la table verses ---"
docker exec -i malikina-db psql -U malikina -d malikina << 'SQL'
DROP TABLE IF EXISTS verses CASCADE;
CREATE TABLE verses (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_verses_xassida_id ON verses(xassida_id);
SQL
echo "✓ Table créée"

echo "--- Étape 2: Import des données ---"
docker exec -i malikina-db psql -U malikina -d malikina < /root/verses_data_only.sql
echo "✓ Import terminé"

echo "--- Étape 3: Vérification ---"
docker exec malikina-db psql -U malikina -d malikina -c "SELECT COUNT(*) as total_verses FROM verses;"
docker exec malikina-db psql -U malikina -d malikina -c "SELECT xassida_id, COUNT(*) as verses FROM verses GROUP BY xassida_id ORDER BY xassida_id LIMIT 15;"

echo ""
echo "✅ Terminé !"
REMOTE
