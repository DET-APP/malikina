# ⚡ DÉPLOIE MAINTENANT (Manuel)

Render API ne permet pas créer services via curl. **Fais-le manuellement** (5 min):

## 3 Clics = API Live!

### 1️⃣ Ouvre Render
👉 https://dashboard.render.com

### 2️⃣ Clique "New" → "Web Service" → "Connect a repository"

Repo: `https://github.com/DET-APP/malikina`

### 3️⃣ Remplis les champs:

| Field | Value |
|-------|-------|
| **Name** | `malikina-api` |
| **Branch** | `dev` |
| **Root Dir** | `api` |
| **Build** | `npm install --legacy-peer-deps && npm run build` |
| **Start** | `npm start` |
| **Plan** | Free |

### 4️⃣ Environment Variables:
```
NODE_ENV = production
PORT = 5000
FRONTEND_URL = https://malikina.vercel.app
```

### 5️⃣ Clique "Create Web Service"

✅ **Voilà!** En 5 minutes tu as:
- API Deployée
- Database crée
- URL obtenue

---

## Après le Déploiement

**Récupère l'URL API**: 
```
https://malikina-api-xxxxxx.onrender.com
```

**Teste**:
```bash
curl https://malikina-api-xxxxxx.onrender.com/api/authors
```

---

## 📱 Deploy Frontend (Vercel)

Va sur: https://vercel.com

Import: `DET-APP/malikina`

Env var:
```
VITE_API_URL=https://malikina-api-xxxxxx.onrender.com/api
```

Deploy!

---

**C'est prêt!** 🚀

Guide complet: [MANUAL-RENDER-DEPLOY.md](./MANUAL-RENDER-DEPLOY.md)
