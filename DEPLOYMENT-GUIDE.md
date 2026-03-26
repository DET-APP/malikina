# 🚀 Malikina Xassida API - Guide de déploiement gratuit

## 📦 Setup local (5 min)

### Backend
```bash
cd api
npm install
npm run dev
```
✅ API disponible sur http://localhost:5000

### Frontend
```bash
npm run dev
```
✅ App disponible sur http://localhost:5173

---

## 🌐 Déploiement gratuit

### Option 1: Render (Recommandé - Backend + Database)

**Backend Node.js:**
1. Push ton code sur GitHub
2. Aller sur https://render.com
3. Cliquer "New+" → "Web Service"
4. Connecter ton repo GitHub
5. Configurer:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: 
     ```
     NODE_ENV=production
     PORT=5000
     ```
6. Deploy! 🎉

**Coût**: Gratuit (avec limitation)
**Uptime**: Auto-sleep après 15 min inactivité (plan gratuit)

---

### Option 2: Railway (Plus rapide)

1. Aller sur https://railway.app
2. Créer nouveau projet
3. Connecter GitHub
4. Sélectionner le repo `malikina`
5. Railway détecte Node.js automatiquement
6. Variables d'environnement:
   ```
   NODE_ENV=production
   ```
7. Deploy!

**Coût**: $5/mois gratuit, puis payant
**Rapidité**: Très rapide

---

### Frontend - Vercel (Recommandé)

1. Aller sur https://vercel.com
2. Importer repo GitHub
3. Framework: Vite
4. Build Command: `npm run build`
5. Install Command: `npm install`
6. Environment Variables:
   ```
   REACT_APP_API_URL=https://ton-api.render.com/api
   ```
7. Deploy!

**Coût**: Totalement gratuit
**Avantage**: CDN global, très rapide

---

### Alternative Frontend - Netlify

1. Aller sur https://netlify.com
2. Connecter GitHub
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment Variables:
   ```
   REACT_APP_API_URL=https://ton-api.render.com/api
   ```
5. Deploy!

---

## 📋 Steps complets

### 1️⃣ Préparer le repo
```bash
# Ajouter le dossier api au git
git add api/
git commit -m "feat: add xassida API"
git push
```

### 2️⃣ Déployer l'API (Render)
- Login sur Render.com
- New Web Service
- Sélectionner repo
- Settings:
  ```
  Build: npm install && npm run build
  Start: npm start
  Root directory: api
  ```
- Deploy
- Note l'URL (ex: `https://malikina-api.onrender.com`)

### 3️⃣ Déployer le Frontend (Vercel)
- Login sur Vercel
- Import Project
- Root directory: `.`
- Environment Variable:
  ```
  REACT_APP_API_URL=https://malikina-api.onrender.com/api
  ```
- Deploy

### 4️⃣ Tester
```bash
# Vérifier l'API
curl https://malikina-api.onrender.com/health

# Vérifier le frontend
Ouvrir https://malikina.vercel.app
```

---

## 🔧 Variables d'environnement

### Backend (.env)
```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://malikina.vercel.app
```

### Frontend (.env)
```
REACT_APP_API_URL=https://malikina-api.onrender.com/api
```

---

## 📁 Structure après déploiement

```
GitHub Repo (DET-APP/malikina)
├── Frontend (src/) → Déployé sur Vercel
├── Backend (api/)  → Déployé sur Render
└── Database (xassidas.db) → Sur Render
```

---

## 🆘 Troubleshooting

### "API not responding"
✅ Vérifier l'URL dans .env du frontend
✅ Vérifier CORS dans `api/server.ts`
✅ Attendre 30s (Render peut prendre du temps)

### "DB file not found"
✅ Render crée `xassidas.db` automatiquement
✅ Database initializée au démarrage

### "PDF upload not working"
✅ Vérifier taille max: 50MB (configurable)
✅ Format PDF valide requis

---

## 💡 Tips

1. **Auto-sleep sur Render**: Ajouter cronjob pour garder API alive
2. **Images auteurs**: Utiliser Cloudinary (gratuit) pour héberger les photos
3. **Backups**: Télécharger `xassidas.db` régulièrement

---

## 🎯 Coûts totaux: 0€

- Backend API: Gratuit (Render)
- Database: Inclus (SQLite)
- Frontend: Gratuit (Vercel)
- **Total**: ✅ **Totalement gratuit**

---

## 📞 Support

Si besoin, upgrader les plans:
- Render: $7/mois (toujours actif)
- Vercel: Gratuit suffisant
- Total: ~$7/mois pour produit stable

---

✅ **Prêt à déployer!** 🚀
