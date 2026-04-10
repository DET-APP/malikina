#!/bin/bash

# Setup script for Malikina API on DigitalOcean (Ubuntu 24.04)
# Run as: curl -sSL https://raw.githubusercontent.com/DET-APP/malikina/dev/scripts/setup-server.sh | bash

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🚀 Malikina Server Setup (Ubuntu 24.04)${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if reboot is needed
if [ -f /var/run/reboot-required ]; then
    echo -e "${YELLOW}⚠️  System reboot required!${NC}"
    echo "Run: sudo reboot"
    echo "Then run this script again after reboot"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install prerequisites
echo -e "${YELLOW}Installing prerequisites...${NC}"
apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
echo -e "${YELLOW}Adding Docker GPG key...${NC}"
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo -e "${YELLOW}Adding Docker repository...${NC}"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
apt-get update

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker
echo -e "${YELLOW}Enabling Docker...${NC}"
systemctl enable docker
systemctl start docker

# Add root to docker group
usermod -aG docker root

# Verify Docker
echo -e "${GREEN}✓ Docker installed${NC}"
docker --version
docker compose version

# Install Git
echo -e "${YELLOW}Installing Git...${NC}"
apt-get install -y git

# Clone repository
echo -e "${YELLOW}Cloning repository...${NC}"
if [ ! -d "/root/malikina" ]; then
    cd /root
    git clone https://github.com/DET-APP/malikina.git
    cd malikina
    git checkout dev
else
    cd /root/malikina
    git pull origin dev
fi

# Create necessary directories
mkdir -p /root/malikina/api/public/audios
mkdir -p /root/malikina/backups
mkdir -p /var/data  # For Docker volumes

# Set permissions
chmod -R 755 /root/malikina
chmod +x /root/malikina/scripts/*.sh

# Display next steps
echo -e "${GREEN}✅ Server setup complete!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "${YELLOW}1. Go to project:${NC}"
echo "   cd /root/malikina"
echo ""
echo -e "${YELLOW}2. Create .env file from .deploy-secrets:${NC}"
echo "   cat > .env << 'EOF'"
echo "NODE_ENV=production"
echo "PORT=5000"
echo "DB_USER=malikina"
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "DB_NAME=malikina"
echo "DB_HOST=postgres"
echo "DB_PORT=5432"
echo "FRONTEND_URL=https://malikina.vercel.app"
echo "API_URL=https://165-245-211-201.sslip.io/api"
echo "OCR_SPACE_API_KEY=[your-key]"
echo "EOF"
echo ""
echo -e "${YELLOW}3. Start services:${NC}"
echo "   docker compose -f docker-compose.deploy.yml up -d"
echo ""
echo -e "${YELLOW}4. Check status:${NC}"
echo "   docker compose ps"
echo "   docker compose logs -f api"
echo ""
echo -e "${YELLOW}5. Run scraper (optional):${NC}"
echo "   docker compose exec api npm run scrape"
echo ""
echo -e "${BLUE}=====================================${NC}"
