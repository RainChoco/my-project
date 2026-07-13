# Pre-Signed Test Tokens

Real JWTs signed by the actual auth implementation (`backend/src/services/authService.js`, `jsonwebtoken`, `HS256`), not hand-computed - so they are guaranteed to verify against `backend/src/middlewares/auth.js`'s `authenticate` middleware as-is.

**Canonical dev secret (matches `backend/.env.example`):**
```
DEV_JWT_SECRET=dev-secret-tender-app
```

> This supersedes the per-scope token lists in `design/zheng-hong/api-documentation.md`, `design/jerrold/api-documentation.md`, and `design/sulaiman/api-documentation.md` - those were signed against two different, inconsistent secret values (`dev-secret-tender-app` in two docs, `dev-secret-sccci-tender-2026` in Jerrold's) and predate the real middleware. Jerrold's doc has been updated to match this canonical secret and these same tokens (see below). Use **this** file as the source of truth going forward.

Payload shape (matches `backend/src/services/authService.js#signToken` and `users` table columns):
```json
{ "sub": <users.id>, "full_name": "<users.full_name>", "email": "<users.email>", "role": "<users.role>", "iat": <issued-at>, "exp": <expiry> }
```

Each token is valid 90 days from issuance (`iat`: 2026-07-13T08:03:37Z, `exp`: 2026-10-11T08:03:37Z) - long-lived since these are for local dev/test convenience only, not real logins (real logins via `POST /api/auth/login` get an 8-hour token). Use as `Authorization: Bearer <token>`.

To regenerate: `node -e "require('dotenv').config(); const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:1,full_name:'...',email:'...',role:'...'}, process.env.DEV_JWT_SECRET, {algorithm:'HS256', expiresIn:'90d'}))"` from `backend/`.

## Real login via the actual form / `POST /auth/login`

The seeded demo users (`20260101000001-demo-users.js`, `20260101000007-demo-users-vendor-liaison.js`, `20260101000008-demo-users-report-preparer.js`) now hash a real, shared dev password instead of a placeholder string, so they work through the genuine login flow (real `bcrypt.compare`, no auth code bypassed):

```
DEV_PASSWORD=DevPass123!
```

Log in as any seeded user's email above with this password. If your local DB was seeded before this change, its `users` rows still have the old placeholder hash - re-run the seeders (e.g. `npx sequelize-cli db:seed:undo --seed 20260101000001-demo-users.js && npx sequelize-cli db:seed --seed 20260101000001-demo-users.js`, and likewise for `20260101000007-demo-users-vendor-liaison.js` and `20260101000008-demo-users-report-preparer.js`) to pick up the new hash.

---

## `ma_staff` - Zheng Hong (`users.id: 1`)

```json
{ "sub": 1, "full_name": "Zheng Hong", "email": "zheng.hong@townms.gov.sg", "role": "ma_staff", "iat": 1783929817, "exp": 1791705817 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImZ1bGxfbmFtZSI6IlpoZW5nIEhvbmciLCJlbWFpbCI6InpoZW5nLmhvbmdAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJtYV9zdGFmZiIsImlhdCI6MTc4MzkyOTgxNywiZXhwIjoxNzkxNzA1ODE3fQ.YBg_9V2fjx3GapbC2PjhmtQqCtI-1sHJh4KCNnC9U_Q
```

## `evaluator` - Jerrold (`users.id: 2`)

```json
{ "sub": 2, "full_name": "Jerrold", "email": "jerrold@townms.gov.sg", "role": "evaluator", "iat": 1783929817, "exp": 1791705817 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImZ1bGxfbmFtZSI6IkplcnJvbGQiLCJlbWFpbCI6ImplcnJvbGRAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJldmFsdWF0b3IiLCJpYXQiOjE3ODM5Mjk4MTcsImV4cCI6MTc5MTcwNTgxN30.BwN27J6WqzjoswKRovQ07MsQR-SQsE1dUuuqe9_wsoA
```

## `management` - Kai Xuan (`users.id: 3`)

```json
{ "sub": 3, "full_name": "Kai Xuan", "email": "kai.xuan@townms.gov.sg", "role": "management", "iat": 1783929817, "exp": 1791705817 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImZ1bGxfbmFtZSI6IkthaSBYdWFuIiwiZW1haWwiOiJrYWkueHVhbkB0b3dubXMuZ292LnNnIiwicm9sZSI6Im1hbmFnZW1lbnQiLCJpYXQiOjE3ODM5Mjk4MTcsImV4cCI6MTc5MTcwNTgxN30.08jo6QJuSH87ssX_64Z0JJn1DTZzD1l3DJjeH6ZaJa8
```

## `report_preparer` - Calista (`users.id: 4`)

```json
{ "sub": 4, "full_name": "Calista", "email": "calista@townms.gov.sg", "role": "report_preparer", "iat": 1783929817, "exp": 1791705817 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImZ1bGxfbmFtZSI6IkNhbGlzdGEiLCJlbWFpbCI6ImNhbGlzdGFAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJyZXBvcnRfcHJlcGFyZXIiLCJpYXQiOjE3ODM5Mjk4MTcsImV4cCI6MTc5MTcwNTgxN30.GhDIwFVAPVlDqH97Oz4TDCZcfhTFEVzOAdjzv946nqw
```

## `vendor_liaison` - Sulaiman (`users.id: 5`)

```json
{ "sub": 5, "full_name": "Sulaiman", "email": "sulaiman@townms.gov.sg", "role": "vendor_liaison", "iat": 1783929817, "exp": 1791705817 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImZ1bGxfbmFtZSI6IlN1bGFpbWFuIiwiZW1haWwiOiJzdWxhaW1hbkB0b3dubXMuZ292LnNnIiwicm9sZSI6InZlbmRvcl9saWFpc29uIiwiaWF0IjoxNzgzOTI5ODE3LCJleHAiOjE3OTE3MDU4MTd9.EmkfqpQWAfbUXYBuAQepKs2UL6MP04iaRgPzbOg1Z1E
```
