import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/config.js';

const router = Router();

// GET all categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        color,
        order_index,
        created_at,
        updated_at
      FROM categories
      ORDER BY order_index ASC, name ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single category
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        color,
        order_index,
        created_at,
        updated_at
      FROM categories
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, color, order_index } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const id = uuid();
    
    // Get max order_index if not provided
    let orderIndex = order_index;
    if (orderIndex === undefined || orderIndex === null) {
      const maxResult = await pool.query(`SELECT COALESCE(MAX(order_index), 0) as max_order FROM categories`);
      orderIndex = (maxResult.rows[0]?.max_order || 0) + 1;
    }

    const result = await pool.query(`
      INSERT INTO categories (id, name, description, color, order_index, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, description, color, order_index, created_at, updated_at
    `, [id, name, description || null, color || '#666666', orderIndex]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, order_index } = req.body;

    const result = await pool.query(`
      UPDATE categories
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        color = COALESCE($3, color),
        order_index = COALESCE($4, order_index),
        updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, description, color, order_index, created_at, updated_at
    `, [name || null, description || null, color || null, order_index || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if any xassidas use this category
    const checkResult = await pool.query(`
      SELECT COUNT(*) as count FROM xassidas WHERE categorie_id = $1
    `, [id]);

    if (checkResult.rows[0]?.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category in use by xassidas',
        count: checkResult.rows[0].count 
      });
    }

    const result = await pool.query(`
      DELETE FROM categories WHERE id = $1 RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted', id });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

// BULK: Reorder categories
router.post('/admin/reorder', async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'categories must be an array' });
    }

    for (let i = 0; i < categories.length; i++) {
      const catId = categories[i];
      await pool.query(`
        UPDATE categories SET order_index = $1 WHERE id = $2
      `, [i, catId]);
    }

    res.json({ message: 'Categories reordered' });
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
