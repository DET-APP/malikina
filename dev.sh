#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/user/Desktop/projects/personnel-projects/malikina"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 Malikina Development Server Launcher${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${YELLOW}Warning: This script is optimized for macOS${NC}"
fi

cd "$PROJECT_DIR"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    pkill -f "npm run dev"
    pkill -f "tsx"
    exit 0
}

trap cleanup EXIT INT TERM

# Kill any existing processes on the ports
echo -e "${YELLOW}Cleaning up old processes...${NC}"
lsof -ti:5000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Start API
echo -e "${BLUE}📡 Starting API Server...${NC}"
cd "$PROJECT_DIR/api"
npm run dev &
API_PID=$!
sleep 3

# Check if API started
if ps -p $API_PID > /dev/null; then
    echo -e "${GREEN}✅ API Server started (PID: $API_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start API Server${NC}"
    exit 1
fi

# Start Frontend
echo ""
echo -e "${BLUE}🎨 Starting Frontend Dev Server...${NC}"
cd "$PROJECT_DIR"
npm run dev &
FRONTEND_PID=$!
sleep 3

# Check if Frontend started
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Frontend${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Malikina is Running!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🔗 URLs:${NC}"
echo -e "  📡 API:      ${BLUE}http://localhost:5000/api${NC}"
echo -e "  🎨 Frontend: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}📝 To access Admin Panel:${NC}"
echo -e "  1. Open ${BLUE}http://localhost:5173${NC}"
echo -e "  2. Click the menu button (☰) in the bottom right"
echo -e "  3. Select 'Admin Xassidas' ⚙️"
echo ""
echo -e "${YELLOW}🛑 To stop: Press Ctrl+C${NC}"
echo ""

# Wait for user interruption
wait
