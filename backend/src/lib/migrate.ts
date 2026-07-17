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
  await pool.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'recurring';
  `);
  await pool.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE NULL;
  `);

  // Category is now mandatory: every task must belong to one. Any task left
  // over from before this requirement (no category assigned) is dropped
  // rather than silently bucketed into a synthetic "uncategorized" group.
  await pool.query(`DELETE FROM tasks WHERE category_id IS NULL;`);
  await pool.query(`ALTER TABLE tasks ALTER COLUMN category_id SET NOT NULL;`);
  await pool.query(`ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_id_fkey;`);
  await pool.query(`
    ALTER TABLE tasks ADD CONSTRAINT tasks_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
  `);
}
