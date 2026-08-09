# Deployment Guide

This document covers deploying the Tender Evaluation Platform to production:

- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [Render](https://render.com)
- **Database** → [Neon](https://neon.tech) (serverless PostgreSQL)
- **File Storage** → [Cloudinary](https://cloudinary.com)

---

## Public URLs

| Service | URL |
|---|---|
| Frontend | https://my-project-git-main-my-project-4d77.vercel.app |
| Backend API | https://my-project-3j4a.onrender.com/api |
| Health check | https://my-project-3j4a.onrender.com/health |

> The frontend URL is Vercel's stable "git branch" alias (always points at the latest `main` deploy) - Vercel also mints a new random preview URL per deploy, which the backend's CORS config allows automatically via a `my-project-*.vercel.app` pattern match (see `backend/src/index.js`).

---

## Test User Accounts

Log in at [`https://my-project-git-main-my-project-4d77.vercel.app/login`](https://my-project-git-main-my-project-4d77.vercel.app/login) with any of the accounts below. They're seeded automatically on every backend startup/sync (`backend/src/utils/seedDemoUsers.js`), so they already exist on the live Render + Neon deployment above - no setup needed. All accounts share the same demo password.

| Role | Username (Email) | Password | Full Name |
|---|---|---|---|
| `ma_staff` | `alice.tan@townms.gov.sg` | `DevPass123!` | Alice Tan |
| `evaluator` | `ben.ong@townms.gov.sg` | `DevPass123!` | Ben Ong |
| `management` | `cheryl.lim@townms.gov.sg` | `DevPass123!` | Cheryl Lim |
| `report_preparer` | `calista@townms.gov.sg` | `DevPass123!` | Calista Tan |

> These are seeded demo credentials, not production secrets - the password is hardcoded in `seedDemoUsers.js` for local/demo use only. Do not reuse this password scheme for real accounts.

> ⚠️ **Known gap:** there is no seeded demo account for the `vendor_liaison` role (Sulaiman's Scope D - vendor clarification responses, job adjustment follow-ups). Add one to `DEMO_USERS` in `seedDemoUsers.js` if a reviewer needs to exercise that role directly.

---

## 1. Database — Neon (PostgreSQL)

1. Create a free account at [neon.tech](https://neon.tech).
2. Create a new project and copy the **connection string** (format: `postgresql://user:password@host/dbname?sslmode=require`).
3. Set `DATABASE_URL` in your Render backend environment variables.
4. On first deploy, Sequelize runs a plain `sync()` automatically, which creates any tables that don't exist yet - this is enough for a brand-new database. It does not alter existing tables to match later model changes, so after pulling in schema changes on an already-deployed database, run the migrations explicitly: `npx sequelize-cli db:migrate` (see `src/migrations/`).

---

## 2. Backend — Render

### Steps

1. Push code to GitHub (main branch).
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repository.
4. Set the following:

| Field | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |

### Required Environment Variables (Render Dashboard)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | A strong random secret (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `FRONTEND_URL` | Your Vercel frontend URL |

> **Security note:** Never commit real secrets to the repository. Always set them via the Render environment variables dashboard.

---

## 3. Frontend — Vercel

### Steps

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repository.
3. Set the following:

| Field | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Required Environment Variables (Vercel Dashboard)

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-render-app>.onrender.com/api` |

> After setting `VITE_API_BASE_URL`, Vercel will rebuild automatically. The Vite dev proxy is not used in production — all API calls go directly to the Render backend.

---

## 4. Cloudinary (File Storage)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the Cloudinary dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Set these in Render as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## 5. CORS Configuration

The backend whitelists specific frontend origins in `backend/src/index.js`. Localhost origins are always allowed; the deployed Vercel origin is added via the `FRONTEND_URL` environment variable - no code change needed.

After deploying to Vercel, set `FRONTEND_URL` in the Render backend environment variables to your Vercel URL (e.g. `https://<your-vercel-app>.vercel.app`). If you have both a production and a preview URL, separate them with a comma: `FRONTEND_URL=https://app.vercel.app,https://app-preview.vercel.app`. Render redeploys automatically when an environment variable changes.

---

## 6. Local → Production Checklist

- [ ] `JWT_SECRET` set to a strong value (not the dev fallback)
- [ ] `DATABASE_URL` points to Neon (not SQLite)
- [ ] `VITE_API_BASE_URL` set to Render backend URL (as an absolute URL, e.g. `https://<app>.onrender.com/api` - not left unset, since it silently falls back to a relative `/api` path that Vercel has no rewrite for)
- [ ] `FRONTEND_URL` set on Render to the Vercel frontend URL
- [ ] Cloudinary credentials set
- [ ] `npm run build` passes locally before deploying
- [ ] `npm test` passes in both `backend/` and `frontend/`
- [ ] Health check `GET /health` returns `{ status: 'ok' }`

---

## Running Locally (Quick Reference)

```bash
# Terminal 1 — Backend
cd backend && npm run dev     # http://127.0.0.1:5000

# Terminal 2 — Frontend
cd frontend && npm run dev    # http://localhost:5173
```
