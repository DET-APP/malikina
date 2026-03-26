# PWA Configuration - Al Moutahabbina Fillahi

Cette documentation décrit la configuration Progressive Web App (PWA) du projet.

## Vue d'ensemble

Le projet est maintenant configuré comme une PWA complète avec:
- ✅ Service Worker pour offline support
- ✅ Manifest.json pour installation native
- ✅ Caching stratégies intelligentes
- ✅ Support des notifications push
- ✅ Interface d'installation personnalisée
- ✅ Détection des mises à jour

## Architecture PWA

### 1. Service Worker (`public/service-worker.js`)

**Stratégies de cache:**
- **Cache First** pour les assets statiques (CSS, JS, images)
- **Network First** pour les appels API avec fallback cache
- **Runtime caching** pour les données dynamiques

**Fonctionnalités:**
- Installation automatique du cache
- Cleanup des anciennes versions
- Support offline basique
- Synchronisation en arrière-plan (optionnel)
- Notifications push (optionnel)

### 2. Manifest Web App (`public/manifest.json`)

Fichier de configuration pour:
- Métadonnées de l'app (nom, description, couleurs)
- Icônes pour les homescreens
- Shortcuts (Prière, Coran)
- Screenshots pour l'App Store
- Display mode: `standalone` (app full-screen)

### 3. Configuration Vite (`vite.config.ts`)

**Plugin PWA:** `vite-plugin-pwa` avec:
- Auto-injection du manifest
- Service worker customisé
- Runtime caching Workbox
- Caching des fichiers audio (.mp3, .wav, .ogg)
- Caching des appels API avec timeout réseau

### 4. Hooks React (`src/hooks/usePWA.ts`)

**Exports:**
```typescript
// Installation
usePWAInstall() 
  → { isInstallable, isInstalled, installApp() }

// Mises à jour
usePWAUpdate()
  → { updateAvailable, updatePending, skipWaiting() }

// Statut global
usePWA()
  → { isOnline, isPWA, ...all above }
```

### 5. Composants (`src/components/PWAPrompt.tsx`)

- `<PWAInstallPrompt />` - Propose l'installation après 5 secondes
- `<PWAUpdatePrompt />` - Notifie des mises à jour disponibles
- Déjà intégrés dans `App.tsx`

## Installation Progressive

### Pour l'utilisateur final

1. **Visite l'app** → Attend 5 secondes
2. **Notification "Installer l'application"** s'affiche
3. **Clique "Installer"** → App s'ajoute à l'écran d'accueil
4. **Accès offline** → Tout fonctionne en arrière-plan

### Pour les développeurs

```bash
# Développement avec PWA
npm run dev
# DevTools → Application → Service Workers

# Build production PWA
npm run build
# Service worker généré automatiquement

# Tester localement
npm run preview
# Installez l'app depuis le navigateur
```

## Offline Support

Le service worker cache:
- **Pages statiques:** `index.html`, manifest
- **Assets:** CSS, JS, images, polices
- **API calls:** Dernière réponse mise en cache
- **Fichiers audio:** Qur'an, Qassidas (CacheFirst)

### Ce qui fonctionne offline
- ✅ Navigation entre écrans
- ✅ Données en cache (Coran, Qassidas)
- ✅ Paramètres utilisateur (localStorage)
- ✅ Horaires de prière (si déjà fetchés)

### Ce qui nécessite la connexion
- ❌ Actualisation des données API
- ❌ Téléchargement de nouvelles resources
- ❌ Nouvelles notifications

## Gestion des Mises à Jour

### Détection automatique
Service worker check une fois par minute en production, le système détecte:
1. **Nouvelle version disponible** → Notif "Mise à jour disponible"
2. **L'utilisateur clique "Mettre à jour"** → Skip waiting + reload
3. **Nouvelle version active** → App refresh automatiquement

### Désactiver la notif de mise à jour
Modifiez `src/components/PWAPrompt.tsx`:
```typescript
// Commentez pour cacher la notification
{/* <PWAUpdatePrompt /> */}
```

## Configuration des Icônes

### Fichiers requis
```
public/icons/
├── icon-192.png          # App icon 192×192
├── icon-192-maskable.png # Adaptive icon
├── icon-512.png          # App icon 512×512
└── icon-512-maskable.png # Adaptive icon large
```

