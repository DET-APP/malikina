# Architecture Malikina - Séparation Frontend/API

## 📋 Résumé

Le projet Malikina a été séparé en deux repos indépendants:

1. **Frontend:** React + Vite (repo public)
   - Déploié sur Vercel: https://malikina.vercel.app
   - URL du repo: https://github.com/Sangoule/malikina

2. **Backend/API:** Node.js + Express + PostgreSQL (repo séparé)
   - Déploié sur serveur DigitalOcean: 165.245.211.201
   - URL du repo: https://github.com/Sangoule/malikina-api
   - API publique: https://165-245-211-201.sslip.io/api

---

## 🗂️ Structure

### Frontend (malikina)
```
malikina/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   │   └── xassidaService.ts    # ← Appelle l'API externe
│   └── App.tsx
├── .env.example                  # VITE_API_URL=http://localhost:5000/api
├── .env.production.local         # VITE_API_URL=https://165-245-211-201.sslip.io/api
└── vite.config.ts

# Pas de dossier api/
# Le code API est dans le repo séparé malikina-api
```

### Backend (malikina-api)
```
malikina-api/
├── routes/
│   ├── xassidas.ts
│   ├── authors.ts
│   └── categories.ts
├── db/
│   ├── config.ts
│   ├── schema.ts
│   └── migrations/
├── scripts/
│   ├── scrape-xassidas.ts
│   └── import-translations.ts
├── server.ts
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 🚀 Déploiement

### Frontend (Vercel - Auto)
```bash
# La branche main est déployée automatiquement
git push origin main
# → Vercel détecte le changement
# → npm install && npm run build
# → Déploiement sur https://malikina.vercel.app
```

### Backend (Server - Manuel)

**Option 1: Via GitHub Actions** (recommandé)
```bash
# Pousse vers main ou dev
git push origin main
# Les workflows GitHub Actions (.github/workflows/deploy.yml) vont:
# 1. Builder le Docker image
# 2. SSH vers le serveur
# 3. Redémarrer les conteneurs
```

**Option 2: Manuel via script**
```bash
cd malikina-api
ssh root@165.245.211.201 "cd /var/www/malikina-api && git pull origin main && docker-compose up -d --build"
```

---

## 🌐 Variables d'Environnement

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api        # Dev local
VITE_API_URL=https://165-245-211-201.sslip.io/api  # Production
```

### Backend (.env)
```
PORT=5000
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_USER=malikina
DB_PASSWORD=malikina
DB_NAME=malikina
FRONTEND_URL=https://malikina.vercel.app
OCR_SPACE_API_KEY=optional
ADMIN_SECRET=your_secret_here
```

---

## 📡 Communication API

### Frontend → API
```typescript
// src/services/xassidaService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const xassidaService = {
  getXassidas: () => fetch(`${API_BASE_URL}/xassidas`),
  getXassida: (id) => fetch(`${API_BASE_URL}/xassidas/${id}`),
  // ...
};
```

### CORS Configuration
L'API accepte les requêtes de:
- `http://localhost:5173` (dev local)
- `https://malikina.vercel.app` (production)

```typescript
// server.ts
cors({
  origin: process.env.FRONTEND_URL?.split(','),
  credentials: true
})
```

---

## 🗄️ Base de Données

### Persistence
- **Serveur:** 165.245.211.201
- **Type:** PostgreSQL 16
- **Volume:** `/var/lib/malikina/postgres-data` (bind mount)
- **Conteneur:** `malikina-db`

### Données
- ✅ 56 xassidas
- ✅ 12 auteurs
- ✅ 3,538 versets

### Migrations
```bash
# Appliquer automatiquement au démarrage du conteneur
# Fichiers: api/db/migrations/*.sql

# Migrations principales:
001_create_base_tables.sql           # Schéma initial
007_add_verse_columns.sql            # Colonnes pour édition de versets
999_ensure-verse-columns.sql         # Sécurité - ajoute colonnes manquantes
```

---

## 🔧 Développement Local

### Backend
```bash
cd malikina-api
npm install
cp .env.example .env
docker-compose up
# API sur http://localhost:5000
# PostgreSQL sur localhost:5432
```

### Frontend
```bash
cd malikina
npm install
npm run dev
# URL: http://localhost:5173
# Utilise VITE_API_URL=http://localhost:5000/api
```

