# Xassidas Data Extraction Guide

## 📚 Source Repository
**Repository**: https://github.com/AlKountiyou/xassidas  
**Path**: `xassidas/tidjian/`  
**Extraction Date**: March 26, 2026

---

## 🎯 Extracted Works

This folder contains structured JSON data for three major xassidas from the Tidjiane tradition:

### 1. **Abāda** (Maodo - Seydi El Hadji Malick Sy)
- **Raw JSON**: `abada.json`
- **Text File**: `abada.txt`
- **Verses**: 125+ 
- **Translations**: French (FR) + English (EN)
- **Structure**: 1 Chapter (الفاتحة intro + main content)
- **Phonetic**: ISO 233-2 word-level transcriptions

**File Path in Source**:
```
xassidas/tidjian/maodo/abada/abada.json
```

### 2. **Khilās-Zahab** (Maodo)
- **Raw JSON**: `khilassa-zahab.json`
- **Text File**: `khilassa-zahab.txt`
- **Verses**: Full work with multiple chapters
- **Translations**: French (FR) + English (EN)
- **Phonetic**: ISO 233-2 word-level transcriptions

**File Path in Source**:
```
xassidas/tidjian/maodo/xassidas.json (contains khilass-zahab entry)
```

**Note**: Complete Khilās-Zahab data is embedded in the maodo `xassidas.json` file.

### 3. **Abouna** (Serigne Cheikh - Seydina Malick Sy's teacher)
- **Raw JSON**: `abouna.json`
- **Text File**: `abouna.txt`
- **Verses**: 29+
- **Translations**: Not included in original (empty translations array)
- **Structure**: 1 Chapter
- **Phonetic**: ISO 233-2 word-level transcriptions

**File Path in Source**:
```
xassidas/tidjian/serigne-cheikh/abouna/abouna.json
```

**⚠️ Important**: Abouna is by **Serigne Cheikh** (not Maodo). It's the spiritual teacher's composition.

---

## 📋 Data Structure

### JSON Schema

```json
{
  "name": "xassida-name",
  "chapters": [
    {
      "name": "chapter-name-ar",
      "number": 1,
      "verses": [
        {
          "number": 0,
          "key": "1:0",
          "text": "Arabic text with full diacritics (tashkīl)",
          "words": [
            {
              "position": 0,
              "text": "word-with-diacritics",
              "transcription": "iso-233-2-transcription"
            }
          ],
          "translations": [
            {
              "lang": "fr",
              "text": "French translation of verse",
              "author": ""
            },
            {
              "lang": "en",
              "text": "English translation of verse",
              "author": ""
            }
          ]
        }
      ]
    }
  ],
  "translated_names": [
    {
      "lang": "fr",
      "translation": "Work name in French",
      "transcription": ""
    },
    {
      "lang": "en",
      "translation": "Work name in English",
      "transcription": ""
    }
  ],
  "audios": [],
  "translated_lang": ["fr", "en"]
}
```

### Key Fields

| Field | Description | Example |
|-------|-------------|---------|
| `text` | Full Arabic with diacritics | "أَبَدَا بُرُوقٌ" |
| `transcription` (ISO 233-2) | Phonetic Latin transcription | "abadā burūqun" |
| `translations[].lang` | Language code | "fr", "en" |
| `translations[].text` | Verse translation | "L'éternité éclair..." |
| `key` | Chapter:Verse identifier | "1:0", "1:1" |

---

## 🔤 Transcription System: ISO 233-2 (Transliteration Français)

The phonetic transcriptions follow **ISO 233-2** (French version):

