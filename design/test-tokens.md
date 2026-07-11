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

Each token is valid 90 days from issuance (`iat`: 2026-07-10T16:13:06Z, `exp`: 2026-10-08T16:13:06Z) - long-lived since these are for local dev/test convenience only, not real logins (real logins via `POST /api/auth/login` get an 8-hour token). Use as `Authorization: Bearer <token>`.

To regenerate: `node -e "require('dotenv').config(); const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:1,full_name:'...',email:'...',role:'...'}, process.env.DEV_JWT_SECRET, {algorithm:'HS256', expiresIn:'90d'}))"` from `backend/`.

## Real login via the actual form / `POST /auth/login`

The seeded demo users (`20260101000001-demo-users.js`, `20260101000007-demo-users-vendor-liaison.js`) now hash a real, shared dev password instead of a placeholder string, so they work through the genuine login flow (real `bcrypt.compare`, no auth code bypassed):

```
DEV_PASSWORD=DevPass123!
```

Log in as any seeded user's email above with this password. If your local DB was seeded before this change, its `users` rows still have the old placeholder hash - re-run the seeders (e.g. `npx sequelize-cli db:seed:undo --seed 20260101000001-demo-users.js && npx sequelize-cli db:seed --seed 20260101000001-demo-users.js`, and likewise for `20260101000007-demo-users-vendor-liaison.js`) to pick up the new hash.

---

## `ma_staff` - Alice Tan (`users.id: 1`)

```json
{ "sub": 1, "full_name": "Alice Tan", "email": "alice.tan@townms.gov.sg", "role": "ma_staff", "iat": 1783699986, "exp": 1791475986 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImZ1bGxfbmFtZSI6IkFsaWNlIFRhbiIsImVtYWlsIjoiYWxpY2UudGFuQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoibWFfc3RhZmYiLCJpYXQiOjE3ODM2OTk5ODYsImV4cCI6MTc5MTQ3NTk4Nn0.dgHYHXwrhptOIAdFQ2cvlEP8VQdKDXETaNVjV1ckoBI
```

## `evaluator` - Ben Ong (`users.id: 2`)

```json
{ "sub": 2, "full_name": "Ben Ong", "email": "ben.ong@townms.gov.sg", "role": "evaluator", "iat": 1783699986, "exp": 1791475986 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImZ1bGxfbmFtZSI6IkJlbiBPbmciLCJlbWFpbCI6ImJlbi5vbmdAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJldmFsdWF0b3IiLCJpYXQiOjE3ODM2OTk5ODYsImV4cCI6MTc5MTQ3NTk4Nn0.WjTsTihUD3P0rRA1omy9rdnO_tkiXLhHfiXU93TfHm8
```

## `management` - Cheryl Lim (`users.id: 3`)

```json
{ "sub": 3, "full_name": "Cheryl Lim", "email": "cheryl.lim@townms.gov.sg", "role": "management", "iat": 1783699986, "exp": 1791475986 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImZ1bGxfbmFtZSI6IkNoZXJ5bCBMaW0iLCJlbWFpbCI6ImNoZXJ5bC5saW1AdG93bm1zLmdvdi5zZyIsInJvbGUiOiJtYW5hZ2VtZW50IiwiaWF0IjoxNzgzNjk5OTg2LCJleHAiOjE3OTE0NzU5ODZ9.9BMyukxtgbqL66-yzqqvhvz3FwyHdyTQ68EHLHB4e8w
```

## `report_preparer` - Devi Ravi (`users.id: 4`)

```json
{ "sub": 4, "full_name": "Devi Ravi", "email": "devi.ravi@townms.gov.sg", "role": "report_preparer", "iat": 1783699986, "exp": 1791475986 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImZ1bGxfbmFtZSI6IkRldmkgUmF2aSIsImVtYWlsIjoiZGV2aS5yYXZpQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoicmVwb3J0X3ByZXBhcmVyIiwiaWF0IjoxNzgzNjk5OTg2LCJleHAiOjE3OTE0NzU5ODZ9.hIhFaM_tA9EXPyCFMtppE-jszAHZoFCrHK1F6S50uNE
```

## `vendor_liaison` - Farid Rahman (`users.id: 5`)

```json
{ "sub": 5, "full_name": "Farid Rahman", "email": "farid.rahman@townms.gov.sg", "role": "vendor_liaison", "iat": 1783699986, "exp": 1791475986 }
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImZ1bGxfbmFtZSI6IkZhcmlkIFJhaG1hbiIsImVtYWlsIjoiZmFyaWQucmFobWFuQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoidmVuZG9yX2xpYWlzb24iLCJpYXQiOjE3ODM2OTk5ODYsImV4cCI6MTc5MTQ3NTk4Nn0.X1DLYKa3Owbx9BXNQLwthLmaecAlvmtap_L-AfxP4KU
```
