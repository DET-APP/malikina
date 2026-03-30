#!/bin/bash
# Download Xassida Data Script
# This script downloads all three xassida JSON files from GitHub

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Malikina Xassidas Data Download Script                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create data directory
echo -e "${BLUE}📁 Creating data directory...${NC}"
mkdir -p src/data
echo -e "${GREEN}✅ Directory ready: src/data/${NC}"
echo ""

# Download Abāda
echo -e "${BLUE}📥 Downloading Abāda (125+ verses)...${NC}"
curl -f -s -o src/data/abada.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/abada/abada.json"
if [ $? -eq 0 ]; then
  SIZE=$(du -h src/data/abada.json | cut -f1)
  echo -e "${GREEN}✅ Abāda downloaded (${SIZE})${NC}"
else
  echo -e "${YELLOW}⚠️  Failed to download Abāda${NC}"
fi
echo ""

# Download Maodo Xassidas (contains Khilās-Zahab)
echo -e "${BLUE}📥 Downloading Khilās-Zahab (from maodo xassidas.json)...${NC}"
curl -f -s -o src/data/maodo-xassidas.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/xassidas.json"
if [ $? -eq 0 ]; then
  SIZE=$(du -h src/data/maodo-xassidas.json | cut -f1)
  echo -e "${GREEN}✅ Khilās-Zahab downloaded (${SIZE})${NC}"
else
  echo -e "${YELLOW}⚠️  Failed to download Khilās-Zahab${NC}"
fi
echo ""

# Download Abouna
echo -e "${BLUE}📥 Downloading Abouna (29+ verses)...${NC}"
curl -f -s -o src/data/abouna.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/serigne-cheikh/abouna/abouna.json"
if [ $? -eq 0 ]; then
  SIZE=$(du -h src/data/abouna.json | cut -f1)
  echo -e "${GREEN}✅ Abouna downloaded (${SIZE})${NC}"
else
  echo -e "${YELLOW}⚠️  Failed to download Abouna${NC}"
fi
echo ""

# Validation
echo -e "${BLUE}🔍 Validating JSON files...${NC}"
echo ""

# Check if jq is available
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️  jq not found. Installing via Homebrew...${NC}"
  brew install jq
fi

# Validate each file
for file in abada maodo-xassidas abouna; do
  if [ -f "src/data/${file}.json" ]; then
    if jq empty "src/data/${file}.json" 2>/dev/null; then
      VERSES=$(jq -r '.chapters[0].verses | length' "src/data/${file}.json")
      echo -e "${GREEN}✅ ${file}.json valid (${VERSES} verses)${NC}"
    else
      echo -e "${YELLOW}⚠️  ${file}.json has invalid JSON${NC}"
    fi
  fi
done
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     Download Complete                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Downloaded Files:${NC}"
echo "  ✓ src/data/abada.json (Abāda - 125+ verses)"
echo "  ✓ src/data/maodo-xassidas.json (Khilās-Zahab + others)"
echo "  ✓ src/data/abouna.json (Abouna - 29+ verses)"
echo ""
echo -e "${BLUE}📖 Next Steps:${NC}"
echo "  1. Create: src/data/xassidaTypes.ts (with TypeScript interfaces)"
echo "  2. Create: src/data/importedXassidas.ts (data importer)"
echo "  3. Update: src/components/screens/QassidasScreen.tsx"
echo "  4. See: extracted-xassidas/import-instructions.md for details"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "  - extracted-xassidas/README.md"
echo "  - extracted-xassidas/EXTRACTION-GUIDE.md"
echo "  - extracted-xassidas/import-instructions.md"
echo "  - extracted-xassidas/DOWNLOAD-LINKS.md"
echo ""
echo "Ready to enhance your Malikina app! 🚀"
echo ""
