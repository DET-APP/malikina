# ✅ OCR Configuration Checklist - Render Deployment

**Date Complétée:** _______________  
**Utilisateur:** _______________

---

## Phase 1: Préparation (Local)

- [ ] Code OCR implémenté dans `api/routes/xassidas.ts` ✅ (déjà fait)
- [ ] TypeScript compiles sans erreurs ✅ (déjà fait)
- [ ] `api/.env.example` mis à jour ✅ (déjà fait)
- [ ] `OCR-SPACE-SETUP.md` créé ✅ (déjà fait)
- [ ] Clé API d'OCR.space obtenue depuis https://ocr.space/ocrapi
  - Email: _____________________
  - Clé: `OCR_SPACE_API_KEY` = _________________________ (sauvegardez cela!)

---

## Phase 2: Configuration Render

**Accédez à:** https://render.com/dashboard

### Pour le service `malikina-api` (dev branch):

1. [ ] Cliquez sur le service `malikina-api`
2. [ ] Allez à l'onglet **Environment**
3. [ ] Cliquez **Add Environment Variable**

### Ajoutez exactement ces 3 variables:

#### Variable 1: Clé API (OBLIGATOIRE)
```
Name:  OCR_SPACE_API_KEY
Value: [VOTRE_CLÉPASTE D'OCR.space]
```
- [ ] ✓ Copiée sans espaces extra

#### Variable 2: Langue
```
Name:  OCR_SPACE_LANGUAGE
Value: ara
```
- [ ] ✓ Exactement "ara" (arabe)

#### Variable 3: Moteur OCR
```
Name:  OCR_SPACE_ENGINE
Value: 2
```
- [ ] ✓ Moteur 2 = Tesseract 5.0 (le plus performant)

### Finalisez:
- [ ] Cliquez **Save** (en bas de la page)
- [ ] Attendez le statut: **"Deploy in progress"**
- [ ] Attendez **3-5 minutes** que le statut change à **"Live"**
- [ ] Vérifiez les logs (Deploy Logs tab) pour erreurs

---

## Phase 3: Test de Validation

### Test 1: Sante API
```bash
curl -s https://malikina-api.onrender.com/api/health
# Réponse attendue: Status 200
```
- [ ] ✓ API répond correctement

### Test 2: Upload PDF Dummy
```bash
# Créer un PDF de test (prétendez)
echo "Test document" > test.txt
file test.txt  # Vérifier que c'est fichier text

curl -s -X POST \
  -F "file=@test.txt" \
  https://malikina-api.onrender.com/api/xassidas/1/upload-pdf | jq .
```
- [ ] ✓ Répond sans erreur "API_KEY missing"
- [ ] ✓ Répond avec "extraction_method" field

### Test 3: Vérifier Extraction Method
```bash
# In response, look for:
"extraction_method": "ocr-space"   # OCR utilisée
# ou
"extraction_method": "pdf-parse"   # Native extraction
# ou
"extraction_method": "pdfjs"       # Fallback JS
```
- [ ] ✓ L'une des 3 méthodes est utilisée

### Test 4: Upload PDF Réel (Optionnel)
```bash
# Utilisez un PDF scanné réel ou un doctorat
curl -X POST \
  -F "file=@document-manuscrit.pdf" \
  https://malikina-api.onrender.com/api/xassidas/1/upload-pdf
```
- [ ] ✓ Extraction réussie
- [ ] ✓ Verses extraits: _____ (nombre)

---

## Phase 4: Validation Complète

### Interface Web
- [ ] Allez à https://malikina.vercel.app
- [ ] Naviguez à **Qassidas**
- [ ] Sélectionnez une Qassida
- [ ] Montez un PDF pour upload
- [ ] **Attendez 30 secondes** pour extraction

### Vérification des Logs Render
- [ ] Allez à https://render.com/dashboard
- [ ] Cliquez sur `malikina-api`
- [ ] Onglet **Logs**
- [ ] Cherchez: `"extraction_method": "ocr-space"`
- [ ] Pas d'erreurs "API_KEY" ou "Rate limit"

---

## Phase 5: Production (Optionnel)

Si tout fonctionne sur `dev`, replicatez sur `main` pour production:

### Option A: Automation
```bash
git fetch origin dev && \
git checkout dev && \
git pull && \
git checkout main && \
git merge dev && \
git push origin main
```
- [ ] ✓ Main branch mis à jour

### Option B: Manuel
1. [ ] Visitez https://github.com/DET-APP/malikina/pulls
2. [ ] Créez PR: `dev` → `main`
3. [ ] Mergers PR
4. [ ] Configurations Render pour `main` branch (répéter Phase 2)

---

## Dépannage

| Symptôme | Cause | Solution |
|----------|-------|----------|
| ❌ "OCR_SPACE_API_KEY missing" | Variable pas configurée | Vérifier Render Environment |
| ❌ "Rate limit exceeded" | >25 requêtes/jour | Attendre 24h ou plan payant |
| ❌ Extraction vide | PDF corrompu ou scanné très mal | Tester avec PDF texte simple |
| ❌ Deploy échoue | Erreur TypeScript | Vérifier logs Render, relancer build |
| ⏳ Deploy très lent | Service redémarrage | Attendre 5-10 minutes |

---

## Fichiers Importants

| Fichier | Raison |
|---------|--------|
| [OCR-SPACE-SETUP.md](OCR-SPACE-SETUP.md) | Documentation complète |
| [api/.env.example](api/.env.example) | Modèle variables (local) |
| [scripts/test-ocr-config.sh](scripts/test-ocr-config.sh) | Test automatisé |
| [QUICK-REFERENCE.md](QUICK-REFERENCE.md) | Raccourcis rapides |

---

## Success Metrics ✅

- [ ] OCR_SPACE_API_KEY ajoutée à Render
- [ ] Autres variables (LANGUAGE, ENGINE) ajoutées
- [ ] Service redéployé sans erreurs
- [ ] Healthcheck répond correctement
- [ ] Upload PDF réussit (texte ou OCR)
- [ ] Réponse inclut `extraction_method`
- [ ] Pas de logs d'erreur critiques

---

**Status Final:** _____ COMPLÈCÉ / EN ATTENTE

**Notes:**
```
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
```

**Prochain:** 
- [ ] Tester avec PDFs réels
- [ ] Monitorer usage OCR (limit 25/jour gratuit)
- [ ] Considérer plan payant si besoin >25/jour
- [ ] Documenter dans README de production
