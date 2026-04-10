#!/bin/bash

# Script de Test Configuration OCR.space
# Usage: bash scripts/test-ocr-config.sh

set -e

echo "🔍 Test Configuration OCR.space"
echo "================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier si les variables existent en local
echo "1️⃣  Vérification des variables d'environnement locales..."
if [ -f "api/.env" ]; then
    if grep -q "OCR_SPACE_API_KEY" api/.env; then
        echo -e "${GREEN}✓${NC} OCR_SPACE_API_KEY trouvé dans api/.env"
        KEY=$(grep "OCR_SPACE_API_KEY" api/.env | cut -d'=' -f2 | xargs)
        if [ -z "$KEY" ] || [ "$KEY" = "your_api_key_here" ]; then
            echo -e "${RED}✗${NC} Clé API vide ou par défaut"
        else
            echo -e "${GREEN}✓${NC} Clé API semble configurée"
        fi
    else
        echo -e "${YELLOW}⚠${NC} OCR_SPACE_API_KEY non trouvé"
    fi
else
    echo -e "${YELLOW}⚠${NC} api/.env n'existe pas (pas grave pour production Docker)"
fi

echo ""
echo "2️⃣  Vérification de la syntaxe du code API..."
if [ -f "api/routes/xassidas.ts" ]; then
    if grep -q "extractTextWithOCRSpace" api/routes/xassidas.ts; then
        echo -e "${GREEN}✓${NC} Fonction OCR trouvée dans xassidas.ts"
    else
        echo -e "${RED}✗${NC} Fonction OCR manquante"
    fi
else
    echo -e "${RED}✗${NC} api/routes/xassidas.ts non trouvé"
fi

echo ""
echo "3️⃣  Vérification compilation TypeScript..."
cd api
if npm run build > /tmp/ocr-build.log 2>&1; then
    echo -e "${GREEN}✓${NC} Compilation TypeScript réussie"
else
    echo -e "${RED}✗${NC} Erreur de compilation"
    tail -10 /tmp/ocr-build.log
fi
cd ..

echo ""
echo "4️⃣  Instructions Render (À faire manuellement):"
echo "================================================"
echo ""
echo "Allez à: https://render.com/dashboard"
echo "Service: malikina-api"
echo "Onglet: Environment"
echo ""
echo "Ajoutez ces variables:"
echo "  OCR_SPACE_API_KEY = [votre clé d'OCR.space]"
echo "  OCR_SPACE_LANGUAGE = ara"
echo "  OCR_SPACE_ENGINE = 2"
echo ""
echo "Puis cliquez Save → Render redéploiera automatiquement"
echo ""

echo ""
echo "5️⃣  Test curl (sur production Render):"
echo "======================================"
echo ""
echo "Après déploiement, testez avec:"
echo ""
echo "curl -X POST -F 'file=@test.pdf' \\"
echo "  https://malikina-api.onrender.com/api/xassidas/1/upload-pdf"
echo ""
echo "Réponse attendue: extraction_method = 'ocr-space'"
echo ""

# Test local si API est en cours d'exécution
echo "🌐 Test local (si API en cours)..."
if curl -s http://localhost:5000/api/health &>/dev/null; then
    echo -e "${GREEN}✓${NC} API locale responsive"
    echo ""
    echo "Pouvez tester localement (mais OCR demande clé en production)"
else
    echo -e "${YELLOW}⚠${NC} API locale pas disponible (démarrez avec: cd api && npm run dev)"
fi

echo ""
echo "✨ Configuration prête!"
echo "Prochaine étape: Ajouter clé API sur Render → Tester extraction"
