# 🎨 Intégration de l'interface Admin Frontend

## Ajouter l'écran admin au projet

### 1. L'écran admin est déjà créé:
📁 `src/components/screens/AdminXassidaScreen.tsx`

### 2. Ajouter au routage principal

**Fichier**: `src/pages/Index.tsx`

Ajouter l'import en haut:
```typescript
import { XassidasAdmin } from '@/components/screens/AdminXassidaScreen';
```

Puis dans le switch de rendu (vers la ligne 100):
```typescript
case 'admin-xassidas':
  return <XassidasAdmin />;
```

### 3. Ajouter le bouton de navigation

**Fichier**: `src/components/BottomNavigation.tsx`

Ajouter un bouton dans le menu de navigation (chercher le rendu des boutons):
```typescript
<NavLink 
  icon={<Settings className="w-6 h-6" />}
  label="Admin"
  isActive={activeScreen === 'admin-xassidas'}
  onClick={() => onNavigate('admin-xassidas')}
/>
```

### 4. Alternative: Ajouter au menu flottant

**Fichier**: `src/components/FloatingMenu.tsx`

Ajouter dans les options du menu:
```typescript
{
  icon: <Settings className="w-6 h-6" />,
  label: 'Gestion Xassidas',
  action: () => onNavigate('admin-xassidas')
}
```

---

## Configuration API

### Fichier `.env.local` (créer à la racine):

```
REACT_APP_API_URL=http://localhost:5000/api
```

**Pour production (Render/Vercel)**:
```
REACT_APP_API_URL=https://malikina-api.onrender.com/api
```

### Pour Vite, ajouter à `vite.config.ts`:

```typescript
export default defineConfig({
  // ... config existante
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

---

## Tester l'interface

### 1. Démarrer l'API
```bash
cd api
npm install
npm run dev
```
✅ API sur `http://localhost:5000`

### 2. Démarrer le frontend
```bash
npm run dev
```
✅ App sur `http://localhost:5173`

### 3. Naviguer vers l'admin
- Cliquer sur le bouton "Admin" ou "Gestion Xassidas"
- Devrait voir l'interface CRUD

---

## Fonctionnalités de l'interface admin

✅ **Gestion Auteurs**
- Créer / Lire / Mettre à jour / Supprimer
- Ajouter photo et description
- Renseigner tradition (Tidjiane, etc.)

✅ **Gestion Xassidas**
- Créer / Lire / Mettre à jour / Supprimer
- Lier à un auteur
- Afficher nombre de versets

✅ **Gestion Versets**
- Upload PDF → Extraction texte
- Édition manuelle avant validation
- Ajouter transcription ISO 233-2
- Ajouter traductions (FR/EN)

✅ **Validation**
- Prévisualisation des versets
- Modification ligne par ligne
- Sauvegarde en base de données

---

## Améliorations possibles

### UI/UX
- [ ] Pagination pour les listes
- [ ] Recherche/filtrage par auteur
- [ ] Drag-and-drop pour réordonner versets
- [ ] Édition en masse

### PDF
- [ ] Améliorer extraction PDF (meilleur parser)
- [ ] Support multiples langues
- [ ] OCR pour documents numérisés

### Database
- [ ] Ajouter timestamps
- [ ] Soft delete
- [ ] Audit trail (qui a modifié quoi)

### Auth
- [ ] Login admin
- [ ] Rôles (admin, éditeur, lecteur)
- [ ] Permission-based actions

---

## 🚀 Prêt à déployer!

Voir [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) pour déployer gratuitement.
