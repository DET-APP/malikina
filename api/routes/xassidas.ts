import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { pool } from '../db/config.js';
import { extractFromPdf } from '../lib/pdf-extractor.js';

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
    const result = await pool.query(`
      SELECT 
        x.id::text,
        x.title,
        x.description,
        COALESCE(x.arabic_name, '') as arabic_name,
        COALESCE(x.audio_url, '') as audio_url,
        COALESCE(x.youtube_id, '') as youtube_id,
        COALESCE(x.categorie, 'Autre') as categorie,
        COALESCE(x.verse_count, 0) as verse_count,
        (SELECT COUNT(*) FROM verses WHERE xassida_id = x.id) as actual_verse_count,
        x.created_at,
        a.id::text as author_id,
        a.name as author_name
      FROM xassidas x 
      LEFT JOIN authors a ON x.author_id = a.id
      ORDER BY x.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching xassidas:', error);
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Import/Update translations for verses (MUST BE BEFORE /:id)
router.post('/admin/import-translations', async (req: Request, res: Response) => {
  try {
    // Support both formats:
    // 1. { translations: [...], xassida_id: "..." }
    // 2. Direct array [...] (with xassida_id as param)
    let translations = req.body.translations || req.body;
    const xassida_id = req.body.xassida_id;

    if (!Array.isArray(translations)) {
      return res.status(400).json({ error: 'translations must be an array' });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const trans of translations) {
      try {
        const { verse_id, verse_number, translation_fr, translation_en, transcription } = trans;
        const transXassidaId = trans.xassida_id || xassida_id;

        let finalVerseId = verse_id;

        // If verse_id not provided but verse_number + xassida_id provided, lookup verse_id
        if (!finalVerseId && verse_number && transXassidaId) {
          const verseResult = await pool.query(`
            SELECT id FROM verses 
            WHERE xassida_id = $1 AND verse_number = $2
            LIMIT 1
          `, [transXassidaId, verse_number]);

          if (verseResult.rows.length > 0) {
            finalVerseId = verseResult.rows[0].id;
          } else {
            errors.push(`Verse ${verse_number} not found in xassida ${transXassidaId}`);
            continue;
          }
        }

        if (!finalVerseId) {
          errors.push('Missing verse_id or (verse_number + xassida_id)');
          continue;
        }

        const result = await pool.query(`
          UPDATE verses
          SET 
            translation_fr = COALESCE($1, translation_fr),
            translation_en = COALESCE($2, translation_en),
            transcription = COALESCE($3, transcription),
            updated_at = NOW()
          WHERE id = $4
          RETURNING id
        `, [translation_fr || null, translation_en || null, transcription || null, finalVerseId]);

        if (result.rows.length > 0) {
          updated++;
        } else {
          errors.push(`Verse ${finalVerseId} not found`);
        }
      } catch (err: any) {
        errors.push(`Error updating verse: ${err.message}`);
      }
    }

    res.json({
      message: 'Import completed',
      updated,
      total: translations.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error importing translations:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST admin: Re-scrape all xassidas
router.post('/admin/rescrape', async (req: Request, res: Response) => {
  try {
    // Check if scraper is already running
    const result = await pool.query(`SELECT COUNT(*) FROM information_schema.processlist WHERE info LIKE '%scrape%'`).catch(() => ({ rows: [{ count: 0 }] }));
    
    // Spawn scraper process
    const scraper = spawn('npm', ['run', 'scrape'], {
      cwd: path.join(__dirname, '..'),
      detached: true,
      stdio: 'pipe'
    });
    
    let output = '';
    scraper.stdout?.on('data', (data) => {
      output += data.toString();
      console.log('Scraper:', output.split('\n').pop());
    });
    
    scraper.stderr?.on('data', (data) => {
      console.error('Scraper error:', data.toString());
    });
    
    // Unref so process doesn't keep parent alive
    scraper.unref();
    
    res.json({
      message: 'Scraper started in background',
      status: 'running',
      pid: scraper.pid,
      note: 'Check API logs for progress. Scraper will retry failed requests.'
    });
  } catch (error: any) {
    console.error('Error starting scraper:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET admin: Check data integrity
router.get('/admin/integrity-check', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        x.id,
        x.title,
        COUNT(DISTINCT v.chapter_number) as chapters,
        COUNT(DISTINCT v.verse_number) as verses,
        COUNT(DISTINCT CASE WHEN v.text_arabic IS NOT NULL THEN 1 END) as verses_with_arabic,
        COUNT(DISTINCT CASE WHEN v.transcription IS NOT NULL THEN 1 END) as verses_with_transcription,
        COUNT(DISTINCT CASE WHEN v.translation_fr IS NOT NULL THEN 1 END) as verses_with_french,
        CASE 
          WHEN COUNT(DISTINCT v.verse_number) = 0 THEN 'MISSING'
          WHEN COUNT(DISTINCT v.verse_number) < 10 THEN 'INCOMPLETE'
          WHEN COUNT(DISTINCT CASE WHEN v.transcription IS NULL THEN 1 END) > 0 THEN 'MISSING_TRANSCRIPTION'
          WHEN COUNT(DISTINCT CASE WHEN v.text_arabic IS NULL THEN 1 END) > 0 THEN 'MISSING_ARABIC'
          ELSE 'OK'
        END as status
      FROM xassidas x 
      LEFT JOIN verses v ON x.id = v.xassida_id
      GROUP BY x.id, x.title
      ORDER BY verses ASC, x.id ASC
    `);
    
    const summary = {
      total: result.rows.length,
      ok: result.rows.filter((r: any) => r.status === 'OK').length,
      incomplete: result.rows.filter((r: any) => r.status === 'INCOMPLETE').length,
      missing: result.rows.filter((r: any) => r.status === 'MISSING').length,
      issues: result.rows.filter((r: any) => r.status !== 'OK')
    };
    
    res.json({ summary, details: result.rows });
  } catch (error: any) {
    console.error('Error checking integrity:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET admin: List categories
router.get('/admin/categories', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT categorie FROM xassidas WHERE categorie IS NOT NULL ORDER BY categorie ASC`
    );
    const categories = result.rows.map((r: any) => r.categorie);
    const defaults = ['Eloge du Prophète', 'Louange à Dieu', 'Invocation', 'Sagesse', 'Autre'];
    const merged = [...new Set([...defaults, ...categories])].sort();
    res.json({ categories: merged });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET admin: Data statistics
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        'xassidas' as type, COUNT(*) as count FROM xassidas
      UNION ALL
      SELECT 'verses' as type, COUNT(*) as count FROM verses
      UNION ALL
      SELECT 'authors' as type, COUNT(*) as count FROM authors
      UNION ALL
      SELECT 'verses_with_translations' as type, COUNT(*) as count FROM verses WHERE translation_fr IS NOT NULL
    `);
    
    const stats = Object.fromEntries(result.rows.map((r: any) => [r.type, r.count]));
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single xassida with verses
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get xassida
    const xassidaResult = await pool.query(`
      SELECT 
        x.id::text,
        x.title,
        x.description,
        COALESCE(x.arabic_name, '') as arabic_name,
        COALESCE(x.audio_url, '') as audio_url,
        COALESCE(x.youtube_id, '') as youtube_id,
        COALESCE(x.categorie, 'Autre') as categorie,
        COALESCE(x.verse_count, 0) as verse_count,
        x.created_at,
        a.id::text as author_id,
        a.name as author_name,
        a.photo_url
      FROM xassidas x 
      LEFT JOIN authors a ON x.author_id = a.id
      WHERE x.id = $1
    `, [id]);

    if (xassidaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    // Get verses
    const versesResult = await pool.query(`
      SELECT 
        id, 
        xassida_id, 
        chapter_number, 
        verse_number, 
        verse_key,
        text_arabic,
        transcription,
        translation_fr,
        translation_en,
        words,
        audio_url,
        created_at,
        updated_at
      FROM verses
      WHERE xassida_id = $1
      ORDER BY chapter_number ASC, verse_number ASC
    `, [id]);

    const xassida = xassidaResult.rows[0];
    res.json({
      ...xassida,
      verses: versesResult.rows,
      verse_count: versesResult.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching xassida:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET verses of xassida (with all fields in correct format)
router.get('/:id/verses', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        xassida_id, 
        chapter_number, 
        verse_number, 
        verse_key,
        text_arabic,
        transcription,
        translation_fr,
        translation_en,
        words,
        audio_url,
        notes,
        created_at,
        updated_at
      FROM verses
      WHERE xassida_id = $1
      ORDER BY chapter_number ASC, verse_number ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching verses:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE xassida
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, author_id, description, audio_url, arabic_name, categorie } = req.body;

    if (!title || !author_id) {
      return res.status(400).json({ error: 'title and author_id are required' });
    }

    const id = uuid();
    const result = await pool.query(`
      INSERT INTO xassidas (id, title, author_id, description, audio_url, arabic_name, categorie, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, title, description, audio_url, arabic_name, categorie, created_at, author_id
    `, [id, title, author_id, description || null, audio_url || null, arabic_name || null, categorie || 'Autre']);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating xassida:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE xassida
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, author_id, audio_url, arabic_name, categorie } = req.body;

    const result = await pool.query(`
      UPDATE xassidas
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          author_id = COALESCE($3, author_id),
          audio_url = COALESCE($4, audio_url),
          arabic_name = COALESCE($5, arabic_name),
          categorie = COALESCE($6, categorie)
      WHERE id = $7
      RETURNING id, title, description, audio_url, arabic_name, categorie, youtube_id, created_at, author_id
    `, [title || null, description || null, author_id || null, audio_url || null, arabic_name || null, categorie || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating xassida:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE xassida
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete verses first
    await pool.query('DELETE FROM verses WHERE xassida_id = $1', [id]);

    // Delete xassida
    const result = await pool.query('DELETE FROM xassidas WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    res.json({ message: 'Xassida deleted', id });
  } catch (error: any) {
    console.error('Error deleting xassida:', error);
    res.status(500).json({ error: error.message });
  }
});

// SET youtube ID from URL
router.post('/:id/set-youtube-id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { youtube_url } = req.body;

    if (!youtube_url) {
      return res.status(400).json({ error: 'youtube_url is required' });
    }

    // Extract YouTube ID from various URL formats
    let youtubeId: string | null = null;
    try {
      const url = new URL(youtube_url);
      if (url.hostname === 'youtu.be') {
        youtubeId = url.pathname.slice(1);
      } else if (url.hostname.includes('youtube.com')) {
        youtubeId = url.searchParams.get('v');
      }
    } catch {
      // Try as raw ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(youtube_url)) {
        youtubeId = youtube_url;
      }
    }

    if (!youtubeId) {
      return res.status(400).json({ error: 'Could not extract YouTube ID from URL' });
    }

    const result = await pool.query(
      `UPDATE xassidas SET youtube_id = $1 WHERE id = $2 RETURNING id, youtube_id`,
      [youtubeId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Xassida not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error setting YouTube ID:', error);
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

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Le fichier doit être un PDF' });
    }

    console.log(`[PDF] Extraction en cours pour xassida ${req.params.id} (${req.file.originalname}, ${(req.file.size / 1024).toFixed(0)} Ko)`);

    const result = await extractFromPdf(req.file.buffer);

    console.log(`[PDF] Extraction terminée: ${result.verses.length} vers détectés, auteur: ${result.metadata.detected_author || 'inconnu'}`);

    res.json({
      message: 'PDF analysé avec succès',
      xassidaId: req.params.id,
      filename: req.file.originalname,
      verses: result.verses,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('Error extracting PDF:', error);
    res.status(500).json({ error: `Erreur d'extraction PDF: ${error.message}` });
  }
});

// POST verses for a xassida (create or replace)
router.post('/:id/verses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verses, replaceExisting } = req.body;

    if (!Array.isArray(verses) || verses.length === 0) {
      return res.status(400).json({ error: 'verses doit être un tableau non vide' });
    }

    // Verify xassida exists
    const xassidaCheck = await pool.query('SELECT id FROM xassidas WHERE id = $1', [id]);
    if (xassidaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Xassida non trouvée' });
    }

    // Delete existing verses if replacing
    if (replaceExisting) {
      await pool.query('DELETE FROM verses WHERE xassida_id = $1', [id]);
    }

    let inserted = 0;
    const errors: string[] = [];

    for (const verse of verses) {
      try {
        const chapterNum = verse.chapter_number ?? 1;
        const verseNum = verse.verse_number;
        const verseKey = `${chapterNum}:${verseNum}`;

        await pool.query(`
          INSERT INTO verses (xassida_id, verse_number, chapter_number, verse_key, text_arabic, transcription, translation_fr, translation_en, content, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [
          id,
          verseNum,
          chapterNum,
          verseKey,
          verse.text_arabic || '',
          verse.transcription || null,
          verse.translation_fr || null,
          verse.translation_en || null,
          verse.text_arabic || '',
        ]);
        inserted++;
      } catch (err: any) {
        errors.push(`Vers ${verse.verse_number}: ${err.message}`);
      }
    }

    // Update verse_count on xassida
    const countResult = await pool.query('SELECT COUNT(*) as count FROM verses WHERE xassida_id = $1', [id]);
    await pool.query('UPDATE xassidas SET verse_count = $1 WHERE id = $2', [countResult.rows[0].count, id]);

    res.json({
      message: `${inserted} vers sauvegardés`,
      inserted,
      total: verses.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error saving verses:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as xassidaRoutes };
