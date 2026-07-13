# API Documentation - Zheng Hong (Scope A: Tender Document Receiving & CRUD)

Covers only the endpoints this scope owns, matching `design/zheng-hong/use-cases.md` and `design/zheng-hong/database-schema.md`. All routes are mounted under `/api`. All responses are JSON. All endpoints require a valid JWT (`Authorization: Bearer <token>`) unless stated otherwise - there are no public/unauthenticated endpoints in this scope.

---

## Tender CRUD

### `POST /api/tenders`

- **Purpose:** Create a new tender submission record (UC-A1, step 1).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:**
  ```json
  {
    "tender_ref_no": "TC-2026-007",
    "vendor_name": "Coastal Works Pte Ltd",
    "submission_date": "2026-07-01",
    "main_offer_price": 15000000.00,
    "alternative_offer_price": 14200000.00
  }
  ```
- **Success Response `201 Created`:**
  ```json
  {
    "id": 7,
    "tender_ref_no": "TC-2026-007",
    "vendor_name": "Coastal Works Pte Ltd",
    "submission_date": "2026-07-01",
    "main_offer_price": "15000000.00",
    "alternative_offer_price": "14200000.00",
    "paid_up_capital": null,
    "bca_fm01_license_no": null,
    "bca_fm01_grade": null,
    "non_debarment_declared": false,
    "eligibility_status": "pending",
    "status": "draft",
    "created_by": 1,
    "created_at": "2026-07-01T09:00:00.000Z",
    "updated_at": "2026-07-01T09:00:00.000Z"
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Missing required field, or `main_offer_price` is not a positive number |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Authenticated user's role is not `ma_staff` |
  | `409 Conflict` | `tender_ref_no` already exists |

### `GET /api/tenders`

- **Purpose:** List/filter tender submissions (UC-A2).
- **Auth required:** Yes - any authenticated role
- **Query Parameters:**
  | Param | Type | Notes |
  |---|---|---|
  | `status` | string | Filter by `draft`, `submitted`, `under_evaluation`, `approved`, `rejected`, `withdrawn` |
  | `eligibility_status` | string | Filter by `pending`, `eligible`, `flagged`, `rejected` |
  | `vendor_name` | string | Partial, case-insensitive match |
  | `page`, `limit` | integer | Pagination, defaults `page=1`, `limit=20` |
- **Success Response `200 OK`:**
  ```json
  {
    "data": [
      {
        "id": 2,
        "tender_ref_no": "TC-2026-002",
        "vendor_name": "QuickFix Engineering Pte Ltd",
        "main_offer_price": "7200000.00",
        "eligibility_status": "flagged",
        "status": "under_evaluation"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 6 }
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Invalid filter value (e.g. unrecognized `status` enum) |
  | `401 Unauthorized` | Missing/invalid/expired JWT |

### `GET /api/tenders/:id`

- **Purpose:** Get full detail for a single tender, including declared/extracted eligibility fields (UC-A2).
- **Auth required:** Yes - any authenticated role
- **Success Response `200 OK`:** same shape as the `POST /api/tenders` response above.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `404 Not Found` | No tender with that `id` |

### `PATCH /api/tenders/:id`

- **Purpose:** Edit tender details before evaluation locks the record (UC-A3).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:** any subset of editable fields, e.g.
  ```json
  { "main_offer_price": 15250000.00 }
  ```
- **Success Response `200 OK`:** updated tender object (same shape as `GET /api/tenders/:id`).
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Invalid field value |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No tender with that `id` |
  | `409 Conflict` | Tender `status` is `under_evaluation`, `approved`, `rejected`, or `withdrawn` - edits are locked past that point |

### `DELETE /api/tenders/:id`

- **Purpose:** Withdraw/delete a tender submission (UC-A4).
- **Auth required:** Yes - role: `ma_staff`
- **Success Response `204 No Content`**
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No tender with that `id` |
  | `409 Conflict` | Tender `status` is `under_evaluation`, `approved`, or `rejected` - must be withdrawn via status change, not deleted |

---

## Tender Documents

### `POST /api/tenders/:id/documents`

- **Purpose:** Upload a new document for a tender, storing it in Cloudinary (UC-A1 step 2).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:** `multipart/form-data`
  | Field | Type | Notes |
  |---|---|---|
  | `file` | file | The document binary |
  | `file_type` | string | One of `main_offer`, `alternative_offer`, `license`, `other` |
- **Success Response `201 Created`:**
  ```json
  {
    "id": 14,
    "tender_id": 7,
    "file_type": "main_offer",
    "original_filename": "coastal-works-main-offer.pdf",
    "cloudinary_public_id": "town-council-tender/tc-2026-007/main-offer",
    "file_url": "https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-007/main-offer.pdf",
    "resource_type": "raw",
    "format": "pdf",
    "file_size_bytes": 2011234,
    "version": 1,
    "is_latest": true,
    "uploaded_by": 1,
    "uploaded_at": "2026-07-01T09:05:00.000Z"
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | No file attached, unsupported file type, or file exceeds size limit |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No tender with that `id` |
  | `502 Bad Gateway` | Cloudinary upload failed |

### `GET /api/tenders/:id/documents`

- **Purpose:** List all documents for a tender, including superseded versions (UC-A2, UC-A5).
- **Auth required:** Yes - any authenticated role
- **Query Parameters:** `latest_only=true` (optional) - returns only `is_latest: true` rows.
- **Success Response `200 OK`:**
  ```json
  {
    "data": [
      { "id": 9, "file_type": "main_offer", "version": 1, "is_latest": false, "file_url": "https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/main-offer-v1.pdf" },
      { "id": 10, "file_type": "main_offer", "version": 2, "is_latest": true, "file_url": "https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/main-offer-v2.pdf" }
    ]
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `404 Not Found` | No tender with that `id` |

### `PUT /api/tenders/:id/documents/:documentId`

- **Purpose:** Upload a corrected replacement for an existing document, preserving version history (UC-A5).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:** `multipart/form-data`, same shape as the upload endpoint (`file` required; `file_type` inherited from the document being replaced).
- **Success Response `201 Created`:** new `tender_documents` row with `version` incremented and `is_latest: true`; the prior row's `is_latest` is flipped to `false` in the same transaction.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | No file attached, or file exceeds size limit |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No tender or document with that `id` |
  | `502 Bad Gateway` | Cloudinary upload failed - prior version remains `is_latest: true` |

---

## Eligibility

### `POST /api/tenders/:id/eligibility-check`

- **Purpose:** Trigger (or re-trigger) AI eligibility parsing and deterministic scoring for a tender (UC-A6). Called automatically when a tender is submitted; exposed here for manual re-runs (e.g. after a document replacement).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:** none
- **Success Response `200 OK`:**
  ```json
  {
    "tender_id": 6,
    "eligibility_status": "flagged",
    "ai_eligibility_summary": "No BCA FM01 license number could be found in the submitted documents.",
    "checks_created": 3
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No tender with that `id` |
  | `409 Conflict` | Tender has no documents uploaded yet |
  | `502 Bad Gateway` | ChatGPT API request failed or returned an unparseable result |

### `GET /api/tenders/:id/eligibility-checks`

- **Purpose:** View the full eligibility breakdown for a tender (UC-A8).
- **Auth required:** Yes - any authenticated role
- **Success Response `200 OK`:**
  ```json
  {
    "data": [
      { "id": 5, "criterion": "min_paid_up_capital", "threshold_value_used": "2000000.00", "actual_value": "1200000.00", "passed": false, "source": "ai_extracted", "notes": "Declared paid-up capital below the S$2M minimum requirement." },
      { "id": 7, "criterion": "bca_fm01_tender_limit", "threshold_value_used": "6000000.00", "actual_value": "7200000.00", "passed": false, "source": "ai_extracted", "notes": "Main offer price exceeds BCA FM01 Grade L2 tender value ceiling." }
    ]
  }
  ```
  Returns `"data": []` (not an error) when the tender is still `draft`/`pending` with no checks run yet.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `404 Not Found` | No tender with that `id` |

### `PATCH /api/eligibility-checks/:id`

- **Purpose:** Manually confirm or override a single eligibility check (UC-A7) - primarily used for the non-debarment criterion, which requires human verification against the debarment list.
- **Auth required:** Yes - roles: `ma_staff`, `evaluator`
- **Request Body:**
  ```json
  {
    "passed": false,
    "notes": "Vendor found on debarment list during manual verification."
  }
  ```
- **Success Response `200 OK`:** updated check row with `source: "manual_override"`, `checked_by` set to the caller's user id, and `checked_at` updated. The parent tender's `eligibility_status` is recomputed from the full check set.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `notes` is missing or empty - a manual override always requires a documented reason |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `evaluator` |
  | `404 Not Found` | No eligibility check with that `id` |

---

## Eligibility Reference Data

### `GET /api/config/bca-grade-limits`

- **Purpose:** List the current BCA FM01 grade-to-tender-value ceilings (UC-A9).
- **Auth required:** Yes - any authenticated role
- **Success Response `200 OK`:**
  ```json
  {
    "data": [
      { "grade": "L1", "max_tender_value": "1500000.00" },
      { "grade": "L6", "max_tender_value": null }
    ]
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |

### `PUT /api/config/bca-grade-limits/:grade`

- **Purpose:** Update the tender-value ceiling for a BCA grade (UC-A9).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:**
  ```json
  { "max_tender_value": 90000000.00, "effective_from": "2026-08-01" }
  ```
- **Success Response `200 OK`:** updated `bca_grade_limits` row. Does not retroactively change `threshold_value_used` on existing `eligibility_checks` rows.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Invalid grade or negative value |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | Grade does not exist in `bca_grade_limits` |

### `GET /api/config/eligibility-thresholds`

- **Purpose:** List configurable non-BCA eligibility thresholds (UC-A10).
- **Auth required:** Yes - any authenticated role
- **Success Response `200 OK`:**
  ```json
  {
    "data": [
      { "criterion_key": "min_paid_up_capital", "threshold_value": "2000000.00", "description": "Minimum paid-up capital required for tender eligibility (project-requirements.md)." }
    ]
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |

### `PUT /api/config/eligibility-thresholds/:criterionKey`

- **Purpose:** Update a configurable eligibility threshold (UC-A10).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:**
  ```json
  { "threshold_value": 2500000.00 }
  ```
- **Success Response `200 OK`:** updated `eligibility_thresholds` row, with `updated_by` set to the caller's user id.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `threshold_value` missing or not a positive number |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No threshold with that `criterion_key` |

---

## Shared Dev Auth Setup (for local testing only)

> **Security note:** this value is for local development convenience only, shared among the 5 team members so everyone's local backend can verify each other's test tokens. It must **not** be reused as the `JWT_SECRET` on the deployed Render backend in `deployment.md` - that must be a separate, randomly generated production secret that is never committed to the repo. `.env` files stay gitignored as usual; this value is recorded here only because it is a shared team fixture, not a per-deployment production credential.

Add to your local `backend/.env`:
```
DEV_JWT_SECRET=dev-secret-tender-app
```

The backend's local dev auth middleware should verify incoming tokens with `jwt.verify(token, process.env.DEV_JWT_SECRET)`.

### Pre-Signed Test Tokens (HS256, signed with `DEV_JWT_SECRET` above)

Each token is valid for 90 days from issuance and decodes to the payload shown beside it. Use whichever matches the role you need to test as `Authorization: Bearer <token>`.

**`ma_staff`** - payload:
```json
{ "sub": 1, "full_name": "Zheng Hong", "email": "zheng.hong@townms.gov.sg", "role": "ma_staff", "iat": 1783929817, "exp": 1791705817 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImZ1bGxfbmFtZSI6IlpoZW5nIEhvbmciLCJlbWFpbCI6InpoZW5nLmhvbmdAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJtYV9zdGFmZiIsImlhdCI6MTc4MzkyOTgxNywiZXhwIjoxNzkxNzA1ODE3fQ.YBg_9V2fjx3GapbC2PjhmtQqCtI-1sHJh4KCNnC9U_Q
```

**`evaluator`** - payload:
```json
{ "sub": 2, "full_name": "Jerrold", "email": "jerrold@townms.gov.sg", "role": "evaluator", "iat": 1783929817, "exp": 1791705817 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImZ1bGxfbmFtZSI6IkplcnJvbGQiLCJlbWFpbCI6ImplcnJvbGRAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJldmFsdWF0b3IiLCJpYXQiOjE3ODM5Mjk4MTcsImV4cCI6MTc5MTcwNTgxN30.BwN27J6WqzjoswKRovQ07MsQR-SQsE1dUuuqe9_wsoA
```

**`report_preparer`** - payload:
```json
{ "sub": 4, "full_name": "Calista", "email": "calista@townms.gov.sg", "role": "report_preparer", "iat": 1783929817, "exp": 1791705817 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImZ1bGxfbmFtZSI6IkNhbGlzdGEiLCJlbWFpbCI6ImNhbGlzdGFAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJyZXBvcnRfcHJlcGFyZXIiLCJpYXQiOjE3ODM5Mjk4MTcsImV4cCI6MTc5MTcwNTgxN30.GhDIwFVAPVlDqH97Oz4TDCZcfhTFEVzOAdjzv946nqw
```

**`vendor_liaison`** - payload:
```json
{ "sub": 5, "full_name": "Sulaiman", "email": "sulaiman@townms.gov.sg", "role": "vendor_liaison", "iat": 1783929817, "exp": 1791705817 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImZ1bGxfbmFtZSI6IlN1bGFpbWFuIiwiZW1haWwiOiJzdWxhaW1hbkB0b3dubXMuZ292LnNnIiwicm9sZSI6InZlbmRvcl9saWFpc29uIiwiaWF0IjoxNzgzOTI5ODE3LCJleHAiOjE3OTE3MDU4MTd9.EmkfqpQWAfbUXYBuAQepKs2UL6MP04iaRgPzbOg1Z1E
```

**`management`** - payload:
```json
{ "sub": 3, "full_name": "Kai Xuan", "email": "kai.xuan@townms.gov.sg", "role": "management", "iat": 1783929817, "exp": 1791705817 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImZ1bGxfbmFtZSI6IkthaSBYdWFuIiwiZW1haWwiOiJrYWkueHVhbkB0b3dubXMuZ292LnNnIiwicm9sZSI6Im1hbmFnZW1lbnQiLCJpYXQiOjE3ODM5Mjk4MTcsImV4cCI6MTc5MTcwNTgxN30.08jo6QJuSH87ssX_64Z0JJn1DTZzD1l3DJjeH6ZaJa8
```

These match the canonical set in `design/test-tokens.md` (signed by the real `jsonwebtoken`-based auth middleware, via `jwt.sign(payload, process.env.DEV_JWT_SECRET, { algorithm: 'HS256', expiresIn: '90d' })`) - regenerate the same way if the seeded users ever change.