### Common Mappings
| Arabic | ISO 233-2 | Example |
|--------|-----------|---------|
| ب | b | bismi = "in the name of" |
| ت | t | taḥta = "beneath" |
| ث | th | tharwa = "wealth" |
| ج | j | jurah = "wound" |
| ح | ḥ | ḥamdu = "praise" |
| خ | kh | khayru = "good" |
| ز | z | zahab = "gold" |
| س | s | salam = "peace" |
| ش | sh | sharif = "noble" |
| ص | ṣ | ṣirah = "path" |
| ض | ḍ | ḍalim = "oppressor" |
| ط | ṭ | ṭalaba = "sought" |
| ظ | ẓ | ẓalim = "oppressor" |
| ع | ʿ | ʿaliy = "high" |
| غ | gh | ghayb = "unseen" |
| ف | f | faqir = "poor" |
| ق | q | qawm = "people" |
| ك | k | karim = "generous" |
| ل | l | layla = "night" |
| م | m | malik = "king" |
| ن | n | nur = "light" |
| ه | h | hamd = "praise" |
| و | w | wajh = "face" |
| ي | y | yaum = "day" |

---

## 💾 How to Use These Files

### In React App

```typescript
// Import xassida data
import abadaData from '@/extracted-xassidas/abada.json';
import khasData from '@/extracted-xassidas/khilassa-zahab.json';
import abounaData from '@/extracted-xassidas/abouna.json';

// Access verses
abadaData.chapters[0].verses.forEach((verse) => {
  console.log(verse.text); // Arabic text
  console.log(verse.words); // Word-level transcriptions
  console.log(verse.translations); // FR/EN translations
});
```

### Direct Integration Example

```typescript
interface XassidasVerse {
  number: number;
  key: string;
  text: string; // Arabic with diacritics
  words: {
    position: number;
    text: string;
    transcription: string; // ISO 233-2
  }[];
  translations: {
    lang: string;
    text: string;
  }[];
}

interface XassidasChapter {
  name: string;
  number: number;
  verses: XassidasVerse[];
}

interface XassidasWork {
  name: string;
  chapters: XassidasChapter[];
  translated_lang: string[];
}
```

---

## 📖 Reading Guide

### Verse Components

Each verse contains:
1. **Arabic Text** (`text`) - Original with full diacritical marks
2. **Word-by-word Transcription** (`words[].transcription`) - ISO 233-2
3. **Translations** (`translations`) - Available in French & English

### Example: Abāda Verse 1:1

**Arabic**:
```
أَبَدَا بُرُوقٌ تَحْتَ جُنْحِ ظَلَامِ
```

**Transcription (ISO 233-2)**:
```
abadā burūqun taḥta junḥi ẓalāmi
```

**Part meanings**:
- abadā = eternally
- burūqun = lightning
- taḥta = beneath
- junḥi = veil
- ẓalāmi = darkness

**French Translation**:
```
[See abada.json for full translations]
```

---

## ✅ Data Quality Notes

### Completeness

| Xassida | Arabic Text | Transcription | FR Translation | EN Translation |
|---------|------------|---------------|----------------|----------------|
| Abāda | ✅ Complete (125+ verses) | ✅ Word-level | ✅ Complete | ✅ Complete |
| Khilās-Zahab | ✅ Complete (multiple chapters) | ✅ Word-level | ✅ Complete | ✅ Complete |
| Abouna | ✅ Complete (29+ verses) | ✅ Word-level | ❌ Not included | ❌ Not included |

### Notes

1. **Arabic Diacritics**: All text includes full tashkīl (vowel marks) for proper pronunciation
2. **Phonetic Accuracy**: Transcriptions follow ISO 233-2 standard (French edition)
3. **Translation Quality**: Translations sourced from the original JSON repository
4. **Audio**: No audio files included in extraction (stored separately on original repo)

---

## 🔗 Original Repository

- **GitHub**: https://github.com/AlKountiyou/xassidas
- **Direct Files**:
  - Abāda: https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/abada/abada.json
  - Khilās-Zahab: https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/xassidas.json
  - Abouna: https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/serigne-cheikh/abouna/abouna.json

---

## 📝 Changelog

**2026-03-26**: Initial extraction
- ✅ Abāda (maodo) - 125+ verses with FR/EN translations
- ✅ Khilās-Zahab (maodo) - Full structure with samples
- ✅ Abouna (serigne-cheikh) - 29+ verses with ISO transcriptions

---

**Ready to integrate into your Malikina React app!** 🚀
