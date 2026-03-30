# How to Import Extracted Xassidas Data

## 📦 Files Available

This directory contains three xassida datasets ready to integrate into your Malikina React app:

1. **abada.json** - Abāda by Maodo
2. **khilassa-zahab.json** - Khilās-Zahab by Maodo  
3. **abouna.json** - Abouna by Serigne Cheikh

---

## 🎯 Integration Steps

### Step 1: Copy Files to Data Directory

```bash
cp /Users/user/Desktop/projects/personnel-projects/malikina/extracted-xassidas/*.json \
   src/data/
```

### Step 2: Create TypeScript Types

Add to `src/data/xassidaTypes.ts`:

```typescript
export interface XassidasWord {
  position: number;
  text: string;
  transcription: string; // ISO 233-2
}

export interface XassidasVerse {
  number: number;
  key: string; // "1:0", "1:1", etc.
  text: string; // Arabic with diacritics
  words: XassidasWord[];
  translations: Array<{
    lang: string; // "fr", "en"
    text: string;
    author?: string;
  }>;
}

export interface XassidasChapter {
  name: string;
  number: number;
  verses: XassidasVerse[];
  translated_names?: Array<{
    lang: string;
    translation: string;
  }>;
}

export interface XassidasWork {
  name: string;
  chapters: XassidasChapter[];
  translated_names?: Array<{
    lang: string;
    translation: string;
    transcription?: string;
  }>;
  audios: string[];
  translated_lang: string[];
}
```

### Step 3: Create a Data Merger File

Create `src/data/importedXassidas.ts`:

```typescript
import abada from './abada.json';
import khilassZahab from './khilassa-zahab.json';
import abouna from './abouna.json';
import { XassidasWork } from './xassidaTypes';

export const importedXassidas: Record<string, XassidasWork> = {
  abada: abada as XassidasWork,
  'khilass-zahab': khilassZahab as XassidasWork,
  abouna: abouna as XassidasWork,
};

// Helper to get xassida by name
export const getImportedXassida = (name: string): XassidasWork | null => {
  return importedXassidas[name] || null;
};

// Get all imported xassida names
export const getImportedXassidasNames = (): string[] => {
  return Object.keys(importedXassidas);
};
```

### Step 4: Use in Components

#### In your QassidasDetailsModal or reader component:

```typescript
import { importedXassidas } from '@/data/importedXassidas';

interface Props {
  xassidasName: string;
  // ...
}

export const QassidasReader = ({ xassidasName }: Props) => {
  const xassida = importedXassidas[xassidasName];

  if (!xassida) {
    return <div>Xassida not found</div>;
  }

  return (
    <div>
      <h1>{xassida.translated_names?.[0]?.translation || xassida.name}</h1>
      
      {xassida.chapters.map((chapter, idx) => (
        <div key={idx} className="chapter">
          <h2>{chapter.name || `Chapter ${chapter.number}`}</h2>
          
          {chapter.verses.map((verse) => (
            <div key={verse.key} className="verse">
              {/* Arabic Text */}
              <p className="arabic" dir="rtl">
                {verse.text}
              </p>

              {/* Phonetic Transcription */}
              <p className="phonetic">
                {verse.words.map((word) => word.transcription).join(' ')}
              </p>

              {/* Translations */}
              <div className="translations">
                {verse.translations.map((trans) => (
                  <div key={trans.lang} className={`translation-${trans.lang}`}>
                    <strong>{trans.lang.toUpperCase()}:</strong> {trans.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

#### In your QassidasScreen.tsx:

```typescript
import { importedXassidas, getImportedXassidasNames } from '@/data/importedXassidas';

export const QassidasScreen = () => {
  const [selectedXassida, setSelectedXassida] = useState<string | null>(null);
  const importedNames = getImportedXassidasNames();

  return (
    <div>
      <div className="xassida-list">
        {importedNames.map((name) => (
          <button 
            key={name}
            onClick={() => setSelectedXassida(name)}
            className={selectedXassida === name ? 'active' : ''}
          >
            {importedXassidas[name].translated_names?.[0]?.translation || name}
          </button>
        ))}
      </div>

      {selectedXassida && (
        <QassidasReader xassidasName={selectedXassida} />
      )}
    </div>
  );
};
```

### Step 5: Update Package.json if needed

Ensure you can import JSON directly (Vite/webpack should already support this):

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

---

## 🔄 Migration from Old Data

If you have existing qassida data structure, map it:

```typescript
// src/data/qassidasMigration.ts

import { qassidasDataWithExtended } from './qassidasData';
import { importedXassidas } from './importedXassidas';

// Merge old + imported data
export const getAllXassidas = () => {
  return {
    legacy: qassidasDataWithExtended,
    imported: importedXassidas,
  };
};

// Prefer imported (higher quality) over legacy
export const getQassida = (name: string) => {
  const imported = importedXassidas[name];
  if (imported) return imported;
  
  // Fallback to legacy
  return qassidasDataWithExtended.find(q => q.name === name);
};
```

---

## ✅ Testing

### Test Data Integrity

```typescript
// src/__tests__/importedXassidas.test.ts

import { importedXassidas } from '@/data/importedXassidas';

describe('Imported Xassidas', () => {
  it('should have all xassidas loaded', () => {
    expect(Object.keys(importedXassidas).length).toBe(3);
  });

  it('should have abada with verses', () => {
    const abada = importedXassidas['abada'];
    expect(abada.chapters[0].verses.length).toBeGreaterThan(0);
  });

  it('should have word transcriptions', () => {
    const abada = importedXassidas['abada'];
    const firstVerse = abada.chapters[0].verses[0];
    expect(firstVerse.words.length).toBeGreaterThan(0);
    expect(firstVerse.words[0].transcription).toBeDefined();
  });

  it('should have translations', () => {
    const abada = importedXassidas['abada'];
    const firstVerse = abada.chapters[0].verses[0];
    const frTranslation = firstVerse.translations.find(t => t.lang === 'fr');
    expect(frTranslation?.text).toBeDefined();
  });
});
```

### Run Tests

```bash
npm run test -- importedXassidas.test.ts
```

---

## 📊 Data Statistics

After importing, you should have:

| Metric | Value |
|--------|-------|
| Xassidas | 3 high-quality works |
| Total Verses | 180+ verses |
| Languages | French, English (+ Arabic) |
| Phonetic Info | Word-level ISO 233-2 |
| Translation Coverage | Abāda & Khilās-Zahab: 100% |
| | Abouna: 0% (original has none) |

---

## 🔗 Source Links

For reference, original files are at:

- **Abāda**: https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/abada/abada.json
- **Khilās-Zahab**: https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/maodo/xassidas.json  
- **Abouna**: https://raw.githubusercontent.com/AlKountiyou/xassidas/main/xassidas/tidjian/serigne-cheikh/abouna/abouna.json

---

**Need help?** Check [EXTRACTION-GUIDE.md](./EXTRACTION-GUIDE.md) for detailed data structure.
