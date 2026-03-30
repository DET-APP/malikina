#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/Users/user/Desktop/projects/personnel-projects/malikina"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 Malikina Deployment Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if we're in the right directory
cd "$PROJECT_DIR" || exit 1

# Check git status
echo -e "${YELLOW}📋 Checking git status...${NC}"
if ! git diff --quiet; then
    echo -e "${RED}❌ You have uncommitted changes!${NC}"
    echo "Please commit all changes first:"
    echo "  git add -A && git commit -m 'Your message'"
    exit 1
fi

echo -e "${GREEN}✅ Git repository is clean${NC}"
echo ""

# Menu
echo -e "${BLUE}What would you like to deploy?${NC}"
echo ""
echo "1) Deploy API to Render.com (requires Render token)"
echo "2) Deploy Frontend to Vercel (requires Vercel token)"
echo "3) Open Render.com in browser (manual setup)"
echo "4) Open Vercel.com in browser (manual setup)"
echo "5) Show deployment URLs"
echo "0) Exit"
echo ""
read -p "Choose (0-5): " choice

case $choice in
  1)
    echo ""
    echo -e "${YELLOW}🔵 API Deployment to Render${NC}"
    echo ""
    echo "To deploy the API, you need:"
    echo "1. A Render account at https://render.com"
    echo "2. A Render API key"
    echo ""
    read -p "Do you have a Render API key? (y/n): " has_token
    if [ "$has_token" = "y" ]; then
      read -sp "Enter your Render API key: " render_token
      echo ""
      
      # Check if render CLI is installed
      if ! command -v render &> /dev/null; then
        echo -e "${YELLOW}Installing Render CLI...${NC}"
        npm install -g @render/cli
      fi
      
      echo -e "${YELLOW}Authenticating with Render...${NC}"
      echo "$render_token" | render login
      
      echo -e "${YELLOW}Starting deployment...${NC}"
      render deploy --service malikina-api
      
      echo -e "${GREEN}✅ API deployment started!${NC}"
      echo "Check status at: https://dashboard.render.com"
    else
      echo ""
      echo -e "${YELLOW}Manual setup required:${NC}"
      echo "1. Go to https://render.com"
      echo "2. Sign up with GitHub"
      echo "3. Create new Web Service"
      echo "4. Connect your malikina repository"
      echo ""
      read -p "Open Render.com? (y/n): " open_render
      if [ "$open_render" = "y" ]; then
        open "https://render.com/dashboard/new/web"
      fi
    fi
    ;;
    
  2)
    echo ""
    echo -e "${YELLOW}🟢 Frontend Deployment to Vercel${NC}"
    echo ""
    echo "To deploy the frontend, you need:"
    echo "1. A Vercel account at https://vercel.com"
    echo "2. A Vercel token"
    echo ""
    read -p "Do you have a Vercel token? (y/n): " has_token
    if [ "$has_token" = "y" ]; then
      read -sp "Enter your Vercel token: " vercel_token
      echo ""
      
      # Check if vercel CLI is installed
      if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
      fi
      
      echo -e "${YELLOW}Authenticating with Vercel...${NC}"
      vercel --token "$vercel_token" login
      
      echo -e "${YELLOW}Deploying to Vercel...${NC}"
      vercel --prod --token "$vercel_token"
      
      echo -e "${GREEN}✅ Frontend deployed!${NC}"
      echo "Check status at: https://vercel.com/dashboard"
    else
      echo ""
      echo -e "${YELLOW}Manual setup required:${NC}"
      echo "1. Go to https://vercel.com"
      echo "2. Sign up/Login with GitHub"
      echo "3. Import malikina project"
      echo "4. Configure build settings and deploy"
      echo ""
      read -p "Open Vercel.com? (y/n): " open_vercel
      if [ "$open_vercel" = "y" ]; then
        open "https://vercel.com/new"
      fi
    fi
    ;;
    
  3)
    echo -e "${YELLOW}Opening Render.com...${NC}"
    open "https://render.com/dashboard/new/web"
    echo -e "${BLUE}Follow the guide in DEPLOYMENT-LIVE.md for setup${NC}"
    ;;
    
  4)
    echo -e "${YELLOW}Opening Vercel.com...${NC}"
    open "https://vercel.com/new"
    echo -e "${BLUE}Follow the guide in DEPLOYMENT-LIVE.md for setup${NC}"
    ;;
    
  5)
    echo ""
    echo -e "${BLUE}📍 Deployment URLs${NC}"
    echo ""
    echo "Once deployed, your app will be at:"
    echo ""
    echo -e "${GREEN}API:${NC}      https://malikina-api-xxxxx.onrender.com/api"
    echo -e "${GREEN}Frontend:${NC}  https://malikina.vercel.app"
    echo ""
    echo "Replace 'xxxxx' with your actual service name"
    echo ""
    ;;
    
  0)
    echo "Exiting..."
    exit 0
    ;;
    
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${YELLOW}For detailed instructions, see: DEPLOYMENT-LIVE.md${NC}"
echo ""
