<div align="center">

# Loopa

### A daily task planner built to actually get used — not just installed and forgotten.

[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-RTK_Query-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-K3s-326CE5?logo=kubernetes&logoColor=white)](https://k3s.io)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![iOS](https://img.shields.io/badge/iOS-EAS_Build-000020?logo=apple&logoColor=white)](https://expo.dev/eas)

</div>

---

## Why Loopa

Most to-do apps make you choose between "simple" and "actually useful." Loopa doesn't. It separates the two kinds of things that live on a real daily list — the routine you repeat every day, and the one-off thing you just need to remember *today* — instead of dumping both into one undifferentiated pile that gets messier the longer you use the app. Every task belongs to a color-coded category, and both the daily view and your task list are grouped by it automatically, so your day reads at a glance instead of as a wall of text.

It's not a tutorial project pretending to be a real app. It's a real app: email/password accounts with properly isolated user data, a production Postgres database, a Dockerized API running on a real Kubernetes cluster behind HTTPS, a CI/CD pipeline that tests, security-scans, and gates every deploy behind manual approval — and a native iOS build shipped through EAS. Everything below is what's actually running, not what's planned.

## Features

**Daily view that respects your time**
- A week-strip date picker that expands into a full month calendar with one tap — jump to any day directly instead of paging through a chevron thirty times, plus a live progress ring so you can see how much of the day is done without counting
- Pull-to-refresh, smooth day-to-day navigation, a "jump to today" shortcut the moment you're not on it

**Two kinds of tasks, because not everything repeats**
- **Recurring** tasks show up on your list every day until you archive them — your actual routine, and the daily view always shows this group first
- **One-off ("just for today")** tasks are scheduled for a single date and disappear after — for the things that don't belong in your routine but still need doing *today*. They're only ever visible, and only ever deletable, on the day they're for.

**Color-coded categories, and mandatory for a reason**
- Every task belongs to a category — no junk-drawer "uncategorized" pile to ignore. Create one with a name and a color in seconds, and both the daily view and your task list group everything by it automatically (recurring tasks grouped first, then just-for-today, category by category within each)

**Real accounts, not a shared notepad**
- Email/password auth (bcrypt + JWT), tokens held in the device's secure storage, every single query server-side scoped to the signed-in user — your data is yours, full stop

**Designed like something you'd pay for**
- A custom icon, splash screen, and design system (not the default React Native look), full light/dark mode that follows the system, and a UI built from a small set of reusable primitives rather than one-off screens

## Tech stack

| Layer | Technology |
|---|---|
| **Mobile app** | React Native 0.86, Expo SDK 57, TypeScript (strict), Redux Toolkit + RTK Query, React Navigation (native-stack), `react-native-svg` (hand-built icon set, no icon library dependency), `expo-secure-store` |
| **Backend API** | Node.js, Express 5, TypeScript, `pg` (node-postgres), `bcryptjs`, `jsonwebtoken` |
| **Database** | PostgreSQL, hosted on [Neon](https://neon.tech) (serverless, TLS-enforced) — schema upgrades apply themselves automatically at boot, no manual migration step |
| **Containerization** | Docker — multi-stage `node:20-alpine` build, non-root runtime user, built-in healthcheck |
| **Orchestration** | Kubernetes (K3s) on a self-managed VPS — Deployment/Service/Ingress, Traefik, cert-manager (Let's Encrypt) for automatic HTTPS |
| **CI/CD** | GitHub Actions — automated tests, Trivy vulnerability scanning (filesystem *and* built image), Docker Hub registry, manual-approval deployment gate, automatic rollback on failed rollout |
| **Mobile distribution** | EAS Build (managed iOS credentials/provisioning) + EAS Submit → App Store Connect / TestFlight |
| **Asset generation** | Python (Pillow) — the app icon, adaptive icon layers, and splash screen mark are all generated from one script, not hand-exported PNGs |

## How it works

### Architecture

```
┌─────────────────┐        HTTPS/REST         ┌──────────────────────┐        TLS         ┌───────────────┐
│   Expo RN App    │ ────────────────────────▶ │  Express API (K3s)    │ ──────────────────▶ │  Neon Postgres │
│ Redux Toolkit +   │ ◀──────────────────────── │ api.loopa.codewithxjohn.com                 │                │
│   RTK Query       │   bearer token on every   └──────────────────────┘                     └───────────────┘
└─────────────────┘        request                        ▲
                                                            │  build → scan → push → scan → deploy
                                                   ┌────────────────────┐
                                                   │  GitHub Actions CI/CD │
                                                   └────────────────────┘

iOS distribution:  EAS Build  →  App Store Connect / TestFlight
```

### Data model

Four tables, all scoped by `user_id`:

- **`users`** — email + bcrypt password hash
- **`categories`** — a user-owned `name` + `color`
- **`tasks`** — the core entity. `recurrence` is either `'recurring'` (a template, shown every day from creation until archived) or `'once'` (pinned to a single `scheduled_date`). `category_id` is `NOT NULL` — every task belongs to exactly one category, no exceptions.
- **`task_completions`** — one row per task per date, created only when a task is actually checked off — so "did I do this on March 3rd" is a real, queryable fact, not something reconstructed after the fact.

The rule that makes recurring vs. one-off actually work is one query: the daily-view endpoint returns a task if it's recurring *or* if its `scheduled_date` matches the day being viewed. That's it — a one-off task is structurally incapable of showing up on any day but its own, which also means it's structurally incapable of being deleted from anywhere else.

Both the daily view and the task list render as a grouped `SectionList` rather than a flat list: recurring tasks first, then one-off ones, and within each, grouped by category — so the display mirrors the two rules above instead of just sorting by time.

### Authentication

Register or log in → the API returns a JWT → the token is written to the device's secure storage (`expo-secure-store`, not plain `AsyncStorage`) → every subsequent request attaches it as a bearer token automatically via an RTK Query `prepareHeaders` hook. On sign-out, the entire API cache is reset alongside the token, so no data from one account can leak into a session for another on the same device.

### Deployment pipeline

Every push to `main` that touches the backend runs the same five-stage pipeline: **test → filesystem security scan → build & push the Docker image → scan the built image for critical CVEs → deploy.** The deploy stage itself is gated behind a GitHub Environment that requires manual approval, renders the Kubernetes manifests for the current image tag, applies them, watches the rollout, and **automatically rolls back** if it fails health checks. Nothing reaches production without a human clicking approve.

## Project structure

```
loopa/
  backend/         Express API — auth, tasks, categories, days
  mobile/          Expo / React Native app
  kubernetes/      Deployment manifests (templated, rendered per-deploy)
  branding/        Transparent-background mark export for external/portfolio use
  .github/workflows/  CI/CD pipeline
```

See [`LOOPA-BUILD-GUIDE.md`](./LOOPA-BUILD-GUIDE.md) for the full technical write-up — schema, every route, the design system, and the deployment pipeline in detail.

## Getting started (local dev)

```bash
# 1. Database
brew install postgresql@16 && brew services start postgresql@16
psql -U loopa_user -d loopa -f backend/db/schema.sql

# 2. Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL / JWT_SECRET
npm run dev

# 3. Mobile app
cd mobile
npm install
npx expo start
```

## Status

Live in production. Backend deployed and serving requests; iOS build shipped through EAS. Android support is scaffolded (adaptive icon assets already in place) but not yet built/submitted.

---

<div align="center">

Built solo, end to end — product design, mobile app, API, database, containerization, Kubernetes deployment, and CI/CD.

</div>
