import { Router } from 'express';
import { pool } from '../lib/DBConn';

const router = Router();

const SELECT_WITH_CATEGORY = `
  SELECT t.*, c.name AS category_name, c.color AS category_color
  FROM tasks t
  LEFT JOIN categories c ON c.id = t.category_id
`;

// GET all tasks (Manage screen)
router.get('/', async (req, res) => {
  const result = await pool.query(
    `${SELECT_WITH_CATEGORY} WHERE t.is_active = true AND t.user_id = $1 ORDER BY t.time ASC`,
    [req.userId]
  );
  res.json(result.rows);
});

// CREATE task
router.post('/', async (req, res) => {
  const { title, time, category_id } = req.body;
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, time, category_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.userId, title, time, category_id ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// UPDATE task
router.put('/:id', async (req, res) => {
  const { title, time, category_id } = req.body;
  const result = await pool.query(
    `UPDATE tasks SET title = $1, time = $2, category_id = $3 WHERE id = $4 AND user_id = $5 RETURNING *`,
    [title, time, category_id ?? null, req.params.id, req.userId]
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(result.rows[0]);
});

// ARCHIVE (soft delete) task
router.delete('/:id', async (req, res) => {
  await pool.query(
    `UPDATE tasks SET is_active = false, archived_at = now() WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId]
  );
  res.status(204).send();
});

export default router;
