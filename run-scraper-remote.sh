#!/bin/bash

# Helper script to run scraper on remote server
# Usage: ./run-scraper-remote.sh <server>

SERVER="${1:-root@165.245.211.201}"

echo "🚀 Running scraper on $SERVER..."
echo ""

ssh $SERVER << 'EOF'
  cd /root/malikina
  docker compose -f docker-compose.deploy.yml exec malikina-api npm run scrape
EOF

echo ""
echo "✅ Scraper complete"
