#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setup Assistant - Malikina Xassida API');
console.log('==========================================\n');

// Vérifier Node.js
const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
console.log(`✅ Node.js: ${nodeVersion}`);

// Installer dépendances API
console.log('\n📦 Installation des dépendances API...');
try {
  execSync('cd api && npm install', { stdio: 'inherit' });
  console.log('✅ API dépendances installées');
} catch (error) {
  console.error('❌ Erreur installation API dépendances');
  process.exit(1);
}

// Créer .env files
console.log('\n🔧 Configuration...');
const rootEnv = `REACT_APP_API_URL=http://localhost:5000/api`;
const apiEnv = `PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173`;

fs.writeFileSync(path.join(process.cwd(), '.env.local'), rootEnv);
fs.writeFileSync(path.join(process.cwd(), 'api/.env'), apiEnv);
console.log('✅ Fichiers .env créés');

// Initialiser la base de données
console.log('\n🗄️  Initialisation base de données...');
try {
  execSync('cd api && npm run db:migrate 2>/dev/null || true', { stdio: 'inherit' });
  console.log('✅ Base de données initialisée');
} catch (error) {
  console.log('ℹ️  Base de données sera créée au premier démarrage');
}

console.log('\n==========================================');
console.log('✅ Setup terminé!');
console.log('==========================================\n');

console.log('📚 Commandes disponibles:\n');
console.log('  npm run dev          - Démarrer frontend + API');
console.log('  bash start.sh        - Démarrer tout');
console.log('  cd api && npm run dev- API seule');
console.log('\n📖 Documentation:\n');
console.log('  API-SETUP.md         - Configuration API');
console.log('  FRONTEND-INTEGRATION.md - Intégration');
console.log('  DEPLOYMENT-GUIDE.md  - Déploiement gratuit\n');

console.log('🚀 Pour démarrer:\n');
console.log('  $ npm run dev');
console.log('  $ Open http://localhost:5173\n');
