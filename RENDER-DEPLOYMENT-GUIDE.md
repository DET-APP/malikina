# 🚀 Render Deployment Guide - Manual Steps

Render API demande une configuration via le dashboard. Voici le guide étape par étape:

## Step 1: Connecter GitHub à Render

1. Aller sur **[https://dashboard.render.com](https://dashboard.render.com)**
2. Cliquer sur **"New" → "Web Service"**
3. Sélectionner **"Connect a repository"**
4. Chercher **"DET-APP/malikina"** ou paste: `https://github.com/DET-APP/malikina`
5. Cliquer **"Connect"**

## Step 2: Configurer le Service

Après la connexion, remplir la form:

| Field | Value |
|-------|-------|
| **Name** | `malikina-api` |
| **Branch** | `dev` |
| **Root Directory** | `api` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |
| **Instance Type** | `0.5 CPU, 512 MB RAM` |

## Step 3: Ajouter les Variables d'Environnement

Cliquer **"Environment"** et ajouter:

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://malikina.vercel.app
```

## Step 4: Deploy

1. Cliquer **"Create Web Service"**
2. Attendre 3-5 minutes pour la compilation et déploiement
3. Status passera de "Building" → "Live"
4. URL sera: `https://malikina-api-xxxxxx.onrender.com`

## Après Deployment

✅ Copier l'URL API: `https://malikina-api-xxxxxx.onrender.com`
✅ Mettre dans `.env.local` du frontend:
```
VITE_API_URL=https://malikina-api-xxxxxx.onrender.com/api
```

✅ Tester avec:
```bash
curl https://malikina-api-xxxxxx.onrender.com/api/authors
```

## Problèmes Courants

**❌ "Build failed"**
- Vérifier que `api/package.json` existe et est correctement configuré
- Vérifier que `api/src/server.ts` existe

**❌ "Service keeps restarting"**
- Vérifier PORT=5000 est configuré
- Vérifier la base de données sqlite se crée correctement

**❌ "Database connection error"**
- La DB sqlite se crée automatiquement au premier démarrage
- Attendre 1-2 minutes après le déploiement
- Vérifier les logs dans le dashboard

## Next: Frontend sur Vercel

Après API, tu dois déployer le frontend sur Vercel:

1. Aller sur [https://vercel.com](https://vercel.com)
2. Cliquer "Add New" → "Project"
3. Sélectionner le repo `DET-APP/malikina`
4. Dans "Environment Variables", ajouter:
   ```
   VITE_API_URL=https://malikina-api-xxxxxx.onrender.com/api
   ```
5. Déployer

## 📊 Statut du Déploiement

- **API Code**: ✅ Prêt sur GitHub (branche `dev`)
- **API Config**: ✅ Render.yaml créé
- **Frontend Config**: ✅ Vercel.json créé
- **Environment**: ✅ Variables configurées
- **Database**: ✅ Auto-init lors du premier démarrage

---

**Total de configuration): ~15 minutes**
**Coût**: $0/mois (Free tier)

Questions? Relis [DEPLOYMENT-LIVE.md](./DEPLOYMENT-LIVE.md)
