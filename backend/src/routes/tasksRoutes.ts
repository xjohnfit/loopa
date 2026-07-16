import { Router } from 'express';
import { pool } from '../lib/DBConn';

const router = Router();

// GET all tasks (Manage screen)
router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE is_active = true AND user_id = $1 ORDER BY time ASC',
    [req.userId]
  );
  res.json(result.rows);
});

// CREATE task
router.post('/', async (req, res) => {
  const { title, time } = req.body;
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, time) VALUES ($1, $2, $3) RETURNING *`,
    [req.userId, title, time]
  );
  res.status(201).json(result.rows[0]);
});

// UPDATE task
router.put('/:id', async (req, res) => {
  const { title, time } = req.body;
  const result = await pool.query(
    `UPDATE tasks SET title = $1, time = $2 WHERE id = $3 AND user_id = $4 RETURNING *`,
    [title, time, req.params.id, req.userId]
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
