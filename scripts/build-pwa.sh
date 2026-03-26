#!/bin/bash

# PWA Build Script for Al Moutahabbina Fillahi
# Requirements: Node.js 18+ or Bun runtime

set -e

echo "📦 Building Al Moutahabbina PWA..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required (current: $NODE_VERSION)"
  echo "   Install from: https://nodejs.org/ or https://bun.sh"
  exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm ci || npm install

# Build the app
echo "🔨 Building production bundle..."
npm run build

# Verify build
if [ -d "dist" ]; then
  echo "✅ Build successful!"
  echo ""
  echo "📊 Build output:"
  du -sh dist
  
  # Check for service worker and manifest
  if [ -f "dist/service-worker.js" ] && [ -f "dist/manifest.json" ]; then
    echo "✅ Service Worker registered"
    echo "✅ Manifest included"
  else
    echo "⚠️  Service Worker or Manifest missing"
    echo "   Ensure vite-plugin-pwa is configured correctly"
  fi
else
  echo "❌ Build failed - dist folder not found"
  exit 1
fi

echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Deploy to:"
echo "  - Vercel: vercel deploy"
echo "  - Netlify: netlify deploy --prod"
echo "  - GitHub Pages: gh-pages -d dist"
echo ""
echo "Test locally:"
echo "  npm run preview"
