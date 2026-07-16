import { Router } from 'express';
import { pool } from '../lib/DBConn';

const router = Router();

// GET tasks + completion status for a specific date
router.get('/:date', async (req, res) => {
  const { date } = req.params; // 'YYYY-MM-DD'
  const result = await pool.query(
    `SELECT t.id, t.title, t.time,
            COALESCE(tc.completed, false) AS completed
     FROM tasks t
     LEFT JOIN task_completions tc
       ON tc.task_id = t.id AND tc.date = $1
     WHERE t.created_at::date <= $1
       AND (t.archived_at IS NULL OR t.archived_at::date >= $1)
     ORDER BY t.time ASC`,
    [date]
  );
  res.json(result.rows);
});

// Toggle / upsert completion for a task on a date
router.patch('/:date/tasks/:taskId', async (req, res) => {
  const { date, taskId } = req.params;
  const { completed } = req.body;
  const result = await pool.query(
    `INSERT INTO task_completions (task_id, date, completed, completed_at)
     VALUES ($1, $2, $3, CASE WHEN $3 THEN now() ELSE NULL END)
     ON CONFLICT (task_id, date)
     DO UPDATE SET completed = $3,
                   completed_at = CASE WHEN $3 THEN now() ELSE NULL END
     RETURNING *`,
    [taskId, date, completed]
  );
  res.json(result.rows[0]);
});

export default router;
