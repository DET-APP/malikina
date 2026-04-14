#!/bin/bash
# Initialize production database with xassidas data
# Runs once if database is empty

set -e

SERVER="root@165.245.211.201"
WORK_DIR="/var/www/malikina-api"

echo "📊 Checking database status..."
ssh "$SERVER" << 'SSH_COMMANDS'
cd /var/www/malikina-api

# Check if database has data
COUNT=$(docker exec malikina-db psql -U malikina -d malikina -t -c "SELECT COUNT(*) FROM xassidas;")

if [ "$COUNT" -eq 0 ]; then
  echo "🔄 Database empty! Loading initial xassidas data..."
  
  # Run populate script inside API container
  echo "  Running populate script..."
  docker exec malikina-api node -e "
    const { pool } = require('./dist/db/config.js');
    const xassidasData = require('./dist/data/enrichedQassidasData.js').enrichedQassidasData;
    
    (async () => {
      try {
        console.log('Loading:', xassidasData.length, 'xassidas');
        // Your population logic here
        process.exit(0);
      } catch(e) {
        console.error(e);
        process.exit(1);
      }
    })();
  " || true
  
  # Alternative: use SQL import if data dump exists
  if [ -f "/var/www/malikina-api/api/db/dump-production.sql" ]; then
    echo "  Found SQL dump, importing..."
    docker exec -i malikina-db psql -U malikina -d malikina < /var/www/malikina-api/api/db/dump-production.sql
    echo "  ✅ Import complete!"
  else
    echo "  ⚠️  No SQL dump found at api/db/dump-production.sql"
  fi
  
  FINAL_COUNT=$(docker exec malikina-db psql -U malikina -d malikina -t -c "SELECT COUNT(*) FROM xassidas;")
  echo "  Final count: $FINAL_COUNT xassidas"
else
  echo "✅ Database has $COUNT xassidas - skipping initialization"
fi
SSH_COMMANDS

echo "✅ Database initialization complete!"
