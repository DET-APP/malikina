#!/bin/bash

# Deploy Docker to DigitalOcean
# Usage: ./scripts/deploy-docker.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
SECRETS_FILE=".deploy-secrets"
TEMP_ENV_FILE=".env.deploy.tmp"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if secrets file exists
if [ ! -f "$SECRETS_FILE" ]; then
    echo -e "${RED}Error: $SECRETS_FILE not found${NC}"
    exit 1
fi

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🐳 Malikina Docker Deployment${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}=====================================${NC}"

# Load secrets
echo -e "${YELLOW}Loading secrets...${NC}"
set -a
source "$SECRETS_FILE"
set +a

# Validate required secrets
REQUIRED_VARS=(
    "DO_API_KEY"
    "DROPLET_IP"
    "FRONTEND_URL"
    "API_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var not set in $SECRETS_FILE${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Secrets loaded${NC}"

# Generate temporary env file for deployment
echo -e "${YELLOW}Generating deployment env...${NC}"

cat > "$TEMP_ENV_FILE" << EOF
# Generated deployment environment
NODE_ENV=production
PORT=5000
DB_USER=malikina
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=malikina
DB_HOST=postgres
DB_PORT=5432
FRONTEND_URL=$FRONTEND_URL
API_URL=$API_URL
OCR_SPACE_API_KEY=$OCR_SPACE_API_KEY
GITHUB_TOKEN=$GITHUB_TOKEN
EOF

echo -e "${GREEN}✓ Environment file generated${NC}"

# Build API image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t malikina-api:$ENVIRONMENT -f api/Dockerfile .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    rm -f "$TEMP_ENV_FILE"
    exit 1
fi

# Push to Docker Hub (optional)
if [ "$PUSH_DOCKER" = "true" ]; then
    echo -e "${YELLOW}Pushing to Docker registry...${NC}"
    docker tag malikina-api:$ENVIRONMENT your-registry/malikina-api:$ENVIRONMENT
    docker push your-registry/malikina-api:$ENVIRONMENT
    echo -e "${GREEN}✓ Image pushed${NC}"
fi

# Deploy to DigitalOcean droplet
echo -e "${YELLOW}Deploying to DigitalOcean droplet...${NC}"
echo -e "${YELLOW}Droplet IP: $DROPLET_IP${NC}"

# Copy docker-compose file
scp -o StrictHostKeyChecking=no docker-compose.deploy.yml root@$DROPLET_IP:/root/malikina/docker-compose.yml

# Copy env file
scp -o StrictHostKeyChecking=no "$TEMP_ENV_FILE" root@$DROPLET_IP:/root/malikina/.env

# Execute deployment commands on droplet
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'DEPLOY'
cd /root/malikina

# Pull latest code
git pull origin dev

# Stop existing containers
docker-compose down

# Build and start new containers
docker-compose -f docker-compose.deploy.yml up -d

# Run migrations
sleep 5
docker-compose exec -T postgres psql -U malikina -d malikina -f /docker-entrypoint-initdb.d/001_create_base_tables.sql

# Check status
docker-compose ps
docker-compose logs --tail 20

echo "✅ Deployment complete"
DEPLOY

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful${NC}"
    
    # Run scraper if specified
    if [ "$RUN_SCRAPER" = "true" ]; then
        echo -e "${YELLOW}Running scraper...${NC}"
        ssh -o StrictHostKeyChecking=no root@$DROPLET_IP "cd /root/malikina && docker-compose exec -T api npm run scrape"
    fi
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

# Cleanup
rm -f "$TEMP_ENV_FILE"

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${BLUE}API URL: $API_URL${NC}"
echo -e "${BLUE}Frontend URL: $FRONTEND_URL${NC}"
echo -e "${BLUE}=====================================${NC}"
