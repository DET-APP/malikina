#!/bin/bash

# Extraire TOUS les versets et créer un fichier complet
cat src/data/maodoXassidas.ts | grep -o 'key: "[^"]*", text: "[^"]*", transcription: "[^"]*"' | sed 's/key: "[^"]*", text: "\([^"]*\)", transcription: "\([^"]*\)"/\1 - \2/' > /tmp/all_verses.txt

# Afficher les 5 premiers et 5 derniers pour vérifier
echo "=== FIRST 5 VERSES ==="
head -5 /tmp/all_verses.txt
echo ""
echo "=== LAST 5 VERSES ==="
tail -5 /tmp/all_verses.txt
echo ""
echo "TOTAL VERSES:"
wc -l /tmp/all_verses.txt
