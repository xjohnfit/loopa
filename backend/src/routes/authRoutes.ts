import { Router } from 'express';
import { pool } from '../lib/DBConn';
import { comparePassword, hashPassword, signToken } from '../lib/auth';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  try {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [normalizedEmail, passwordHash]
    );
    const userId = result.rows[0].id as string;
    res.status(201).json({ token: signToken(userId) });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [normalizedEmail]);
  const user = result.rows[0];

  if (!user || !(await comparePassword(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  res.json({ token: signToken(user.id) });
});

export default router;