### Testing
```bash
# Test API directement
curl http://localhost:5000/api/xassidas?limit=1

# Test depuis le frontend
# Ouvrir https://localhost:5173/quran
```

---

## 📊 Endpoints API

### Xassidas
```
GET    /api/xassidas                    # Liste toutes
GET    /api/xassidas/:id                # Détails + versets
POST   /api/xassidas                    # Créer (admin)
PUT    /api/xassidas/:id                # Modifier (admin)
DELETE /api/xassidas/:id                # Supprimer (admin)
```

### Verses
```
GET    /api/xassidas/:id/verses         # Versets d'une xassida
POST   /api/verses                      # Ajouter versets (admin)
PUT    /api/verses/:id                  # Modifier versets (admin)
DELETE /api/verses/:id                  # Supprimer versets (admin)
```

### Authors
```
GET    /api/authors                     # Liste auteurs
POST   /api/authors                     # Créer (admin)
```

### Admin
```
POST   /api/xassidas/admin/rescrape     # Lancer scraper
POST   /api/xassidas/admin/import-translations  # Importer translations
```

---

## 🔄 Flux de Code

```
GitHub (Sangoule/malikina)
    ↓
Vercel (Auto-deploy)
    ↓
https://malikina.vercel.app

    Frontend  → Appelle API
    ↓
GitHub (Sangoule/malikina-api)
    ↓
GitHub Actions ou SSH
    ↓
Server 165.245.211.201
    ↓
Docker Compose
    ├── nginx (reverse proxy)
    ├── api (Node.js)
    └── postgres (database)
    ↓
https://165-245-211-201.sslip.io/api
```

---

## ✅ Checklist de Déploiement

- [x] Créer repo malikina-api sur GitHub
- [x] Pousser le code API
- [x] Configurer Docker Compose
- [x] Déployer API sur serveur
- [x] Configurer CORS
- [x] Tester communication API/Frontend
- [ ] Créer GitHub Actions pour auto-deploy (optionnel)
- [ ] Configurer backup PostgreSQL
- [ ] Documenter procédures de maintenance

---

## 🔐 Secrets à Protéger

### Frontend
- Clés API publiques uniquement (Vercel gère)

### Backend
- `DB_PASSWORD` → Variables d'environnement
- `ADMIN_SECRET` → Variables d'environnement
- `OCR_SPACE_API_KEY` → Variables d'environnement

### `.deploy-secrets` (local - NE PAS COMMITTER)
- GitHub Token
- SSH Keys
- API Keys

---

## 📝 Commandes Utiles

### Frontend
```bash
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint
npm run preview          # Preview build
```

### Backend
```bash
npm run dev              # Dev avec hot reload
npm run build            # TypeScript build
npm run start            # Run production
npm run db:migrate       # Database migrations
npm run db:seed          # Seed DB
npm run scrape           # Run scraper
```

### Server (SSH)
```bash
ssh root@165.245.211.201

# Logs API
docker logs malikina-api -f

# Logs DB
docker logs malikina-db -f

# Database
docker exec malikina-db psql -U malikina -d malikina

# Restart
docker-compose restart

# Stop
docker-compose down

# Start
docker-compose up -d
```

---

## 🐛 Troubleshooting

### API ne répond pas
```bash
# Vérifier santé
curl https://165-245-211-201.sslip.io/api/xassidas?limit=1

# Logs
ssh root@165.245.211.201
docker logs malikina-api

# Redémarrer
docker-compose restart malikina-api
```

### Frontend ne peut pas appeler API
- Vérifier VITE_API_URL dans .env
- Vérifier CORS sur l'API
- Vérifier certificat SSL (self-signed OK pour dev)
- Ouvrir DevTools → Network → voir les erreurs

### Base de données perdue
- Vérifier bind mount: `/var/lib/malikina/postgres-data`
- Vérifier stockage du serveur: `df -h`
- Restaurer depuis backup si disponible

---

## 📞 Contact & Support

- **Frontend Issues:** https://github.com/Sangoule/malikina/issues
- **Backend Issues:** https://github.com/Sangoule/malikina-api/issues
- **Server:** 165.245.211.201 (root)

---

**Dernière mise à jour:** 15 avril 2026
