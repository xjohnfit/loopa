import { Router } from 'express';
import { pool } from '../lib/DBConn';

const router = Router();

const SELECT_WITH_CATEGORY = `
  SELECT t.*, c.name AS category_name, c.color AS category_color
  FROM tasks t
  LEFT JOIN categories c ON c.id = t.category_id
`;

// A one-off task only ever needs to be reachable on its own scheduled_date
// (the daily query only returns it that day), so a bad/missing date here is
// the only place that needs guarding.
function parseRecurrence(body: any): { recurrence: 'recurring' | 'once'; scheduled_date: string | null } | null {
  const recurrence = body.recurrence === 'once' ? 'once' : 'recurring';
  if (recurrence === 'once') {
    if (typeof body.scheduled_date !== 'string' || !body.scheduled_date) return null;
    return { recurrence, scheduled_date: body.scheduled_date };
  }
  return { recurrence, scheduled_date: null };
}

// GET all recurring tasks (Manage screen — one-off tasks live only on their day)
router.get('/', async (req, res) => {
  const result = await pool.query(
    `${SELECT_WITH_CATEGORY} WHERE t.is_active = true AND t.user_id = $1 AND t.recurrence = 'recurring' ORDER BY t.time ASC`,
    [req.userId]
  );
  res.json(result.rows);
});

// CREATE task
router.post('/', async (req, res) => {
  const { title, time, category_id } = req.body;
  if (typeof category_id !== 'string' || !category_id) {
    res.status(400).json({ error: 'category_id is required' });
    return;
  }
  const parsed = parseRecurrence(req.body);
  if (!parsed) {
    res.status(400).json({ error: 'scheduled_date is required for a one-off task' });
    return;
  }
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, time, category_id, recurrence, scheduled_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.userId, title, time, category_id, parsed.recurrence, parsed.scheduled_date]
  );
  res.status(201).json(result.rows[0]);
});

// UPDATE task
router.put('/:id', async (req, res) => {
  const { title, time, category_id } = req.body;
  if (typeof category_id !== 'string' || !category_id) {
    res.status(400).json({ error: 'category_id is required' });
    return;
  }
  const parsed = parseRecurrence(req.body);
  if (!parsed) {
    res.status(400).json({ error: 'scheduled_date is required for a one-off task' });
    return;
  }
  const result = await pool.query(
    `UPDATE tasks SET title = $1, time = $2, category_id = $3, recurrence = $4, scheduled_date = $5
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [title, time, category_id, parsed.recurrence, parsed.scheduled_date, req.params.id, req.userId]
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
