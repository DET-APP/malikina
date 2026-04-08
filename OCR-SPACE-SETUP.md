# Configuration OCR.space sur Render

## 🚀 Étapes de Configuration

### 1. Sur Render Dashboard
1. Allez à https://render.com/dashboard
2. Cliquez sur le service **malikina-api** (en déploiement sur dev branch)
3. Allez à l'onglet **Environment**
4. Cliquez sur **Add Environment Variable**

### 2. Variables à Ajouter

Ajoutez ces 3 variables d'environnement (copier-coller exact) :

| Variable | Valeur | Explication |
|----------|--------|-------------|
| `OCR_SPACE_API_KEY` | `VOTRE_CLÉ_API` | Clé API d'OCR.space (obligatoire) |
| `OCR_SPACE_LANGUAGE` | `ara` | Langue : arabe |
| `OCR_SPACE_ENGINE` | `2` | Moteur OCR : 2 = Tesseract 5.0 (plus performant) |

**Où obtenir votre clé API:** https://ocr.space/ocrapi

### 3. Ajouter la Clé API

```
1. Ouvrez https://ocr.space/ocrapi
2. Remplissez le formulaire (email, nom)
3. Cliquez "Get API Key"
4. Vous recevrez une clé par email
5. Copiez cette clé dans Environment Variable OCR_SPACE_API_KEY sur Render
```

### 4. Sauvegarder et Déployer

1. Après ajouter les 3 variables, cliquez **Save**
2. Render va redéployer automatiquement le service
3. Attendez que le déploiement finisse (statut = "Live")

---

## ✅ Comment Tester

Après déploiement, testez l'extraction OCR :

### Option 1: Curl (Terminal)
```bash
# Créer un fichier de test (texte simplifié)
echo "أَلَحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" > test-ar.txt

# Télécharger et tester
curl -X POST \
  -F "file=@test-ar.txt" \
  https://malikina-api.onrender.com/api/xassidas/1/upload-pdf

# Réponse attendue:
# {"message":"PDF processed","verses":[],"extraction_method":"ocr-space"}
```

### Option 2: Tester via l'Interface (Web)
1. Accédez à https://malikina.vercel.app
2. Allez à **Qassidas** → Sélectionnez une Qassida
3. Attendez que **Télécharger PDF** soit visible
4. Téléchargez un PDF scanné ou manuscrit
5. Vérifiez que les versets s'extraient correctement

---

## 🔍 Vérifier la Configuration

Pour vérifier que les variables sont bien configurées:

```bash
# Accédez à la config Render via API (optionnel)
curl https://malikina-api.onrender.com/api/health

# Vous devriez voir un statut 200 OK
```

---

## 📊 Méthodes d'Extraction (Ordre de Priorité)

L'API utilise cette cascade automatiquement:

```
1. pdf-parse (native Node.js) ✓ Rapide si disponible
2. pdfjs-dist (fallback js) ✓ Si pdf-parse échoue
3. OCR.space (cloud OCR) ✓ Si texte = vide (déploiement réel)
                          ✗ En local (pas de clé API configurée)
```

**Champ de débogage:** Chaque réponse inclut `"extraction_method"` pour savoir quelle méthode a été utilisée :
```json
{
  "message": "PDF processed",
  "verses": [...],
  "extraction_method": "ocr-space"  // ou "pdf-parse" ou "pdfjs"
}
```

---

## ⚠️ Dépannage

### Erreur: "OCR non configuré: OCR_SPACE_API_KEY manquant"
→ **Solution:** Vérifiez que `OCR_SPACE_API_KEY` est bien dans Environment sur Render

### Erreur: "OCR.space: Free API key uses 25 requests/day"
→ **Solution:** Vous avez dépassé 25 requêtes. Attendez 24h ou achetez un plan payant

### Extraction vide malgré OCR configuré
→ **Solution:** Le PDF est peut-être corrompu. Testez avec un PDF simple texte d'abord

### Déploiement prend trop longtemps
→ **Solution:** Render redéploie le service. Attendez 2-3 minutes

---

## 📝 Fichier .env.example (À Ajouter)

Pour documenter les variables requises, créez/mettez à jour `api/.env.example`:

```
# API Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=xassidas.db

# OCR Configuration (pour extraction PDF améliorée)
OCR_SPACE_API_KEY=your_api_key_here
OCR_SPACE_LANGUAGE=ara
OCR_SPACE_ENGINE=2
# OCR_SPACE_ENDPOINT=https://api.ocr.space/parse/image (optionnel)
```

---

## 🎯 Checklist Finale

- [ ] Clé API OCR.space obtenue depuis https://ocr.space/ocrapi
- [ ] `OCR_SPACE_API_KEY` ajoutée à Render Environment
- [ ] `OCR_SPACE_LANGUAGE=ara` ajoutée
- [ ] `OCR_SPACE_ENGINE=2` ajoutée
- [ ] Service malikina-api redéployé (statut = Live)
- [ ] Test curl ou web réussi
- [ ] Réponse inclut `"extraction_method": "ocr-space"`

---

**Besoin d'aide?** Vérifiez les logs Render:
1. Render Dashboard → malikina-api → Logs
2. Cherchez "OCR" ou erreurs de déploiement
3. Redéployez si nécessaire (Deploys tab → Manual deploy)
