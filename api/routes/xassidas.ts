import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../db/config.js';

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
      SELECT id, xassida_id, verse_number, COALESCE(content_ar, '') as content_ar, COALESCE(translation_fr, '') as translation_fr, audio_url
      FROM verses
      WHERE xassida_id = $1
      ORDER BY verse_number ASC
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

// GET verses of xassida
router.get('/:id/verses', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, xassida_id, verse_number, content_ar as text_arabic, translation_fr as text_french, audio_url
      FROM verses
      WHERE xassida_id = $1
      ORDER BY verse_number ASC
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
    const { title, author_id, description } = req.body;
    
    if (!title || !author_id) {
      return res.status(400).json({ error: 'title and author_id are required' });
    }

    const id = uuid();
    const result = await pool.query(`
      INSERT INTO xassidas (id, title, author_id, description, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, title, description, created_at, author_id
    `, [id, title, author_id, description || null]);

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
    const { title, description, author_id } = req.body;

    const result = await pool.query(`
      UPDATE xassidas
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          author_id = COALESCE($3, author_id)
      WHERE id = $4
      RETURNING id, title, description, created_at, author_id
    `, [title || null, description || null, author_id || null, id]);

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

    // For now, just return success
    // In a full implementation, you'd extract verses from PDF
    res.json({
      message: 'PDF uploaded',
      xassidaId: req.params.id,
      filename: req.file.originalname
    });
  } catch (error: any) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as xassidaRoutes };
