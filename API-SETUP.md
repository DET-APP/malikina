# 🎯 Installation et setup API

## Installation rapide

### 1. Backend API

```bash
cd api
npm install
npm run dev
```

✅ API sur `http://localhost:5000`

Endpoints disponibles:
- `GET  /api/xassidas` - Liste des xassidas
- `POST /api/xassidas` - Créer xassida
- `GET  /api/xassidas/:id` - Détails xassida
- `PUT  /api/xassidas/:id` - Modifier xassida
- `DELETE /api/xassidas/:id` - Supprimer xassida
- `POST /api/xassidas/:id/verses` - Ajouter versets
- `POST /api/xassidas/:id/upload-pdf` - Upload PDF

- `GET  /api/authors` - Liste auteurs
- `POST /api/authors` - Créer auteur
- `GET  /api/authors/:id` - Détails auteur
- `PUT  /api/authors/:id` - Modifier auteur
- `DELETE /api/authors/:id` - Supprimer auteur

### 2. Frontend

```bash
npm run dev
```

✅ App sur `http://localhost:5173`

### 3. Ajouter l'interface admin

Dans `src/pages/Index.tsx`, ajouter l'écran admin:

```typescript
import { XassidasAdmin } from '@/components/screens/AdminXassidaScreen';

// Dans la fonction de rendu, ajouter:
case 'admin-xassidas':
  return <XassidasAdmin />;
```

Dans `src/components/BottomNavigation.tsx`, ajouter le bouton:

```typescript
<button onClick={() => onNavigate('admin-xassidas')}>
  <Settings className="w-6 h-6" />
</button>
```

### 4. Test simple

```bash
# Test santé API
curl http://localhost:5000/health

# Créer un auteur
curl -X POST http://localhost:5000/api/authors \
  -H "Content-Type: application/json" \
  -d '{"name":"Maodo","tradition":"Tidjiane"}'

# Lister les auteurs
curl http://localhost:5000/api/authors
```

---

## 📁 Structure API

### Fichiers créés:

```
api/
├── server.ts              # Serveur Express principal
├── package.json           # Dépendances
├── tsconfig.json          # Config TypeScript
├── .env.example           # Variables d'environnement
├── db/
│   └── schema.ts          # Schéma et fonctions DB
└── routes/
    ├── xassidas.ts        # Endpoints xassidas
    └── authors.ts         # Endpoints auteurs
```

### Base de données (SQLite):

```
xassidas/
├── authors
│   - id (UUID)
│   - name
│   - description
│   - photo_url
│   - birth_year
│   - death_year
│   - tradition

├── xassidas
│   - id (UUID)
│   - title
│   - author_id (FK)
│   - description
│   - verse_count
│   - chapter_count

└── verses
    - id (UUID)
    - xassida_id (FK)
    - chapter_number
    - verse_number
    - verse_key (format: "1:5")
    - text_arabic
    - transcription
    - translation_fr
    - translation_en
    - words (JSON)
```

---

## 🔧 Configuration

### Variables d'environnement (api/.env):

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Modification de l'API URL frontend:

Dans `src/components/screens/AdminXassidaScreen.tsx` ~ligne 13:

```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

---

## 📝 Utilisation

### Créer un auteur:

```typescript
const response = await fetch('http://localhost:5000/api/authors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Maodo',
    description: 'Grand saint musulman',
    photo_url: 'https://...',
    tradition: 'Tidjiane'
  })
});
const author = await response.json();
```

### Créer une xassida:

```typescript
const response = await fetch('http://localhost:5000/api/xassidas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Abāda',
    author_id: 'uuid-du-maodo',
    description: 'Xassida majeure...'
  })
});
const xassida = await response.json();
```

### Ajouter des versets:

```typescript
const response = await fetch('http://localhost:5000/api/xassidas/{id}/verses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verses: [
      {
        verse_number: 1,
        text_arabic: 'أَبَدَا بُرُوقٌ...',
        transcription: 'abadā burūqun...',
        translation_fr: 'Eternel éclair...'
      }
    ]
  })
});
```

### Upload PDF:

```typescript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('http://localhost:5000/api/xassidas/{id}/upload-pdf', {
  method: 'POST',
  body: formData
});
const result = await response.json();
// result.verses contient les versets extraits
```

---

## ✅ Checklist

- [ ] `npm install` dans `/api`
- [ ] `npm run dev` dans `/api` 
- [ ] API répond sur `http://localhost:5000/health`
- [ ] Frontend devrait faire requête à `http://localhost:5000/api`
- [ ] Tester création d'auteur via interface admin
- [ ] Tester création de xassida
- [ ] Tester upload PDF

---

## 🚀 Prochaine étape

Lire [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) pour déploiement gratuit sur Render + Vercel
