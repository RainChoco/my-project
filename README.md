# Tender Evaluation Platform

Town Council Managing Agents currently run tender evaluations manually - comparing vendor terms, checking eligibility, calculating Price-Quality Method (PQM) scores, and drafting board papers by hand. This full-stack application uses Generative AI (ChatGPT/OpenAI) to automate eligibility parsing, bid comparison, PQM scoring, risk assessment, and generation of board paper and presentation content, reducing manual effort and inconsistency across evaluators.

---

The application is a full-stack tender evaluation platform where MA staff ingest vendor bid documents and ChatGPT parses eligibility data and structures bid terms for review. PQM scores and risk matrices are computed deterministically in the backend for accuracy, with human review gates before evaluators log approvals with a full audit trail. Approved data then flows automatically into board paper text, a 28-slide interview deck, vendor clarification logs, and a strategic rankings dashboard, turning a fragmented manual process into one connected workflow.

## Team & Feature Allocation

| Member | Scope | Features |
|---|---|---|
| Zheng Hong | Scope A — Ingestion & CRUD | Tender Submission Intake, Tender CRUD & Status Tracking, Document Storage, AI Eligibility Parsing, Eligibility Flag Review |
| Jerrold | Scope B — Evaluation & Approval | Evaluation Criteria Setup, AI Bid Term Extraction, PQM Score Calculation, AI Risk Matrix, Approval Workflow, Audit Trail |
| Calista | Scope C — Board Papers | Board Paper Text Generation, 28-Slide Interview Deck, Report Versioning, Export to Editable Format |
| Sulaiman | Scope D — Alternate Proposal Communication | Pricing Deviation Detection, Clarification Request Drafting, Draft Review Gate, Vendor Response Logging |
| Kai Xuan | Scope E — Strategic Rankings Dashboard | Contract Opportunity CRUD, Tender Ranking List, KPI Analytics Dashboard, Multi-Level Filtering, Archive |
| All (Group) | Shared Infrastructure | Authentication, JWT middleware, RBAC, Deployment |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5, shadcn/ui, Tailwind CSS, React Query, Formik/Yup, React Router 6 |
| Backend | Node.js 20, Express 5, Sequelize 6, Yup, JWT (jsonwebtoken), bcrypt |
| Database (dev) | SQLite (auto-created via `sequelize.sync`) |
| Database (prod) | PostgreSQL 15 on Neon (serverless) |
| File Storage | Cloudinary |
| AI | OpenAI ChatGPT API |
| Deployment | Frontend → Vercel · Backend → Render · DB → Neon |

---

## Prerequisites

- Node.js 20 LTS
- npm 9+
- Git

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/<org>/FullStackAppDevProjectICA1.git
cd FullStackAppDevProjectICA1
```

### 2. Backend setup

```bash
cd backend
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000

# Auth — generate a strong secret for production
JWT_SECRET=your-strong-secret-here
DEV_JWT_SECRET=dev-secret-tender-app

# Cloudinary (document storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OpenAI
OPENAI_API_KEY=your-openai-key
```

> **Note:** In development the app uses SQLite (`backend/tender_db.sqlite`), which is created automatically on first run. No database installation is required locally.

Start the backend:

```bash
npm run dev
# Server running on port 5000
```

To seed a demo user for testing:

```bash
node seed-demo-user.js
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
# Frontend running on http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://127.0.0.1:5000`, so no frontend environment variables are required for local development.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Port for the Express server (default `5000`) |
| `JWT_SECRET` | Yes (prod) | Secret key for signing JWTs |
| `DEV_JWT_SECRET` | No | Fallback secret for local dev |
| `DATABASE_URL` | Prod only | PostgreSQL connection string (Neon) |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API secret |
| `OPENAI_API_KEY` | Optional | OpenAI API key for AI features |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Prod only | Full backend URL e.g. `https://your-app.onrender.com/api` |

---

## Running Tests

```bash
cd backend
npm test
```

Expected output:

```
Test Suites: 2 passed, 2 total
Tests:       31 passed, 31 total
```

---

## Building for Production

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

---

## Deployment

See [`deployment.md`](./deployment.md) for full deployment instructions including:

- Backend deployment to Render
- Frontend deployment to Vercel
- PostgreSQL setup on Neon
- Required environment variables for production

---

## Project Structure

```
FullStackAppDevProjectICA1/
├── backend/
│   ├── src/
│   │   ├── config/        # DB connection, Cloudinary config
│   │   ├── controllers/   # Route handlers
│   │   ├── middlewares/   # JWT auth, RBAC, upload, validation
│   │   ├── models/        # Sequelize models + associations
│   │   ├── routes/        # Express route definitions
│   │   ├── services/      # Business logic, AI calls, Cloudinary
│   │   ├── validators/    # Yup request schemas
│   │   └── index.js       # App entry point
│   └── tests/             # Jest test suites (per member)
├── frontend/
│   └── src/
│       ├── components/    # Shared UI primitives (shadcn/ui)
│       ├── context/       # Auth context
│       ├── features/      # Domain modules (auth, tenders, evaluations, dashboard, …)
│       ├── layouts/       # App shell
│       ├── lib/           # Axios client, utilities
│       ├── routes/        # React Router config + role guards
│       └── schemas/       # Shared Yup schemas
├── design/                # Architecture, ER diagram, per-member API & use-case docs
├── README.md
└── deployment.md
```

---

## Design Documentation

| Document | Location |
|---|---|
| Architecture | [`design/architecture.md`](./design/architecture.md) |
| ER Diagram | [`design/er-diagram.md`](./design/er-diagram.md) |
| API Docs (per member) | `design/<member>/api-documentation.md` |
| Use Cases (per member) | `design/<member>/use-cases.md` |
| DB Schema (per member) | `design/<member>/database-schema.md` |
