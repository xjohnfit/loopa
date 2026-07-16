import { Router } from 'express';
import { pool } from '../lib/DBConn';

const router = Router();

// GET all categories for the current user
router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at ASC',
    [req.userId]
  );
  res.json(result.rows);
});

// CREATE category
router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (typeof name !== 'string' || !name.trim() || typeof color !== 'string' || !color.trim()) {
    res.status(400).json({ error: 'Name and color are required' });
    return;
  }
  const result = await pool.query(
    `INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *`,
    [req.userId, name.trim(), color]
  );
  res.status(201).json(result.rows[0]);
});

export default router;
