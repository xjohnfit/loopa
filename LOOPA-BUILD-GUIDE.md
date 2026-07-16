# Loopa — Daily Goal Task Planner
### Postgres (Neon) → Express API (Docker/K3s) → Expo/React Native + Redux Toolkit, with JWT auth, categories, recurring/one-off tasks, and CI/CD deployment

---

## 0. Architecture at a glance

```
[Neon Postgres] <--pg/SSL--> [Express API on K3s]  <--HTTPS/REST-->  [Expo RN App]
                               api.loopa.codewithxjohn.com                |
                                     ^                            Redux Toolkit + RTK Query
                                     |                             (auth token attached to
                          GitHub Actions CI/CD                      every request)
                     build → scan → push → deploy
                        (Docker Hub + Hostinger VPS)

iOS build/submit: EAS Build → App Store Connect / TestFlight
```

- **Users** authenticate with email/password (bcrypt + JWT). Every table below is scoped by `user_id` — there is no shared data between accounts.
- **Categories** are user-defined, color-coded labels a task can optionally belong to.
- **Tasks** are either:
  - `recurring` — the original model: a template shown on every day from its creation date forward, until archived.
  - `once` — a one-off task pinned to a single `scheduled_date`. It only ever appears (and is only ever deletable) on that specific day, and never appears in the recurring "Manage Tasks" list.
- **Task Completions** = one row per task per date, created/updated only when a user checks a task off on a given day. Applies the same way to both recurring and one-off tasks.
- The "Daily Tasks" screen always asks the API: *"give me every task active on date X (recurring or scheduled for X), with its completion status for X."*

---

## 1. Repository layout

This is a single monorepo (`github.com/xjohnfit/loopa`), matching the same `backend/` + `mobile/` + `kubernetes/` + `.github/workflows/` convention used across other projects on this deployment pipeline:

```
loopa/
  backend/
    db/schema.sql
    src/
      index.ts
      lib/
        DBConn.ts        # pg Pool, SSL-aware
        auth.ts           # password hashing, JWT sign/verify
        migrate.ts         # idempotent auto-migrations, run at boot
      middleware/
        requireAuth.ts
      routes/
        authRoutes.ts
        tasksRoutes.ts
        daysRoutes.ts
        categoriesRoutes.ts
      types/
        express.d.ts      # augments Request with userId
    Dockerfile
    .dockerignore
  mobile/
    App.tsx
    app.json
    eas.json
    assets/                # icon, adaptive icon layers, splash, favicon
    scripts/generate-assets.py
    src/
      api/apiSlice.ts       # RTK Query — attaches the bearer token to every call
      app/{store.ts,hooks.ts}
      features/
        auth/{authSlice.ts,tokenStorage.ts}
        ui/uiSlice.ts        # selected date
      theme/                 # colors, spacing, typography, radii, shadows
      components/
        ui/                  # Screen, Card, IconButton, PrimaryButton,
                              # ProgressRing, EmptyState, Fab, ActionCard, Icon
        DateHeader.tsx
        TaskItem.tsx
      screens/
        AuthScreen.tsx
        DailyTasksScreen.tsx
        ManageTasksScreen.tsx
        TaskFormScreen.tsx
        CategoryFormScreen.tsx
      navigation/RootNavigator.tsx
      utils/date.ts
  kubernetes/
    backend-deployment.yml
    backend-service.yml
    cluster-issuer-{prod,staging}.yml
    ingress.yml
  .github/workflows/deploy.yml
```

---

## 2. Database — Postgres (Neon in production, local Postgres for dev)

### 2.1 Schema — `backend/db/schema.sql`

This is the source of truth for a **fresh** database. Existing databases (local or Neon) are upgraded automatically at boot — see [§3.3](#33-auto-migrations--backendsrclibmigratets).

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  time TIME NOT NULL,              -- e.g. 07:30:00
  recurrence TEXT NOT NULL DEFAULT 'recurring', -- 'recurring' | 'once'
  scheduled_date DATE NULL,        -- set only when recurrence = 'once'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NULL
);

CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  UNIQUE (task_id, date)
);

