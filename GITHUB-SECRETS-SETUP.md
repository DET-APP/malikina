# 🔐 Configuration GitHub Secrets pour Render Deployment

## Ajouter la clé API Render comme Secret GitHub

### Étapes:

1. **Aller sur GitHub**
   - Ouvre https://github.com/DET-APP/malikina
   - Clique sur **Settings** (onglet)

2. **Naviguer vers Secrets**
   - Côté gauche: **Security** → **Secrets and variables** → **Actions**

3. **Créer un nouveau Secret**
   - Clique **"New repository secret"**
   - Nom: `RENDER_API_KEY`
   - Valeur: `rnd_GOnOL22xft7wJYxOomlvEdz8nOzD` (ta clé)
   - Clique **"Add secret"**

4. **Vérifier l'ajout**
   - Le secret doit apparaître dans la liste (masqué)

## Après l'ajout:

✅ La GitHub Action s'activera automatiquement à chaque push sur `dev`
✅ Elle créera ou metttra à jour le service sur Render
✅ Check les logs dans **Actions** tab

## Alternative: Déploiement Manuel

Si tu préfères ne pas utiliser GitHub Actions:

1. Va sur https://dashboard.render.com
2. Clique **"New" → "Web Service"**
3. Connecte le repo `DET-APP/malikina`
4. Sélectionne les paramètres (voir RENDER-DEPLOYMENT-GUIDE.md)

## Tester la Configuration

Après l'ajout du secret, fais un push pour tester:

```bash
git add -A
git commit -m "🚀 test: Trigger Render deployment"
git push origin dev
```

Puis va sur: https://github.com/DET-APP/malikina/actions

Tu verras le workflow "Deploy API to Render" en cours d'exécution! 🎉

---

Status: 
- GitHub Actions: ✅ Créé
- Secret: ⏳ À ajouter par toi
- Auto-déploiement: ⏳ S'activera après l'ajout du secret
