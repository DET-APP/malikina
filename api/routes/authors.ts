import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { all, get, run } from '../db/schema.js';

const router = Router();

// GET all authors
router.get('/', async (req: Request, res: Response) => {
  try {
    const authors = await all('SELECT * FROM authors ORDER BY name ASC');
    res.json(authors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single author
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const author = await get('SELECT * FROM authors WHERE id = ?', [req.params.id]);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    const xassidas = await all('SELECT id, title, verse_count FROM xassidas WHERE author_id = ?', [req.params.id]);
    res.json({ ...author, xassidas });
  } catch (error: any) {
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
    await run(
      `INSERT INTO authors (id, name, description, photo_url, birth_year, death_year, tradition)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description, photo_url, birth_year, death_year, tradition]
    );

    const author = await get('SELECT * FROM authors WHERE id = ?', [id]);
    res.status(201).json(author);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE author
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, photo_url, birth_year, death_year, tradition } = req.body;
    
    await run(
      `UPDATE authors SET name = ?, description = ?, photo_url = ?, birth_year = ?, death_year = ?, tradition = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, photo_url, birth_year, death_year, tradition, req.params.id]
    );

    const author = await get('SELECT * FROM authors WHERE id = ?', [req.params.id]);
    res.json(author);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE author
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Delete all xassidas and verses first
    const xassidas = await all('SELECT id FROM xassidas WHERE author_id = ?', [req.params.id]);
    for (const x of xassidas) {
      await run('DELETE FROM verses WHERE xassida_id = ?', [x.id]);
    }
    await run('DELETE FROM xassidas WHERE author_id = ?', [req.params.id]);
    await run('DELETE FROM authors WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Author deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const authorRoutes = router;
