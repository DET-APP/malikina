#!/bin/bash

# Database connection
HOST="${DB_HOST:-localhost}"
PORT="${DB_PORT:-5432}"
USER="${DB_USER:-malikina}"
DB="${DB_NAME:-malikina}"

echo "🗑️  Dropping all tables from database: $DB"

PGPASSWORD=$DB_PASSWORD psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" << EOF
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS prayer_times CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS verses CASCADE;
DROP TABLE IF EXISTS xassidas CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

\dt
EOF

echo "✅ Database reset complete"
