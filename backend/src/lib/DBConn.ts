import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Hosted Postgres (Neon, etc.) requires TLS; local dev Postgres doesn't speak it at all.
const useSSL = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});
