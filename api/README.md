# 🎯 Malikina Xassida API

API RESTful pour gérer les xassidas (poésie islamique tidjiane) avec CRUD complet.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

API disponible sur `http://localhost:5000`

## 📚 Endpoints

### Authors (Auteurs)
```
GET    /api/authors              # Liste tous les auteurs
POST   /api/authors              # Créer auteur
GET    /api/authors/:id          # Détails auteur
PUT    /api/authors/:id          # Modifier auteur
DELETE /api/authors/:id          # Supprimer auteur
```

### Xassidas
```
GET    /api/xassidas             # Liste toutes les xassidas
POST   /api/xassidas             # Créer xassida
GET    /api/xassidas/:id         # Détails xassida avec versets
PUT    /api/xassidas/:id         # Modifier xassida
DELETE /api/xassidas/:id         # Supprimer xassida
```

### Verses (Versets)
```
GET    /api/xassidas/:id/verses  # Liste versets d'une xassida
POST   /api/xassidas/:id/verses  # Ajouter versets
POST   /api/xassidas/:id/upload-pdf  # Upload PDF → extraction versets
```

## 📝 Examples

### Créer un auteur
```bash
curl -X POST http://localhost:5000/api/authors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maodo",
    "description": "Grand saint musulman tidjiane",
    "photo_url": "https://example.com/photo.jpg",
    "tradition": "Tidjiane",
    "birth_year": 1883,
    "death_year": 1968
  }'
```

### Créer une xassida
```bash
curl -X POST http://localhost:5000/api/xassidas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Abāda",
    "author_id": "uuid-from-author",
    "description": "Xassida majeure avec 125 versets"
  }'
```

### Ajouter des versets
```bash
curl -X POST http://localhost:5000/api/xassidas/{id}/verses \
  -H "Content-Type: application/json" \
  -d '{
    "verses": [
      {
        "verse_number": 1,
        "text_arabic": "أَبَدَا بُرُوقٌ تَحْتَ جُنْحِ ظَلَامِ",
        "transcription": "abadā burūqun taḥta junḥi ẓalāmi",
        "translation_fr": "Éternellement des éclairs sous l'aile de l'obscurité",
        "translation_en": "Forever lightning beneath the wing of darkness"
      }
    ]
  }'
```

### Upload et extraire PDF
```bash
curl -X POST http://localhost:5000/api/xassidas/{id}/upload-pdf \
  -F "file=@document.pdf"
```

## 🗄️ Base de données

SQLite (fichier: `xassidas.db`)

Schéma:
- `authors` - Auteurs des xassidas
- `xassidas` - Xassidas
- `verses` - Versets de chaque xassida

Créé automatiquement au démarrage.

## 🔧 Configuration

Fichier `.env`:
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 📦 Dépendances

- `express` - Serveur web
- `cors` - Cross-origin
- `multer` - Upload fichiers
- `pdfjs-dist` - Extraction PDF
- `uuid` - Identifiants uniques
- `sqlite3` - Base de données

## 🚀 Déploiement

Voir [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md)

- Backend: Render.com (gratuit)
- Frontend: Vercel (gratuit)

## 📂 Structure

```
api/
├── server.ts           # Point d'entrée
├── db/
│   └── schema.ts       # Schéma & fonctions DB
├── routes/
│   ├── xassidas.ts     # Endpoints xassidas
│   └── authors.ts      # Endpoints auteurs
├── package.json
└── tsconfig.json
```

## ✅ Tests

```bash
# Health check
curl http://localhost:5000/health

# Lister auteurs
curl http://localhost:5000/api/authors

# Lister xassidas  
curl http://localhost:5000/api/xassidas
```

## 📞 Support

Voir documentation:
- [API-SETUP.md](../API-SETUP.md)
- [FRONTEND-INTEGRATION.md](../FRONTEND-INTEGRATION.md)
- [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md)
