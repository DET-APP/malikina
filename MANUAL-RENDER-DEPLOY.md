# 🎯 Déployer Manuellement sur Render (5 minutes)

## Étape 1: Va sur Render Dashboard
👉 **https://dashboard.render.com**

---

## Étape 2: Créer un Nouveau Service

1. Clique **"New"** (bouton vert en haut à droite)
2. Sélectionne **"Web Service"**
3. Clique **"Connect a repository"**
4. Cherche **`DET-APP/malikina`** ou copie colle:
   ```
   https://github.com/DET-APP/malikina
   ```
5. Clique **"Connect"**

---

## Étape 3: Configurer le Service

### Nom & Configuration Basique
```
Name:           malikina-api
Branch:         dev
Root Directory: api
```

### Build & Start Commands
```
Build Command: npm install --legacy-peer-deps && npm run build
Start Command: npm start
```

### Ressources
```
Plan:           Free
Region:         Oregon (ou proche de toi)
Auto Deploy:    ✅ ON
```

---

## Étape 4: Variables d'Environnement

Clique **"Environment"** et ajoute:

```
NODE_ENV = production
PORT = 5000
FRONTEND_URL = https://malikina.vercel.app
```

---

## Étape 5: Deploy!

Clique **"Create Web Service"**

⏳ **Attends 3-5 minutes** le déploiement...

Tu verras:
- "Building" → En cours de compilation
- "Live" → ✅ C'est bon!

---

## Récupérer l'URL API

Après que le service soit "Live":

1. Clique sur le service `malikina-api`
2. En haut à droite, tu veras l'URL:
   ```
   https://malikina-api-xxxxxx.onrender.com
   ```

📝 **Copie cette URL**, tu en auras besoin pour Vercel!

---

## Tester L'API

```bash
curl https://malikina-api-xxxxxx.onrender.com/api/authors
```

Doit répondre:
```json
{"success":true,"data":[]}
```

✅ Si tu as ça = l'API marche!

---

## 🎉 Prochaine Étape

Maintenant qu'l'API est live:

1. Va sur **https://vercel.com**
2. Import le repo `DET-APP/malikina`
3. Ajoute env var:
   ```
   VITE_API_URL=https://malikina-api-xxxxxx.onrender.com/api
   ```
4. Deploy!

---

## ⚠️ Problèmes Courants

### "Build failed"
- Vérifie que `api/package.json` existe
- Vérifies que `api/src/server.ts` est correct
- **Solution**: Regarde les logs Render (onglet "Logs")

### "Service keeps restarting"
- Vérifies que PORT=5000 est set
- Vérifies NODE_ENV=production
- **Solution**: Redémarrer le service depuis le dashboard

### "Connection timeout"
- Attends 1-2 min après le déploiement (wake-up free tier)
- **Solution**: Clique "Deploy" dans le dashboard pour redémarrer

---

## 📞 Besoin d'Aide?

- **Dashboard Render**: https://dashboard.render.com
- **Logs du déploiement**: Clique service → "Logs"
- **Documentation**: [README-DEPLOY-NOW.md](../README-DEPLOY-NOW.md)

---

**Tu es prêt!** Vas sur https://dashboard.render.com et crée le service! 🚀
