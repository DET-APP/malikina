# 🚀 Malikina Fullstack Setup - Démarrage Rapide

## ✅ Intégration Complète Terminée!

Voici ce qui a été fait automatiquement:

### 📦 Backend API
- ✅ Express server avec TypeScript
- ✅ SQLite database (`xassidas.db`)
- ✅ CRUD endpoints pour Xassidas et Authors
- ✅ PDF upload & text extraction
- ✅ CORS configuré

### 🎨 Frontend
- ✅ AdminXassidaScreen intégré dans les routes
- ✅ Button "Admin Xassidas" ajouté au menu flottant
- ✅ React Query pour API calls
- ✅ Formulaires avec react-hook-form

### 🔧 Configuration
- ✅ `.env.local` créé avec `VITE_API_URL=http://localhost:5000/api`
- ✅ `api/.env` créé avec `PORT=5000`
- ✅ Tous les dépendances installées npm

---

## 🎯 Comment Utiliser

### Option 1: Démarrer avec npm (Recommandé)

**Terminal 1 - API:**
```bash
cd /Users/user/Desktop/projects/personnel-projects/malikina/api
npm run dev
```

Vous verrez:
```
✅ Database initialized
✅ Xassida API running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/user/Desktop/projects/personnel-projects/malikina
npm run dev
```

Vous verrez:
```
  ➜  Local:   http://localhost:5173/
```

### Option 2: Démarrer avec le Script

```bash
cd /Users/user/Desktop/projects/personnel-projects/malikina
bash ./start.sh    # Si le fichier existe
# OU créer un nouveau script comme ci-dessus
```

---

## 🌐 Accès à l'Application

1. **Frontend:** http://localhost:5173/
2. **API:** http://localhost:5000/api

### Navigation vers Admin:
1. Ouvrir l'app à http://localhost:5173/
2. Cliquer sur le bouton hamburger (Menu) en bas à droite
3. Sélectionner "Admin Xassidas" ⚙️

---

## 📡 API Endpoints

### Authors
- `GET /api/authors` - Lister tous les auteurs
- `POST /api/authors` - Créer un auteur
- `PUT /api/authors/:id` - Modifier un auteur
- `DELETE /api/authors/:id` - Supprimer un auteur

### Xassidas
- `GET /api/xassidas` - Lister toutes les xassidas
- `GET /api/xassidas/:id` - Obtenir une xassida avec ses versets
- `POST /api/xassidas` - Créer une xassida
- `PUT /api/xassidas/:id` - Modifier une xassida
- `DELETE /api/xassidas/:id` - Supprimer une xassida
- `POST /api/xassidas/:id/upload-pdf` - Upload PDF
- `POST /api/xassidas/:id/verses` - Sauvegarder les versets

---

## ✨ Fonctionnalités Admin

### 👤 Créer un Auteur
1. Cliquer "Ajouter Auteur"
2. Entrer: Nom, Description, Tradition (ex: Tidianie)
3. Optionnel: Années de naissance/mort, Photo URL

### 📚 Créer une Xassida
1. Cliquer "Ajouter Xassida"
2. Entrer: Titre, Sélectionner Auteur
3. Optionnel: Description

### 📄 Upload PDF
1. Sélectionner une xassida
2. Cliquer "Uploader PDF"
3. Sélectionner le fichier PDF
4. Vérifier les versets extraits
5. Ajuster si nécessaire
6. Cliquer "Sauvegarder les versets"

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Tuer le processus sur le port
lsof -ti:5000 | xargs kill -9  # API
lsof -ti:5173 | xargs kill -9  # Frontend
```

### API ne répond pas
```bash
# Vérifier l'status
curl -s http://localhost:5000/api/authors | jq .

# Vérifier les logs
cat /tmp/api.log
```

### Erreur lors du PDF upload
- Vérifier que le PDF est un vrai fichier PDF
- Essayer avec un petit PDF d'abord
- Vérifier que la xassida est créée avant upload

---

## 📊 Base de Données

### Localisation
- `api/xassidas.db` (créated automatically)

### Structure
```sql
authors (id, name, description, photo_url, birth_year, death_year, tradition, created_at, updated_at)
xassidas (id, title, author_id FK, description, verse_count, chapter_count, language, created_at, updated_at)
verses (id, xassida_id FK, chapter_number, verse_number, verse_key, text_arabic, transcription, translation_fr, translation_en, words JSON, created_at, updated_at)
```

---

## 🚀 Prochaines Étapes

### Pour Intégrer les Données Existantes
```bash
# Si vous avez un script de seed
cd api
npm run seed  # (à créer si nécessaire)
```

### Pour Déployer
Voir `DEPLOYMENT-GUIDE.md` pour:
- Déployer l'API sur Render.com (gratuit)
- Déployer le frontend sur Vercel (gratuit)

---

## 📝 Fichiers Modifiés

✅ Frontend:
- `src/pages/Index.tsx` - Ajout route admin-xassidas
- `src/components/FloatingMenu.tsx` - Ajout bouton "Admin Xassidas"
- `src/components/screens/AdminXassidaScreen.tsx` - Correction env VITE_API_URL
- `.env.local` - Configuration VITE_API_URL

✅ Backend:
- `api/.env` - PORT=5000 et config
- `api/package.json` - npm run dev avec tsx watch

---

## 💬 Support

Pour les problèmes:
1. Vérifier les logs: `tail -f /tmp/api.log` et `tail -f /tmp/frontend.log`
2. Tester l'API directement: `curl http://localhost:5000/api/authors`
3. Vérifier que les ports sont libres: `netstat -tlnp | grep -E "(5000|5173)"`

---

**Status: ✅ Ready to Use!**

Lancez les serveurs avec les commandes ci-dessus et naviguez vers http://localhost:5173/ ! 🎉
