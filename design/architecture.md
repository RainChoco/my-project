# System Architecture

## 1. Tech Stack

### Frontend

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | React | 18.x |
| Build tool | Vite | 5.x |
| UI components | shadcn/ui | Radix UI + Tailwind CSS based, generated into `components/ui` |
| Styling | Tailwind CSS | 3.x (required by shadcn/ui) |
| Forms | Formik | 2.x |
| Form validation | Yup | 1.x |
| HTTP client | Axios | 1.x |
| Routing | React Router | 6.x - not explicitly named in the original stack list, but required to implement the `routes/`/`pages/` structure below |

### Backend

| Layer | Technology | Version / Notes |
|---|---|---|
| Runtime | Node.js | 20.x (LTS) |
| Framework | Express | 4.x |
| ORM | Sequelize | 6.x |
| Validation | Yup | 1.x (shared schema style with frontend) |
| Auth | jsonwebtoken, bcrypt | JWT-based session auth + password hashing - implied by RBAC requirement, not yet pinned |
| Postgres driver | pg, pg-hstore | Required by Sequelize to connect to PostgreSQL |
| File uploads | multer + cloudinary SDK | Handles multipart upload before forwarding to Cloudinary |

### Database

| Service | Technology | Notes |
|---|---|---|
| Database | PostgreSQL | 15.x, hosted on Neon (serverless Postgres) |

> Exact versions above are the team's target baseline for `package.json` - they should be pinned once each member starts installing dependencies, not treated as already-locked versions.

---

## 2. Folder Structure

### `frontend/src`

| Folder | Purpose |
|---|---|
| `assets/` | Static images, icons, and fonts bundled by Vite. |
| `components/` | Shared, reusable UI components; shadcn/ui primitives live in `components/ui`. |
| `features/` | Domain-driven modules, one per functional scope, each owning its own components, forms, and hooks: |
| `features/auth/` | Login/register forms and session-related UI (group-owned). |
| `features/tenders/` | Tender intake, CRUD, document upload, and eligibility review screens (Zheng Hong). |
| `features/evaluations/` | Evaluation criteria, PQM scoring, risk matrix, and approval screens (Jerrold). |
| `features/board-papers/` | Board paper and presentation deck generation/viewing screens (Calista). |
| `features/clarifications/` | Clarification request drafting and vendor response logging screens (Sulaiman). |
| `features/dashboard/` | Strategic rankings dashboard and KPI analytics screens (Kai Xuan). |
| `layouts/` | Page shell components (sidebar/topbar, auth layout) that wrap routed pages. |
| `lib/` | Cross-cutting setup code: Axios instance, shadcn's `cn()` utility, shared client config. |
| `pages/` | Top-level route components that compose layouts and features into full screens. |
| `routes/` | Router configuration and role-based route guards. |
| `schemas/` | Shared Yup validation schemas reused across multiple forms. |
| `context/` | React Context providers for auth/session state and global UI state. |
| `hooks/` | Reusable custom hooks not owned by a single feature. |
| `utils/` | Generic helper functions (formatters, constants, enums). |

### `backend/src`

| Folder | Purpose |
|---|---|
| `config/` | Environment config loader, Sequelize DB connection setup, and Cloudinary SDK config. |
| `models/` | Sequelize model definitions and association setup (`models/index.js` aggregates them). |
| `migrations/` | Sequelize-CLI migration files that version the PostgreSQL schema. |
| `seeders/` | Sequelize-CLI seed scripts for demo/test data. |
| `controllers/` | Request handlers containing route-level business logic, one file per resource. |
| `routes/` | Express route definitions mapping HTTP endpoints to controllers. |
| `middlewares/` | JWT auth verification, role-based access guards, centralized error handling, and upload middleware. |
| `validators/` | Yup schemas that validate request bodies before they reach controllers. |
| `services/` | Business/integration logic: ChatGPT calls, Cloudinary uploads, deterministic PQM score calculation. |
| `utils/` | Generic helpers (response formatting, logging). |

---

## 3. Third-Party Services

- **Cloudinary** - stores uploaded vendor tender documents and any generated deck/report assets, and serves them via CDN URL. Used from the backend's `services/` layer during document upload (Scope A) and deck export (Scope C).

## 4. Generative AI Services

- **ChatGPT API** (Google) - used for:
  - Parsing vendor tender documents and flagging eligibility issues (paid-up capital, BCA FM01 licensing, non-debarment declaration) - Scope A.
  - Extracting and structuring bid price/quality inputs, which the backend then scores deterministically into the PQM percentage - Scope B.
  - Generating the Risk Assessment & Mitigation Matrix from vendor constraints, subject to a human-review gate before being treated as official - Scope B.
  - Summarizing and transforming approved comparison data into Board Paper text and 28-slide Interview Deck content - Scope C.
  - Drafting clarification request messages when a pricing deviation is detected between a vendor's Main and Alternative Offer, subject to review before being logged as sent - Scope D.

## 5. Cloud Services (Deployment)

| Concern | Service |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Database | Neon (managed PostgreSQL) |
| File/image storage | Cloudinary |

Public URLs and required environment variables for each service are tracked in `deployment.md`, not duplicated here.
