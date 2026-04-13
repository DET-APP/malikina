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

const photosDir = path.join(__dirname, '../public/photos');

async function ensurePhotosDir() {
  try {
    await fs.mkdir(photosDir, { recursive: true });
  } catch (error) {
    console.error('Error creating photos directory:', error);
  }
}

// GET all authors
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id::text, name, full_name, arabic, description, photo_url, tradition, birth_year, death_year, bio, created_at, updated_at FROM authors ORDER BY name ASC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single author
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const authorResult = await pool.query('SELECT id::text, name, full_name, arabic, description, photo_url, tradition, birth_year, death_year, bio, created_at, updated_at FROM authors WHERE id = $1', [req.params.id]);
    if (authorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    const xassidaResult = await pool.query(
      'SELECT id::text, title FROM xassidas WHERE author_id = $1',
      [req.params.id]
    );
    
    const author = authorResult.rows[0];
    res.json({ ...author, xassidas: xassidaResult.rows });
  } catch (error: any) {
    console.error('Error fetching author:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE author
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, photo_url, birth_year, death_year, tradition } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const id = uuid();
    const result = await pool.query(
      `INSERT INTO authors (id, name, description, photo_url, birth_year, death_year, tradition)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, description, photo_url, birth_year, death_year, tradition`,
      [id, name, description || null, photo_url || null, birth_year || null, death_year || null, tradition || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating author:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE author
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, photo_url, birth_year, death_year, tradition } = req.body;
    
    const result = await pool.query(
      `UPDATE authors 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           photo_url = COALESCE($3, photo_url),
           birth_year = COALESCE($4, birth_year),
           death_year = COALESCE($5, death_year),
           tradition = COALESCE($6, tradition)
       WHERE id = $7
       RETURNING id, name, description, photo_url, birth_year, death_year, tradition`,
      [name || null, description || null, photo_url || null, birth_year || null, death_year || null, tradition || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating author:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE author
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Delete all verses first (cascade via xassida_id)
    await pool.query(
      `DELETE FROM verses WHERE xassida_id IN (SELECT id FROM xassidas WHERE author_id = $1)`,
      [req.params.id]
    );

    // Delete all xassidas
    await pool.query('DELETE FROM xassidas WHERE author_id = $1', [req.params.id]);

    // Delete author
    const result = await pool.query('DELETE FROM authors WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }

    res.json({ message: 'Author deleted', id: req.params.id });
  } catch (error: any) {
    console.error('Error deleting author:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPLOAD photo for author
router.post('/:id/upload-photo', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid image format. Allowed: JPG, PNG, WebP, GIF' });
    }

    const ext = req.file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : req.file.mimetype.split('/')[1];
    const filename = `${req.params.id}-${Date.now()}.${ext}`;
    const filePath = path.join(photosDir, filename);

    await ensurePhotosDir();
    await fs.writeFile(filePath, req.file.buffer);

    const photoUrl = `/photos/${filename}`;

    // Update author's photo_url in database
    await pool.query('UPDATE authors SET photo_url = $1 WHERE id = $2', [photoUrl, req.params.id]);

    res.json({ message: 'Photo uploaded successfully', photo_url: photoUrl, filename });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export const authorRoutes = router;
