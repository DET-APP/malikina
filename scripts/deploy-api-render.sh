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
  "buildCommand": "cd api && npm install --legacy-peer-deps && npm run build",
  "startCommand": "cd api && npm start",
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
jq empty /tmp/render-service.json && echo "✅ JSON valide" || echo "❌ JSON invalide"

echo ""
echo "📤 Envoi à Render API..."

# Faire la requête avec curl
RESPONSE=$(curl -s -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/render-service.json)

echo "Réponse: $RESPONSE"
echo ""

# Vérifier le succès
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
  SERVICE_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo "✅ Service créé avec succès!"
  echo "🆔 Service ID: $SERVICE_ID"
  echo ""
  echo "📊 Dashboard: https://dashboard.render.com/services/$SERVICE_ID"
  echo "⏳ Déploiement en cours... (3-5 minutes)"
  echo ""
  echo "🔗 API URL (après déploiement):"
  echo "   https://$SERVICE_ID.onrender.com/api"
else
  echo "❌ Erreur: $(echo "$RESPONSE" | jq -r '.message // .error // "Erreur inconnue"')"
  echo ""
  echo "🆘 Troubleshooting:"
  echo "1. Vérifie que le repo GitHub est connecté à Render"
  echo "2. Va sur https://dashboard.render.com et ajoute une nouvelle Web Service manuellement"
  echo "3. Ou essaie avec une autre clé API"
fi

# Nettoyer
rm /tmp/render-service.json
