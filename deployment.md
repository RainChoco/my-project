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
| Frontend | *(to be set after Vercel deployment)* |
| Backend API | *(to be set after Render deployment)* |
| Health check | `<backend-url>/health` |

---

## 1. Database — Neon (PostgreSQL)

1. Create a free account at [neon.tech](https://neon.tech).
2. Create a new project and copy the **connection string** (format: `postgresql://user:password@host/dbname?sslmode=require`).
3. Set `DATABASE_URL` in your Render backend environment variables.
4. On first deploy, Sequelize will run `sync({ alter: true })` automatically — no manual migration needed.

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

The backend whitelists specific frontend origins. After deploying to Vercel, add the production URL to `backend/src/index.js`:

```js
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://<your-vercel-app>.vercel.app',  // ← add this
  ],
  ...
};
```

---

## 6. Local → Production Checklist

- [ ] `JWT_SECRET` set to a strong value (not the dev fallback)
- [ ] `DATABASE_URL` points to Neon (not SQLite)
- [ ] `VITE_API_BASE_URL` set to Render backend URL
- [ ] CORS list includes the Vercel frontend URL
- [ ] Cloudinary credentials set
- [ ] `npm run build` passes locally before deploying
- [ ] `npm test` passes (31/31)
- [ ] Health check `GET /health` returns `{ status: 'ok' }`

---

## Running Locally (Quick Reference)

```bash
# Terminal 1 — Backend
cd backend && npm run dev     # http://127.0.0.1:5000

# Terminal 2 — Frontend
cd frontend && npm run dev    # http://localhost:5173
```