### Générer les icônes
Voir [PWA-ICONS-GUIDE.md](../PWA-ICONS-GUIDE.md) pour:
- Outils en ligne (PWA Builder, Maskable App)
- Commands CLI (ImageMagick, FFmpeg)
- Spécifications détaillées

## Stratégies de Cache

### Audio & Médias
```
Pattern: *.mp3, *.wav, *.ogg
Strategy: Cache First (lire hors-ligne)
Max entries: 50
```

### API Calls
```
Pattern: /api/*
Strategy: Network First (données fraiches)
Timeout réseau: 5 secondes
Max entries: 100
```

### Assets Statiques
```
Pattern: *.js, *.css, *.png, *.svg
Strategy: Cache First
```

## Notifications Push (Optionnel)

### Backend requis
Pour activer les notifications:

```javascript
// Envoyer notification depuis le service worker
self.registration.showNotification('Title', {
  body: 'Message',
  icon: '/icons/icon-192.png',
  tag: 'prayer-time'
});
```

### UI déjà supportée
- Icône notification
- Action au clic
- Sound & vibration

## Web Share API (Bonus)

Pour partager du contenu (Coran, Qassidas):

```typescript
// Dans un composant
const handleShare = async (text, url) => {
  if (navigator.share) {
    await navigator.share({
      title: 'Al Moutahabbina',
      text: text,
      url: url
    });
  }
};
```

## Testing PWA

### Chrome DevTools
```
1. Ouvrir DevTools (F12)
2. Tab "Application"
3. Vérifier "Manifest" + "Service Workers"
4. Lighthouse → "PWA" pour scoring
```

### Test Offline
```
1. DevTools → Network
2. Checkbox "Offline"
3. Recharger page
4. Vérifier que l'app charge depuis le cache
```

### Test Installation
```
1. Chrome: ⋯ → "Install app"
2. Ou scanner QR code depuis l'app
3. Vérifier icône sur homescreen
```

### Lighthouse PWA Score
Cible: **90+/100**

Critères:
- ✅ Manifest valide
- ✅ HTTPS (production)
- ✅ Service worker actif
- ✅ Responsive design
- ✅ Icônes correctes
- ✅ Temps de chargement < 3s

## Dépannage

| Problème | Solution |
|----------|----------|
| App non installable | Vérifier manifest.json dans DevTools |
| Service Worker non enregistré | Vérifier console pour erreurs, HTTPS requis en prod |
| Icônes ne s'affichent pas | Vérifier chemins dans manifest.json |
| Offline ne fonctionne pas | Vérifier DevTools Service Workers |
| Mise à jour ne détecte rien | Attendre 1-5 minutes, vérifier vite.config.ts |

## Fichiers Modifiés/Créés

```
├── public/
│   ├── manifest.json              # Nouveau - Métadonnées PWA
│   ├── service-worker.js          # Nouveau - Service Worker
│   └── icons/                     # Nouveau - Dossier icônes
├── src/
│   ├── hooks/usePWA.ts            # Nouveau - Hooks PWA
│   ├── components/PWAPrompt.tsx   # Nouveau - UI prompts
│   ├── App.tsx                    # Modifié - Import PWA prompts
│   └── index.html                 # Modifié - Meta tags PWA
├── vite.config.ts                 # Modifié - Plugin PWA
└── package.json                   # Modifié - vite-plugin-pwa
```

## Production Checklist

- [ ] Générer toutes les icônes PNG (voir PWA-ICONS-GUIDE.md)
- [ ] Placer icônes dans `public/icons/`
- [ ] Tester offline dans DevTools
- [ ] Tester installation sur mobile
- [ ] Vérifier Lighthouse PWA score (90+)
- [ ] HTTPS activé en production
- [ ] Tester notifications (optional)
- [ ] Documenter pour l'équipe

## Resources

- **MDN PWA Documentation:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Vite PWA Plugin:** https://vite-pwa-org.netlify.app/
- **PWA Builder:** https://www.pwabuilder.com/
- **Maskable Icons:** https://maskable.app/
- **Google PWA Checklist:** https://developers.google.com/web/progressive-web-apps/checklist

---

**Dernière mise à jour:** Mars 26, 2026
