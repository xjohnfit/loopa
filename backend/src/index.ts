import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/authRoutes';
import tasksRouter from './routes/tasksRoutes';
import daysRouter from './routes/daysRoutes';
import { requireAuth } from './middleware/requireAuth';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/days', requireAuth, daysRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Loopa API running on :${PORT}`));
