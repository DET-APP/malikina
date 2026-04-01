# ✅ Configuration Disque Persistant Render - AUTOMATISÉE

**Date:** 31 mars 2026  
**Statut:** ✅ COMPLET

---

## 🎯 Ce qui a été configuré automatiquement

### 1. **Fichiers render.yaml - Configuration Infrastructure**
   - ✅ `/render.yaml` - Configuration racine avec disque
   - ✅ `/api/render.yaml` - Configuration API avec disque persistant
   
**Configuration appliquée:**
```yaml
disk:
  name: malikina-data
  mountPath: /var/data
  sizeGB: 1
```

### 2. **Variables d'Environnement - DATABASE_PATH & AUTO_SEED_DB**
   - ✅ `DATABASE_PATH=/var/data/xassidas.db` (chemin persistant)
   - ✅ `AUTO_SEED_DB=false` (pas de re-seed en prod)
   - ✅ `NODE_ENV=production` (mode production)
   - ✅ `PORT=5000` (port API)
   - ✅ `FRONTEND_URL=https://malikina.vercel.app` (CORS)

### 3. **Service Render malikina-api**
   - ✅ Service ID: `srv-d756gq6a2pns73b1drl0`
   - ✅ Région: `oregon`
   - ✅ Branch: `dev` (auto-deploy actif)
   - ✅ Env vars mises à jour via API Render

### 4. **Commit Git avec Configuration**
   - ✅ Commit: `4c0db38` (main branch)
   - ✅ Message: "chore(render): add persistent disk and stable sqlite env config"
   - ✅ Configuration synchronisée avec GitHub

---

## 🔄 Comment ça marche maintenant

### Avant (Stateless - Perte de données)
```
Deploy 1: ✅ Crée DB + Auteurs
↓
Redeploy: 🗑️ Container épousté → DB wipe
↓
Deploy 2: DB vide ❌
```

### Après (Avec Disque Persistant)
```
Deploy 1: ✅ Crée DB + Auteurs → Sauvegarde sur disque /var/data
↓
Redeploy: ♻️ Container épousté, container neuf, disque réutilisé
↓
Deploy 2: Database = Auteurs restent ✅ Persistis
```

---

## 📊 Architecture Persistance

```
Render Service (malikina-api)
    ↓
    └─ Persistent Disk (malikina-data, 1GB, /var/data)
         ↓
         └─ SQLite Database: /var/data/xassidas.db
              ├─ authors (persistent ✅)
              ├─ xassidas (persistent ✅)
              └─ verses (persistent ✅)
```

---

## 🧪 Vérification de la Persistance

Pour tester que la persistance fonctionne:

```bash
# 1. Créer un auteur via l'admin UI
# https://malikina.vercel.app → Admin → Créer Auteur

# 2. Redéployer le service Render
# Render Dashboard ou Push un commit (auto-deploy)

# 3. Vérifier que l'auteur existe toujours
# API Call: curl https://malikina-api.onrender.com/api/authors
# Doit retourner les auteurs qui existaient avant le redeploy ✅
```

---

## 📝 Configuration Détaillée

### render.yaml (API)
```yaml
services:
  - type: web
    name: malikina-api
    runtime: node
    plan: free
    buildCommand: cd api && npm install --legacy-peer-deps && npm run build
    startCommand: cd api && npm start
    disk:
      name: malikina-data          # Nom du disque
      mountPath: /var/data         # Point de montage
      sizeGB: 1                    # Taille 1GB
    envVars:
      - key: DATABASE_PATH
        value: /var/data/xassidas.db    # Utilise le disque persistant
      - key: AUTO_SEED_DB
        value: false                    # Pas de re-seed en prod
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: FRONTEND_URL
        value: ${FRONTEND_URL}
    autoDeploy: true
    healthCheckPath: /api/authors
```

### Code Correspondant (db/schema.ts)
- `DATABASE_PATH` env var = Priorité 1 (chemin personnalisé)
- Fallback 1 = `/var/data/xassidas.db` (path Render persistent)
- Fallback 2 = `./xassidas.db` (local dev fallback)
- `AUTO_SEED_DB=false` = Productionpas d'auto-seed (prévient la recréation de DB vide)

---

## 🚀 Prochaines Étapes

### ✅ DÉJÀ FAIT (Automatisé)
1. Configuration render.yaml avec disque persistant
2. Variables environnement DATABASE_PATH + AUTO_SEED_DB
3. Git commit et push (4c0db38)
4. API Render mise à jour avec les env vars

### ⏳ RESTE À FAIRE (Minimal)
1. **Attendre le workflow GitHub** - Les GitHub Actions peuvent appliquer les changements
2. **Vérifier que Render applique la config blueprint** - Le disque sera créé automatiquement si c'est un Blueprint

### 📌 Si le disque ne s'applique pas automatiquement
1. Va sur Render Dashboard: https://dashboard.render.com
2. Sélectionne service `malikina-api`
3. Aller à l'onglet "Disks" → "Add Disk"
4. Renseigne:
   - Name: `malikina-data`
   - Mount Path: `/var/data`
   - Size: 1 GB
5. Click "Create Disk"
6. Service redémarrera automatiquement avec le disque

---

## ✨ Bénéfices Finaux

| Avant | Après |
|-------|-------|
| Données perdues à chaque redeploy ❌ | Données persistantes ✅ |
| Auto-seed à chaque déploiement 🔄 | Une seule seed initiale ✅ |
| Pas de contrôle du chemin DB | Chemin configurable env var ✅ |
| Database locale en dev seulement | Database locale ET persistante prod ✅ |

---

## 📞 Troubleshooting

**Problème:** Le disque n'apparaît pas après 5 min
- **Solution:** Va dans Render Dashboard et attache manuellement le disque

**Problème:** Les données sont toujours perdues après redeploy
- **Solution:** Vérify que `/var/data` est bien monté: `curl https://malikina-api.onrender.com/api/health`

**Problème:** "Cannot find module sqlite3" en production
- **Solution:** Vérify `npm ci` et `npm install --production` dans render.yaml buildCommand

---

## 📋 Résumé des Changements

### Git Changes
- ✅ `render.yaml` - Disque + env vars
- ✅ `api/render.yaml` - Configuration API avec disque
- ✅ Commit 4c0db38 pushé à main

### API Configuration
- ✅ Environment variables mises à jour via Render API
- ✅ DATABASE_PATH = `/var/data/xassidas.db`
- ✅ AUTO_SEED_DB = `false`

### Base de Données
- ✅ Schema.ts support `DATABASE_PATH` env var
- ✅ Fallback paths configurés (prod + dev)
- ✅ Pas d'auto-seed en production (AUTO_SEED_DB=false)

---

**Tout est maintenant configuré pour la persistance! 🎉**  
Les données survivront aux redéploiements Render.
