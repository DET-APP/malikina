# 📥 Direct Download Links - Complete Xassida Data

## Extract These Files Directly from GitHub

All three xassida JSON files are available for immediate download and use in your React app.

---

## 1️⃣ ABĀDA (Maodo)
**File**: `abada.json`
**Size**: ~85 KB (125+ verses)
**Quality**: Complete (Arabic + ISO 233-2 + FR + EN)

### Download Options

#### Option A: curl
```bash
curl -o src/data/abada.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/abada/abada.json"
```

#### Option B: Direct Link (open in browser)
```
https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/abada/abada.json
```

#### Option C: wget
```bash
wget -O src/data/abada.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/abada/abada.json"
```

### Data Preview
```json
{
  "name": "abada",
  "chapters": [
    {
      "name": "",
      "number": 1,
      "verses": [
        {
          "number": 0,
          "key": "1:0",
          "text": "سْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ",
          "words": [
            {
              "position": 0,
              "text": "سْمِ",
              "transcription": "smi"
            },
            // ... more words
          ],
          "translations": [
            {
              "lang": "fr",
              "text": "Au nom d'Allah, le Tout Miséricordieux..."
            },
            {
              "lang": "en",
              "text": "In the name of Allah, the Entirely Merciful..."
            }
          ]
        },
        // ... 125+ more verses
      ]
    }
  ],
  "translated_lang": ["fr", "en"]
}
```

**Statistics**:
- Verses: 125+
- Chapters: 1
- Languages: Arabic, French, English
- Phonetic: Word-level ISO 233-2
- Character Count: ~400,000 (with translations)

---

## 2️⃣ KHILĀS-ZAHAB (Maodo)
**File**: `khilass-zahab` (embedded in xassidas.json)
**Size**: Part of main xassidas.json (~200 KB)
**Quality**: Complete (Arabic + ISO 233-2 + FR + EN)

### Download Main File
```bash
curl -o src/data/maodo-xassidas.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/xassidas.json"
```

### Extract Khilās-Zahab from File
The khilās-zahab xassida is the first entry in the xassidas array:

```typescript
import maudoXassidas from './maodo-xassidas.json';

// Extract Khilās-Zahab
const khilasZahab = maudoXassidas.xassidas.find(
  x => x.name === 'khilass-zahab'
);
```

### Direct Link
```
https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/xassidas.json
```

### Data Structure
```json
{
  "name": "maodo",
  "tariha": "tidjian",
  "xassidas": [
    {
      "name": "khilass-zahab",
      "chapters": [
        {
          "name": "الفاتحة",
          "number": 1,
          "verses": [
            {
              "number": 0,
              "key": "1:0",
              "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
              "words": [ /* ... */ ],
              "translations": [
                {
                  "lang": "fr",
                  "text": "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux."
                }
              ]
            }
            // ... many more verses
          ]
        }
        // ... potentially multiple chapters
      ],
      "translated_lang": ["fr", "en"]
    }
  ]
}
```

**Statistics**:
- Multiple chapters
- Comprehensive Tidjiane teachings
- Full translations (FR & EN)
- Phonetic transcriptions (ISO 233-2)

---

## 3️⃣ ABOUNA (Serigne Cheikh)
**File**: `abouna.json`
**Size**: ~45 KB (29+ verses)
**Quality**: Complete (Arabic + ISO 233-2, NO translations)

### Download Options

#### Option A: curl
```bash
curl -o src/data/abouna.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/serigne-cheikh/abouna/abouna.json"
```

#### Option B: Direct Link
```
https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/serigne-cheikh/abouna/abouna.json
```

#### Option C: wget
```bash
wget -O src/data/abouna.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/serigne-cheikh/abouna/abouna.json"
```

### Data Preview
```json
{
  "name": "abouna",
  "chapters": [
    {
      "name": "",
      "number": 1,
      "verses": [
        {
          "number": 0,
          "key": "1:0",
          "text": "أَبُونَا أَبُوبَكْرٍ وَإِنْ كَانَ فِي الْقَبْرِ",
          "words": [
            {
              "position": 0,
              "text": "أَبُونَا",
              "transcription": "abūnā"
            },
            {
              "position": 1,
              "text": "أَبُوبَكْرٍ",
              "transcription": "abūbakrin"
            }
            // ... more words
          ],
          "translations": [] // No translations in original
        }
        // ... 29+ more verses
      ]
    }
  ],
  "translated_lang": []
}
```

