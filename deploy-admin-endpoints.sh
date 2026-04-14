#!/bin/bash
# Deploy admin endpoints to production
# This script ensures the latest code is deployed with admin endpoints (rescrape, stats, integrity-check)

set -e

SERVER="root@165.245.211.201"
WORK_DIR="/var/www/malikina-api"
COMPOSE_FILE="docker-compose.deploy.yml"
API_URL="https://165-245-211-201.sslip.io"

echo "🚀 Deploying Malikina Admin Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Update local git
echo "📥 Fetching latest from GitHub..."
cd "$(dirname "$0")"
git fetch origin
git log --oneline -1 origin/dev

# Step 2: Verify branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "✅ Current branch: $CURRENT_BRANCH"

# Step 3: SSH and update server code
echo "📤 Updating server code..."
ssh "$SERVER" << 'SSH_COMMANDS'
cd /var/www/malikina-api
echo "  Stashing local changes..."
git stash
echo "  Fetching latest..."
git fetch origin
echo "  Checking out dev..."
git checkout dev
echo "  Pulling latest..."
git pull origin dev
echo "  Latest commit:"
git log --oneline -1
SSH_COMMANDS

# Step 4: Clean Docker (remove old containers)
echo "🧹 Cleaning Docker..."
ssh "$SERVER" << 'SSH_COMMANDS'
cd /var/www/malikina-api
echo "  Stopping containers..."
docker compose -f docker-compose.deploy.yml down --remove-orphans || true
echo "  Removing hanging containers..."
docker rm -f malikina-db malikina-api malikina-nginx 2>/dev/null || true
echo "  Removed."
SSH_COMMANDS

# Step 5: Rebuild and deploy
echo "🔨 Building and deploying..."
ssh "$SERVER" << SSH_COMMANDS
cd /var/www/malikina-api
API_URL=$API_URL docker compose -f $COMPOSE_FILE up -d --build
SSH_COMMANDS

# Step 6: Wait for startup
echo "⏳ Waiting for services to start..."
sleep 15

# Step 7: Verify all routes
echo "🧪 Verifying admin endpoints..."
ssh "$SERVER" << 'SSH_COMMANDS'
echo "  Testing /api/xassidas/admin/stats..."
RESPONSE_STATS=$(curl -s http://127.0.0.1:5000/api/xassidas/admin/stats)
echo "    Response: $RESPONSE_STATS"

echo "  Testing /api/xassidas/admin/rescrape (POST)..."
RESPONSE_RESCRAPE=$(curl -s -X POST http://127.0.0.1:5000/api/xassidas/admin/rescrape)
echo "    Response: $RESPONSE_RESCRAPE"

echo "  Testing /api/xassidas/admin/integrity-check..."
RESPONSE_INTEGRITY=$(curl -s http://127.0.0.1:5000/api/xassidas/admin/integrity-check | head -c 100)
echo "    Response: $RESPONSE_INTEGRITY (truncated)..."

echo ""
echo "  Checking available endpoints..."
docker logs malikina-api 2>&1 | grep -A 15 "Available endpoints" || echo "    (Log details not available)"
SSH_COMMANDS

# Step 8: Check containers status
echo ""
echo "✅ Deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Container status:"
ssh "$SERVER" "docker ps --format 'table {{.Names}}\t{{.Status}}'"

echo ""
echo "📊 Admin Endpoints Summary:"
echo "  POST /api/xassidas/admin/rescrape        → Spawn background scraper"
echo "  GET  /api/xassidas/admin/stats           → Database statistics"
echo "  GET  /api/xassidas/admin/integrity-check → Check data completeness"
echo ""
echo "API: $API_URL/api/xassidas"
echo "Docs: $API_URL/api/docs"
