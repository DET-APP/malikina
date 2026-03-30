# 🎯 DÉPLOIE EN 2 CLICS !

## À Faire Maintenant

### **Étape 1: Ajoute ton API Key sur GitHub** (1 minute)

1. Va sur: https://github.com/DET-APP/malikina/settings/secrets/actions
2. Clique **"New repository secret"**
3. 
   ```
   Name: RENDER_API_KEY
   Value: rnd_GOnOL22xft7wJYxOomlvEdz8nOxD
   ```

4. Clique **"Add secret"** ✅

### **Étape 2: Trigger le déploiement** (10 secondes)

```bash
cd /path/to/malikina
git push origin dev
```

C'est tout! 🎉

---

## Regarde La Magie

1. Va sur: https://github.com/DET-APP/malikina/actions
2. Tu verras **"Deploy API to Render"** en cours
3. Wait 3-5 minutes...
4. ✅ API live sur Render!

---

## Récupère L'URL API

1. Va sur: https://dashboard.render.com
2. Cherche **"malikina-api"** service
3. Copie l'URL (ex: https://malikina-api-xxxxx.onrender.com)

---

## Déploie Le Frontend (Vercel)

1. Va sur: https://vercel.com
2. Clique: "Add New" → "Project"
3. Import: `DET-APP/malikina`
4. Dans "Environment Variables" ajoute:
   ```
   VITE_API_URL=https://malikina-api-xxxxx.onrender.com/api
   ```
   *(remplace xxxxx par ton URL réelle)*
5. Click "Deploy"

✅ Voilà! Ton app est live! 🚀

---

## Test L'API

```bash
curl https://malikina-api-xxxxx.onrender.com/api/authors
```

## Test L'Admin

1. Ouvre: https://malikina.vercel.app
2. Menu flottant → "Admin Xassidas"
3. Upload un PDF
4. Done!

---

## C'est Fait! 🎊

- Backend: ✅ Live sur Render  
- Frontend: ✅ Live sur Vercel
- Database: ✅ Auto-créée
- Admin Panel: ✅ Opérationnel
- Coût: ✅ $0/mois

---

**Questions?** Lis:
- [NEXT-STEPS.md](./NEXT-STEPS.md) - Guide complet
- [DEPLOYMENT-COMPLETE-SUMMARY.md](./DEPLOYMENT-COMPLETE-SUMMARY.md) - Résumé tech
- [GITHUB-SECRETS-SETUP.md](./GITHUB-SECRETS-SETUP.md) - Setup secrets

**Tu l'as fait! Bravo!** 🎉