CREATE INDEX idx_task_completions_date ON task_completions(date);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
```

### 2.2 Local dev database

```bash
brew install postgresql@16
brew services start postgresql@16
psql postgres
```

```sql
CREATE DATABASE loopa;
CREATE USER loopa_user WITH ENCRYPTED PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE loopa TO loopa_user;
```

Run `schema.sql` once (the app's auto-migration handles everything after that):

```bash
psql -U loopa_user -d loopa -f backend/db/schema.sql
```

### 2.3 Production database — Neon

Production uses [Neon](https://neon.tech) (serverless Postgres, free tier, TLS-required). The connection string is stored as the `DATABASE_URL` GitHub Actions secret and injected into the backend pod as a Kubernetes Secret — see [§5](#5-deployment--cicd).

---

## 3. Backend — Express API

### 3.1 `backend/src/lib/DBConn.ts` — SSL-aware pool

Neon (and most hosted Postgres) requires TLS; local dev Postgres doesn't speak it at all, so SSL is toggled by `NODE_ENV` (set to `production` by the Dockerfile):

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const useSSL = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});
```

### 3.2 Auth — `backend/src/lib/auth.ts`, `middleware/requireAuth.ts`, `routes/authRoutes.ts`

Email/password with bcrypt hashing and a 30-day JWT. Every other route is mounted behind `requireAuth`, which attaches `req.userId` (typed via `types/express.d.ts`):

```typescript
// lib/auth.ts
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);
export const signToken = (userId: string) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
export const verifyToken = (token: string): string => (jwt.verify(token, JWT_SECRET) as jwt.JwtPayload).sub as string;
```

```typescript
// middleware/requireAuth.ts
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });
  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

`POST /api/auth/register` and `POST /api/auth/login` both return `{ token }`. Registration rejects passwords under 8 characters and duplicate emails (Postgres `23505` → `409`).

### 3.3 Auto-migrations — `backend/src/lib/migrate.ts`

There's no separate migration tool. Instead, `runMigrations()` runs a set of additive, idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements once at boot, before the server starts listening — so pushing new schema-touching code and deploying is enough; no manual `psql` step against Neon is ever needed:

```typescript
export async function runMigrations() {
  await pool.query(`CREATE TABLE IF NOT EXISTS categories (...)`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'recurring';`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE NULL;`);
  // ...indexes
}
```

```typescript
// index.ts
runMigrations()
  .then(() => app.listen(PORT, () => console.log(`Loopa API running on :${PORT}`)))
  .catch((err) => { console.error('Failed to run migrations', err); process.exit(1); });
```

### 3.4 Categories — `routes/categoriesRoutes.ts`

Simple, user-scoped list/create:

```typescript
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at ASC', [req.userId]);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, color } = req.body;
  const result = await pool.query(
    'INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
    [req.userId, name.trim(), color]
  );
  res.status(201).json(result.rows[0]);
});
```

`tasksRoutes.ts` and `daysRoutes.ts` both `LEFT JOIN categories` so every task response includes `category_id`, `category_name`, `category_color`.

### 3.5 Recurring vs. one-off tasks — `routes/tasksRoutes.ts`, `routes/daysRoutes.ts`

`POST/PUT /api/tasks` accept `recurrence: 'recurring' | 'once'` and, for `'once'`, a required `scheduled_date` (`400` if missing):

```typescript
function parseRecurrence(body: any) {
  const recurrence = body.recurrence === 'once' ? 'once' : 'recurring';
  if (recurrence === 'once') {
    if (typeof body.scheduled_date !== 'string' || !body.scheduled_date) return null;
    return { recurrence, scheduled_date: body.scheduled_date };
  }
  return { recurrence, scheduled_date: null };
}
```

`GET /api/tasks` (the "Manage Tasks" list) only ever returns recurring tasks:

```sql
SELECT ... FROM tasks t
WHERE t.is_active = true AND t.user_id = $1 AND t.recurrence = 'recurring'
ORDER BY t.time ASC
```

`GET /api/days/:date` ORs the two recurrence types together, so a one-off task is visible only on its own `scheduled_date` — never before, never after, and never in Manage Tasks:

```sql
SELECT ... FROM tasks t
WHERE t.user_id = $2
  AND (
    (t.recurrence = 'recurring' AND t.created_at::date <= $1
      AND (t.archived_at IS NULL OR t.archived_at::date >= $1))
    OR
    (t.recurrence = 'once' AND t.scheduled_date = $1 AND t.archived_at IS NULL)
  )
ORDER BY t.time ASC
```

Because a one-off task is only ever *reachable* through the daily view on its own date, "deletable from the day it was created only" falls out of this query for free — there's no other day it could be deleted from.

### 3.6 Local dev

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL, PORT, JWT_SECRET
npm run dev             # tsx watch — NOT ts-node-dev, which is incompatible with TS7
```

`npm run build` (`tsc`) + `npm start` (`node dist/index.js`) is what the Docker image runs in production.

---

## 4. Expo / React Native app

### 4.1 Design system — `mobile/src/theme/`

