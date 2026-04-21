#!/bin/bash
# Setup Capacitor Android — à lancer une seule fois
set -e

echo "📦 Installation des dépendances Capacitor..."
npm install

echo "🏗️  Build du projet web..."
npm run build

echo "📱 Initialisation Android..."
npx cap add android

echo "🔄 Synchronisation..."
npx cap sync android

echo ""
echo "✅ Setup Android terminé !"
echo ""
echo "Prochaines étapes :"
echo "  1. Lance 'npx cap open android' pour ouvrir Android Studio"
echo "  2. Dans Android Studio : Build > Generate Signed Bundle / APK"
echo "  3. Pour tester sur device : Run > Run app"
echo ""
echo "Après chaque modif du code web :"
echo "  npm run mobile:sync"
