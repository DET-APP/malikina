import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { all, get, run } from '../db/schema.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all xassidas
router.get('/', async (req: Request, res: Response) => {
  try {
    const xassidas = await all(`
      SELECT x.*, a.name as author_name 
      FROM xassidas x 
      JOIN authors a ON x.author_id = a.id
      ORDER BY x.created_at DESC
    `);
    res.json(xassidas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single xassida with verses
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const xassida = await get(`
      SELECT x.*, a.name as author_name, a.photo_url
      FROM xassidas x 
      JOIN authors a ON x.author_id = a.id
      WHERE x.id = ?
    `, [req.params.id]);

    if (!xassida) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    const verses = await all(`
      SELECT * FROM verses 
      WHERE xassida_id = ?
      ORDER BY verse_number ASC
    `, [req.params.id]);

    res.json({
      ...xassida,
      verses,
      verse_count: verses.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET verses of xassida
router.get('/:id/verses', async (req: Request, res: Response) => {
  try {
    const verses = await all(`
      SELECT * FROM verses 
      WHERE xassida_id = ?
      ORDER BY verse_number ASC
    `, [req.params.id]);
    res.json(verses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE xassida
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, author_id, description } = req.body;
    
    if (!title || !author_id) {
      return res.status(400).json({ error: 'Title and author_id required' });
    }

    const id = uuid();
    await run(
      `INSERT INTO xassidas (id, title, author_id, description) 
       VALUES (?, ?, ?, ?)`,
      [id, title, author_id, description]
    );

    const xassida = await get('SELECT * FROM xassidas WHERE id = ?', [id]);
    res.status(201).json(xassida);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE xassida
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    
    await run(
      `UPDATE xassidas SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, req.params.id]
    );

    const xassida = await get('SELECT * FROM xassidas WHERE id = ?', [req.params.id]);
    res.json(xassida);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE xassida
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await run('DELETE FROM verses WHERE xassida_id = ?', [req.params.id]);
    await run('DELETE FROM xassidas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Xassida deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPLOAD PDF and extract verses
router.post('/:id/upload-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text from PDF
    const text = await extractTextFromPDF(req.file.buffer);
    
    // Parse text into verses (basic splitting by lines with Arabic text)
    const verses = parseVerses(text);

    res.json({
      message: 'PDF processed',
      verses_extracted: verses.length,
      verses
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save verses to xassida
router.post('/:id/verses', async (req: Request, res: Response) => {
  try {
    const { verses } = req.body;
    
    if (!Array.isArray(verses) || verses.length === 0) {
      return res.status(400).json({ error: 'Verses array required' });
    }

    const savedVerses = [];

    for (const verse of verses) {
      const verseId = uuid();
      const verseKey = `1:${verse.verse_number}`;
      
      await run(
        `INSERT INTO verses (id, xassida_id, verse_number, verse_key, text_arabic, transcription, translation_fr, translation_en, words)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          verseId,
          req.params.id,
          verse.verse_number,
          verseKey,
          verse.text_arabic,
          verse.transcription || '',
          verse.translation_fr || '',
          verse.translation_en || '',
          JSON.stringify(verse.words || [])
        ]
      );

      savedVerses.push({ id: verseId, ...verse });
    }

    // Update verse count
    await run(
      'UPDATE xassidas SET verse_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [verses.length, req.params.id]
    );

    res.status(201).json({
      message: 'Verses saved',
      count: savedVerses.length,
      verses: savedVerses
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const errors: string[] = [];

  // Strategy 1: pdf-parse (optional, loaded dynamically to avoid startup crash on older Node)
  try {
    const pdfParseModule = await import('pdf-parse');
    const parsed = await pdfParseModule.pdf(buffer);
    const text = (parsed?.text || '').trim();

    // Scanned PDFs (image-only) often have no extractable text without OCR.
    if (!text) {
      throw new Error('Aucun texte détecté dans le PDF (document probablement scanné/image)');
    }

    return text;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Erreur extraction pdf-parse');
  }

  // Strategy 2: pdfjs-dist legacy fallback for compatibility edge-cases
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdfDoc = await loadingTask.promise;
    let text = '';

    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
      const page = await pdfDoc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as Array<{ str?: string }>)
        .map((item) => item?.str || '')
        .join(' ')
        .trim();

      if (pageText) {
        text += `${pageText}\n`;
      }
    }

    const finalText = text.trim();
    if (!finalText) {
      throw new Error('Aucun texte détecté dans le PDF avec fallback pdfjs (probablement scanné/image)');
    }

    return finalText;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Erreur extraction pdfjs fallback');
  }

  console.error('PDF extraction error (all strategies failed):', errors);
  throw new Error(`Extraction PDF impossible. Détails: ${errors.join(' | ')}`);
}

function parseVerses(text: string): any[] {
  // Basic parsing: split by Arabic sentences and newlines
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const verses: any[] = [];
  let verseNumber = 1;

  for (const line of lines) {
    if (line.match(/[\u0600-\u06FF]/)) { // Contains Arabic
      verses.push({
        verse_number: verseNumber,
        text_arabic: line.trim(),
        transcription: '',
        translation_fr: '',
        translation_en: '',
        words: []
      });
      verseNumber++;
    }
  }

  return verses;
}

export const xassidaRoutes = router;