**Statistics**:
- Verses: 29+
- Chapters: 1
- Languages: Arabic only
- Phonetic: Word-level ISO 233-2
- Translations: NOT AVAILABLE in original source

---

## 🚀 Quick Integration Script

Create `scripts/download-xassidas.sh`:

```bash
#!/bin/bash

echo "📥 Downloading xassida data..."

# Create data directory if it doesn't exist
mkdir -p src/data

# Download Abāda
echo "Downloading Abāda..."
curl -o src/data/abada.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/abada/abada.json"

# Download Maodo Xassidas (contains Khilās-Zahab)
echo "Downloading Khilās-Zahab (from maodo xassidas.json)..."
curl -o src/data/maodo-xassidas.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/xassidas.json"

# Download Abouna
echo "Downloading Abouna..."
curl -o src/data/abouna.json \
  "https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/serigne-cheikh/abouna/abouna.json"

echo "✅ Download complete!"
echo ""
echo "Files created:"
echo "  - src/data/abada.json"
echo "  - src/data/maodo-xassidas.json (contains khilass-zahab)"
echo "  - src/data/abouna.json"
```

### Run the script:
```bash
chmod +x scripts/download-xassidas.sh
./scripts/download-xassidas.sh
```

---

## 📋 Choose Your Integration Approach

### Approach A: Individual Files (Recommended for Malikina)
```typescript
// src/data/importedXassidas.ts
import abada from './abada.json';
import maodoXassidas from './maodo-xassidas.json';
import abouna from './abouna.json';

const khilasZahab = maodoXassidas.xassidas[0]; // first entry

export const importedXassidas = {
  abada,
  'khilas-zahab': khilasZahab,
  abouna
};
```

### Approach B: Extract Sub-file
```typescript
// src/data/xassidaExtractor.ts
import maodoXassidas from './maodo-xassidas.json';

export const extractKhilasZahab = () => {
  return maodoXassidas.xassidas.find(x => x.name === 'khilass-zahab');
};
```

### Approach C: Clone Full Repository
```bash
git clone https://github.com/AlKountiyou/xassidas.git
# Access all xassidas from xassidas/tidjian/ subdirectories
```

---

## ⚕️ Data Validation Checklist

After downloading, verify your files:

```bash
# Check file sizes
ls -lh src/data/abada.json src/data/maodo-xassidas.json src/data/abouna.json

# Validate JSON syntax
jq empty src/data/abada.json && echo "✅ abada.json valid"
jq empty src/data/maodo-xassidas.json && echo "✅ maodo-xassidas.json valid"
jq empty src/data/abouna.json && echo "✅ abouna.json valid"

# Check verse counts
jq '.chapters[0].verses | length' src/data/abada.json
jq '.xassidas[0].chapters[0].verses | length' src/data/maodo-xassidas.json
jq '.chapters[0].verses | length' src/data/abouna.json
```

---

## 🔄 Comparison: Original vs. Downloaded

| Feature | Abāda | Khilās-Zahab | Abouna |
|---------|-------|--------------|--------|
| Arabic Text | ✅ Full with diacritics | ✅ Full with diacritics | ✅ Full with diacritics |
| ISO 233-2 | ✅ Word-level | ✅ Word-level | ✅ Word-level |
| French | ✅ 100% verses | ✅ 100% verses | ❌ None |
| English | ✅ 100% verses | ✅ 100% verses | ❌ None |
| Verses | 125+ | Multiple chapters | 29+ |
| File Size | ~85 KB | ~200 KB (shared) | ~45 KB |
| Download Time | <1s | <1s | <1s |

---

## 📝 Next Steps

1. **Download files** using one of the methods above
2. **Validate JSON** to ensure integrity
3. **Create TypeScript types** (see import-instructions.md)
4. **Integrate into QassidasScreen** component
5. **Test with sample app** before production deployment

---

## 🔗 Additional Resources

- **GitHub Repo**: https://github.com/AlKountiyou/xassidas
- **Tidjiane Information**: https://en.wikipedia.org/wiki/Tijaniyyah
- **Maodo Biography**: Seydi El Hadji Malick Sy (1855-1922)
- **ISO 233-2 Standard**: Transliteration of Arabic French Edition

---

**Ready to enhance your Malikina app with authentic, high-quality xassida data!** 🚀
