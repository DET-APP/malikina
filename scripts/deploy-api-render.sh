#!/bin/bash

# Render API Deployment Script
# Déploie l'API sur Render.com avec gestion JSON robuste

API_KEY="rnd_GOnOL22xft7wJYxOomlvEdz8nOzD"
OWNER_ID="tea-d72maobuibrs73fnso7g"
REPO_URL="https://github.com/DET-APP/malikina"

echo "🚀 Déploiement API sur Render..."
echo ""

# Créer un fichier JSON temporaire
cat > /tmp/render-service.json << 'JSONEOF'
{
  "type": "web_service",
  "name": "malikina-api",
  "ownerId": "tea-d72maobuibrs73fnso7g",
  "repo": "https://github.com/DET-APP/malikina",
  "branch": "dev",
  "rootDir": "api",
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "startCommand": "npm start",
  "envVars": [
    {
      "key": "NODE_ENV",
      "value": "production"
    },
    {
      "key": "PORT",
      "value": "5000"
    },
    {
      "key": "FRONTEND_URL",
      "value": "https://malikina.vercel.app"
    }
  ],
  "plan": "free",
  "region": "oregon",
  "autoDeploy": true
}
JSONEOF

echo "📝 JSON préparé. Validation..."
if grep -q '"name"' /tmp/render-service.json && grep -q '"repo"' /tmp/render-service.json; then
  echo "✅ JSON valide"
else
  echo "❌ JSON invalide"
fi

echo ""
echo "📤 Envoi à Render API..."

# Faire la requête avec curl
RESPONSE=$(curl -s -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/render-service.json)

echo "Réponse: $RESPONSE"
echo ""

# Vérifier le succès (cherche "id" dans la réponse)
if echo "$RESPONSE" | grep -q '"id"'; then
  SERVICE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "✅ Service créé avec succès!"
  echo "🆔 Service ID: $SERVICE_ID"
  echo ""
  echo "📊 Dashboard: https://dashboard.render.com/services/$SERVICE_ID"
  echo "⏳ Déploiement en cours... (3-5 minutes)"
  echo ""
  echo "🔗 API URL (après déploiement):"
  echo "   https://$SERVICE_ID.onrender.com/api"
else
  ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "❌ Erreur: $ERROR_MSG"
  echo ""
  echo "🆘 Troubleshooting:"
  echo "1. Vérifie que le repo GitHub est connecté à Render"
  echo "2. Va sur https://dashboard.render.com et ajoute une nouvelle Web Service manuellement"
  echo "3. Ou essaie avec une autre clé API"
fi

# Nettoyer
rm /tmp/render-service.json
