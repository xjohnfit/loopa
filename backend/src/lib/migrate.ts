import { pool } from './DBConn';

// Additive, idempotent schema upgrades for databases created before a given
// feature shipped. schema.sql remains the source of truth for fresh installs.
export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
  `);
}
