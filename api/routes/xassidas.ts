import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { all, get, run } from '../db/schema.js';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Audio upload directory
const audioDir = path.join(__dirname, '../public/audios');

// Ensure audio directory exists
async function ensureAudioDir() {
  try {
    await fs.mkdir(audioDir, { recursive: true });
  } catch (error) {
    console.error('Error creating audio directory:', error);
  }
}

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
// Valid categories for xassidas
const VALID_CATEGORIES = ['Dua', 'Eloge du Prophéte', 'Eloge de Seydina Cheikh', 'Fiqh Sharia', 'Fiqh Tariqa', 'Autre'];

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, author_id, description, audio_url, arabic_name, categorie } = req.body;
    
    if (!title || !author_id) {
      return res.status(400).json({ error: 'Title and author_id required' });
    }

    // Validate categorie if provided
    if (categorie && !VALID_CATEGORIES.includes(categorie)) {
      return res.status(400).json({ error: `Invalid categorie. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const id = uuid();
    await run(
      `INSERT INTO xassidas (id, title, author_id, description, audio_url, arabic_name, categorie) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, author_id, description, audio_url || '', arabic_name || '', categorie || 'Autre']
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
    const { title, description, audio_url, arabic_name, categorie } = req.body;
    
    // Validate categorie if provided
    if (categorie && !VALID_CATEGORIES.includes(categorie)) {
      return res.status(400).json({ error: `Invalid categorie. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    
    await run(
      `UPDATE xassidas SET title = ?, description = ?, audio_url = ?, arabic_name = ?, categorie = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, audio_url || '', arabic_name || '', categorie || 'Autre', req.params.id]
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

// UPLOAD audio for xassida
router.post('/:id/upload-audio', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid audio format. Allowed: MP3, WAV, OGG, WebM, M4A' });
    }

    // Get xassida
    const xassida = await get('SELECT * FROM xassidas WHERE id = ?', [req.params.id]);
    if (!xassida) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    // Create filename
    const ext = req.file.mimetype === 'audio/mpeg' ? 'mp3' : 
               req.file.mimetype === 'audio/wav' ? 'wav' : 
               req.file.mimetype === 'audio/ogg' ? 'ogg' : 
               req.file.mimetype === 'audio/webm' ? 'webm' : 'm4a';
    const filename = `${req.params.id}-${Date.now()}.${ext}`;
    const filePath = path.join(audioDir, filename);

    // Ensure directory exists
    await ensureAudioDir();

    // Save file
    await fs.writeFile(filePath, req.file.buffer);

    // Generate audio URL (relative to public directory)
    const audioUrl = `/audios/${filename}`;

    // Update xassida with audio URL
    await run(
      'UPDATE xassidas SET audio_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [audioUrl, req.params.id]
    );

    res.json({
      message: 'Audio uploaded successfully',
      audioUrl,
      filename
    });
  } catch (error: any) {
    console.error('Audio upload error:', error);
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
    const extraction = await extractTextFromPDF(req.file.buffer, req.file.originalname);
    
    // Parse text into verses (basic splitting by lines with Arabic text)
    const verses = parseVerses(extraction.text);

    res.json({
      message: 'PDF processed',
      extraction_method: extraction.method,
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
    const { verses, replaceExisting } = req.body;
    
    if (!Array.isArray(verses) || verses.length === 0) {
      return res.status(400).json({ error: 'Verses array required' });
    }

    if (replaceExisting) {
      await run('DELETE FROM verses WHERE xassida_id = ?', [req.params.id]);
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

    // Update verse count from database total (works with chunked uploads)
    const countRow = await get(
      'SELECT COUNT(*) as count FROM verses WHERE xassida_id = ?',
      [req.params.id]
    );
    const totalVerses = Number(countRow?.count || 0);

    await run(
      'UPDATE xassidas SET verse_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [totalVerses, req.params.id]
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
interface ExtractionResult {
  text: string;
  method: 'pdf-parse' | 'pdfjs' | 'ocr-space';
}

async function extractTextFromPDF(buffer: Buffer, fileName = 'document.pdf'): Promise<ExtractionResult> {
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

    return { text, method: 'pdf-parse' };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Erreur extraction pdf-parse');
  }

  // Strategy 2: pdfjs-dist legacy fallback for compatibility edge-cases
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Force no-worker mode in Node to avoid API/Worker version mismatch
    // when multiple pdfjs-dist versions exist in dependency tree.
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = '';
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
    } as any);
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

    return { text: finalText, method: 'pdfjs' };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Erreur extraction pdfjs fallback');
  }

  // Strategy 3: OCR cloud fallback (high sensitivity for scanned/manuscript PDFs)
  try {
    const ocrText = await extractTextWithOCRSpace(buffer, fileName);
    const normalized = ocrText.trim();

    if (!normalized) {
      throw new Error('OCR terminé, mais aucun texte exploitable détecté');
    }

    return { text: normalized, method: 'ocr-space' };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Erreur OCR fallback');
  }

  console.error('PDF extraction error (all strategies failed):', errors);
  throw new Error(`Extraction PDF impossible. Détails: ${errors.join(' | ')}`);
}

async function extractTextWithOCRSpace(buffer: Buffer, fileName: string): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    throw new Error('OCR non configuré: OCR_SPACE_API_KEY manquant');
  }

  const endpoint = process.env.OCR_SPACE_ENDPOINT || 'https://api.ocr.space/parse/image';
  const language = process.env.OCR_SPACE_LANGUAGE || 'ara';
  const engine = process.env.OCR_SPACE_ENGINE || '2';

  const form = new FormData();
  form.append('apikey', apiKey);
  form.append('language', language);
  form.append('OCREngine', engine);
  form.append('isOverlayRequired', 'false');
  form.append('detectOrientation', 'true');
  form.append('scale', 'true');
  form.append('isTable', 'false');
  form.append('file', new Blob([buffer], { type: 'application/pdf' }), fileName || 'document.pdf');

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new Error(`OCR HTTP ${response.status}`);
  }

  const payload: any = await response.json();

  if (payload?.IsErroredOnProcessing) {
    const details = Array.isArray(payload?.ErrorMessage)
      ? payload.ErrorMessage.join(' | ')
      : payload?.ErrorMessage || payload?.ErrorDetails || 'Erreur OCR inconnue';
    throw new Error(`OCR.space: ${details}`);
  }

  const parsedResults = Array.isArray(payload?.ParsedResults) ? payload.ParsedResults : [];
  const text = parsedResults
    .map((entry: any) => (entry?.ParsedText || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('OCR.space n\'a retourné aucun texte');
  }

  return text;
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

// SET YouTube ID for xassida
router.post('/:id/set-youtube-id', async (req: Request, res: Response) => {
  try {
    const { youtube_url } = req.body;
    
    if (!youtube_url) {
      return res.status(400).json({ error: 'YouTube URL required' });
    }

    // Extract video ID from URL
    let youtubeId: string | null = null;
    
    // Try different YouTube URL formats
    if (youtube_url.includes('youtube.com/watch?v=')) {
      youtubeId = youtube_url.split('v=')[1]?.split('&')[0]?.split('?')[0];
    } else if (youtube_url.includes('youtu.be/')) {
      youtubeId = youtube_url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
    } else if (youtube_url.match(/^[a-zA-Z0-9_-]{11}$/)) {
      // Already a video ID
      youtubeId = youtube_url;
    }

    if (!youtubeId || youtubeId.length !== 11) {
      return res.status(400).json({ error: 'Invalid YouTube URL or ID' });
    }

    // Verify it's a valid video ID format
    if (!youtubeId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID format' });
    }

    // Get xassida
    const xassida = await get('SELECT * FROM xassidas WHERE id = ?', [req.params.id]);
    if (!xassida) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    // Update youtube_id
    await run(
      'UPDATE xassidas SET youtube_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [youtubeId, req.params.id]
    );

    res.json({
      message: 'YouTube ID saved',
      youtube_id: youtubeId
    });
  } catch (error: any) {
    console.error('Set YouTube ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET audio or YouTube info
router.get('/:id/audio', async (req: Request, res: Response) => {
  try {
    const xassida = await get('SELECT * FROM xassidas WHERE id = ?', [req.params.id]);
    if (!xassida) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    // Return local audio if available
    if (xassida.audio_url) {
      return res.json({ 
        type: 'local',
        url: xassida.audio_url 
      });
    }

    // Return YouTube info if available
    if (xassida.youtube_id) {
      return res.json({ 
        type: 'youtube',
        video_id: xassida.youtube_id,
        embed_url: `https://www.youtube.com/embed/${xassida.youtube_id}`,
        watch_url: `https://www.youtube.com/watch?v=${xassida.youtube_id}`
      });
    }

    return res.status(404).json({ error: 'No audio available' });
  } catch (error: any) {
    console.error('Audio retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET valid categories for xassidas
router.get('/admin/categories', async (req: Request, res: Response) => {
  res.json({ categories: VALID_CATEGORIES });
});

// POST import translations for verses
router.post('/admin/import-translations', async (req: Request, res: Response) => {
  try {
    const translations = req.body;

    if (!Array.isArray(translations)) {
      return res.status(400).json({ error: 'Expected an array of translations' });
    }

    if (translations.length === 0) {
      return res.status(400).json({ error: 'No translations provided' });
    }

    // Validate format
    const invalid = translations.filter(
      (t) => !t.xassida_id || t.verse_number === undefined || !t.translation_fr
    );
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Invalid format in ${invalid.length} entries. Each must have: xassida_id, verse_number, translation_fr`
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const { xassida_id, verse_number, translation_fr } of translations) {
      try {
        // Verify xassida exists
        const xassida = await get('SELECT id FROM xassidas WHERE id = ?', [xassida_id]);
        if (!xassida) {
          errors.push(`Verse ${verse_number}: Xassida ${xassida_id} not found`);
          errorCount++;
          continue;
        }

        // Verify verse exists
        const verse = await get(
          'SELECT id FROM verses WHERE xassida_id = ? AND verse_number = ?',
          [xassida_id, verse_number]
        );
        if (!verse) {
          errors.push(`Xassida ${xassida_id}: Verse ${verse_number} not found`);
          errorCount++;
          continue;
        }

        // Update translation_fr
        await run(
          'UPDATE verses SET translation_fr = ? WHERE xassida_id = ? AND verse_number = ?',
          [translation_fr, xassida_id, verse_number]
        );
        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push(`Verse ${verse_number}: ${err.message}`);
      }
    }

    res.json({
      message: `Import complete: ${successCount} translations added`,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Translation import error:', error);
    res.status(500).json({ error: error.message });
  }
});

export const xassidaRoutes = router;
