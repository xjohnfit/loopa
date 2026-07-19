import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/authRoutes';
import tasksRouter from './routes/tasksRoutes';
import daysRouter from './routes/daysRoutes';
import categoriesRouter from './routes/categoriesRoutes';
import { requireAuth } from './middleware/requireAuth';
import { runMigrations } from './lib/migrate';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.get('/privacy', (_req, res) => res.sendFile(path.join(__dirname, '../public/privacy.html')));
app.get('/support', (_req, res) => res.sendFile(path.join(__dirname, '../public/support.html')));

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/days', requireAuth, daysRouter);
app.use('/api/categories', requireAuth, categoriesRouter);

const PORT = process.env.PORT || 5000;

runMigrations()
  .then(() => {
    app.listen(PORT, () => console.log(`Loopa API running on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to run migrations', err);
    process.exit(1);
  });