`colors.ts`, `spacing.ts`, `typography.ts` define light/dark palettes and scales; `theme/index.ts` exposes a `useTheme()` hook (reads `useColorScheme()`) so every screen/component pulls consistent colors, spacing, radii, and a `shadow()` helper without prop-drilling. `theme/categoryColors.ts` holds the fixed swatch palette users pick from when creating a category.

Reusable primitives live in `src/components/ui/`: `Screen` (safe-area + themed background), `Card`, `IconButton`, `PrimaryButton`, `ProgressRing` (SVG-based daily completion ring), `EmptyState`, `Fab`, `ActionCard` (the colored top-of-screen action cards), and a hand-built `Icon` component (`react-native-svg`, no external icon library) covering chevrons, plus, close, trash, list, calendar-check, check, and tag.

### 4.2 `src/api/apiSlice.ts` — RTK Query, with auth attached to every request

```typescript
const BASE_URL = 'https://api.loopa.codewithxjohn.com/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Tasks', 'Day', 'Categories'],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, { email: string; password: string }>(...),
    login: builder.mutation<AuthResponse, { email: string; password: string }>(...),
    getCategories: builder.query<Category[], void>(...),
    createCategory: builder.mutation<Category, { name: string; color: string }>(...),
    getTasks: builder.query<Task[], void>(...),
    createTask: builder.mutation<Task, { title; time; category_id; recurrence; scheduled_date }>(...),
    updateTask: builder.mutation<Task, { id; title; time; category_id; recurrence; scheduled_date }>(...),
    deleteTask: builder.mutation<void, string>(...),
    getDay: builder.query<DayTask[], string>(...),
    toggleTaskCompletion: builder.mutation<DayTask, { date; taskId; completed }>(...),
  }),
});
```

### 4.3 Auth flow — `src/features/auth/`, `AuthScreen.tsx`, `RootNavigator.tsx`

