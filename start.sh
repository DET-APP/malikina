#!/bin/bash

# Script pour démarrer l'API et le frontend ensemble

echo "🚀 Malikina - Démarrage complet"
echo "================================"

# Couleurs
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Démarrer l'API
echo "📚 Démarrage API..."
cd api
npm install --silent
npm run dev &
API_PID=$!
echo -e "${GREEN}✅ API sur http://localhost:5000${NC}"

# Attendre que l'API soit prête
sleep 3

# Démarrer le frontend
echo ""
echo "🎨 Démarrage Frontend..."
cd ..
npm run dev &
FRONT_PID=$!
echo -e "${GREEN}✅ Frontend sur http://localhost:5173${NC}"

echo ""
echo "================================"
echo -e "${GREEN}✅ Tout est prêt!${NC}"
echo ""
echo "API:      http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Admin:    http://localhost:5173 → Cliquer 'Admin'"
echo ""
echo "Appuyer Ctrl+C pour arrêter"
echo "================================"

# Garder les processus actifs
wait