`authSlice.ts` holds `{ token, status: 'loading' | 'ready' }`. `tokenStorage.ts` wraps `expo-secure-store` (not `AsyncStorage` — tokens shouldn't sit in plain storage). Three thunks:

```typescript
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => (await loadToken()) ?? null);
export const signIn = createAsyncThunk('auth/signIn', async (token: string) => { await saveToken(token); return token; });
export const signOut = createAsyncThunk('auth/signOut', async () => { await deleteToken(); });
```

`RootNavigator` dispatches `bootstrapAuth()` on mount, shows a spinner while `status === 'loading'`, then renders either the `Auth` stack (login/signup) or the main app stack based on whether `token` is set — no separate "logged out" screen state to keep in sync elsewhere. `AuthScreen.tsx` toggles between login/register mode and calls `apiSlice.util.resetApiState()` on sign-in/sign-out so no cached data leaks between accounts on the same device. Sign-out lives on Manage Tasks (top-right, with a confirm alert).

### 4.4 Categories & recurring/one-off tasks — UI

- **Manage Tasks** opens with two color-coded `ActionCard`s — teal "Add Category", violet "Add Task" — instead of a FAB.
- **CategoryFormScreen** — name input + an 8-color swatch grid (`theme/categoryColors.ts`).
- **TaskFormScreen** — category picker (horizontal chips, color dot + name, "+ New" shortcut into `CategoryForm`), and a "Recurring" / "Just for Today" segmented control. A one-off task defaults its `scheduled_date` to today (or preserves the original date if editing one).
- Task rows (`TaskItem.tsx` on the daily list, and the row markup in `ManageTasksScreen.tsx`) show a 4px colored left-edge accent matching the task's category.
- `TaskItem` shows a delete button only when `task.recurrence === 'once'` — recurring tasks are still only deletable from Manage Tasks, keeping that screen as the single place that manages the recurring routine.

### 4.5 App icon, splash screen, EAS

- `assets/` holds the generated icon (light/dark/tinted iOS variants), Android adaptive icon layers (foreground/background/monochrome), splash mark, and favicon — all produced by `scripts/generate-assets.py` (Pillow), so the brand mark can be regenerated if the palette ever changes.
- `app.json` configures `expo-splash-screen` (solid brand color + white mark, separate light/dark variants) and `ios.bundleIdentifier: com.xjohnfitcodes.loopa`.
- `eas.json` defines `development` / `preview` / `production` build profiles. The EAS project is linked via `extra.eas.projectId` (`eas init`).

### 4.6 Local dev

```bash
cd mobile
npm install
npx expo start
```

The app always points at the production API (`api.loopa.codewithxjohn.com`) — there's no local-backend mode. To test against a local backend instead, temporarily change `BASE_URL` in `apiSlice.ts`.

---

## 5. Deployment & CI/CD

### 5.1 Docker — `backend/Dockerfile`

Multi-stage build (`node:20-alpine`): install + `tsc` in a builder stage, then a slim runtime stage that installs only production deps, runs as a non-root user, and defines a `/api/health` `HEALTHCHECK`.

### 5.2 Kubernetes — `kubernetes/`

Templated manifests (`${APP_NAME}`, `${BACKEND_PORT}`, etc. — filled in by `envsubst` at deploy time, never hand-edited per project):

- `backend-deployment.yml` — single replica, rolling update, `DATABASE_URL`/`JWT_SECRET` from a K8s Secret, resource requests/limits tuned for a small shared VPS, liveness/readiness probes against `/api/health`.
- `backend-service.yml` — `ClusterIP`.
- `ingress.yml` — Traefik ingress routing `api.loopa.codewithxjohn.com` to the backend service, TLS via cert-manager.
- `cluster-issuer-{prod,staging}.yml` — Let's Encrypt `ClusterIssuer`s (cluster-wide, shared across projects on the same K3s cluster).

### 5.3 CI/CD — `.github/workflows/deploy.yml`

One pipeline, path-filtered to `backend/**`, `kubernetes/**`, and the workflow file itself (so mobile-only commits never trigger a backend redeploy):

1. **test-backend** — `npm ci && npm run build`
2. **trivy-fs-scan** — filesystem scan (deps, secrets, IaC misconfig) → GitHub Security tab
3. **build-and-push** — Docker Buildx → Docker Hub, tagged `main-<short-sha>` + `latest`
4. **scan-images** — Trivy against the built image, hard-fails on a fixable `CRITICAL` CVE
5. **deploy** — gated behind the `production` GitHub Environment (requires manual approval); renders the K8s manifests via `envsubst`, applies them, waits for rollout, **auto rolls back** on failure

Runs on push to `main` (path-filtered) or `workflow_dispatch` (manual trigger — both are wired into the same `if:` condition, since a skipped-but-green job is easy to miss).

Repo configuration (GitHub Variables — non-secret): `APP_NAME=loopa`, `BACKEND_PORT=5000`, `HEALTH_CHECK_PATH=/api/health`, `BACKEND_DOMAIN=api.loopa.codewithxjohn.com`, `LETSENCRYPT_EMAIL`. Secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `KUBECONFIG` (base64, from the Hostinger VPS's k3s.yaml), `DATABASE_URL` (Neon), `JWT_SECRET`.

### 5.4 iOS — EAS Build + Submit

```bash
cd mobile
npx eas-cli build --platform ios --profile production   # interactive Apple ID login first run
npx eas-cli submit --platform ios --latest                # → App Store Connect / TestFlight
```

Any change to `mobile/` needs a new EAS build to reach a device — unlike the backend, there's no OTA/CI path for the app yet (see [§7](#7-natural-next-steps)).

---

## 6. Local run order

1. Start Postgres, run `backend/db/schema.sql` once against a fresh local database.
2. `cd backend && npm install && npm run dev` (needs `DATABASE_URL`, `PORT`, `JWT_SECRET` in `.env`).
3. `cd mobile && npm install && npx expo start` — the app talks to production (`api.loopa.codewithxjohn.com`) by default; point `BASE_URL` in `apiSlice.ts` at `http://localhost:<PORT>/api` if you want to test against your local backend instead.

---

## 7. Natural next steps

- ~~**Auth**~~ — done: email/password, JWT, all data scoped by `user_id`.
- ~~**Categories**~~ — done: color-coded, user-scoped.
- ~~**One-off tasks**~~ — done: "just for today" tasks alongside the recurring routine.
- **Editing/deleting categories** — currently create + list only; no rename/delete/reassign flow yet.
- **Streaks/stats** — aggregate `task_completions` by task to show completion %.
- **Reordering tasks** — add a `sort_order` int column to `tasks`.
- **Push reminders** — `expo-notifications` scheduled from each task's `time`.
- **OTA updates for the mobile app** — `expo-updates` + EAS Update, so JS-only changes don't require a full App Store review cycle.
- **Android build** — the backend/app already support it (`app.json` has adaptive icon assets configured); only the EAS Android build/submit step is outstanding.
- **Quick-add for one-off tasks from the daily view itself** — today "Just for Today" tasks can only be created via Manage Tasks' "Add Task" card, defaulting to today's date; adding an entry point directly on `DailyTasksScreen` would let a one-off task be scheduled for whichever day is currently being viewed, not just today.
