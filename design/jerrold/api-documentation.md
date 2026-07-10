# API Documentation - Jerrold (Scope B: Evaluation, Processing & Risk Framework)

> Note on scope: this document covers the endpoints for my scope - Evaluation Criteria, Processing Tender Form / PQM scoring, the Risk Assessment & Mitigation Matrix, and the Approval Process - per `design/jerrold/use-cases.md` and `design/jerrold/database-schema.md`. There is no "Order Management" feature or "farm staff / host / buyer" roles in this project (that looks like boilerplate from a different template); roles below use this project's actual `users.role` values seeded in `backend/src/seeders/20260101000001-demo-users.js`: `ma_staff`, `evaluator`, `management`.

Base path: `/api`. All request/response bodies are JSON. All endpoints require `Authorization: Bearer <JWT>` unless marked "Auth required: No".

---

## Evaluation Criteria

### 1. `GET /api/evaluation-criteria`

- **Purpose:** List evaluation criteria and their weights (UC-B3).
- **Auth required:** Yes - any authenticated role.
- **Query params:** `is_active` (optional, `true`/`false`) - filter to active or inactive criteria; omit to return all.
- **Example success response** - `200 OK`:
  ```json
  {
    "data": [
      { "id": 1, "criteria_name": "Price Competitiveness", "category": "price", "weight_percentage": "60.00", "is_active": true, "created_by": 1, "created_at": "2026-06-01T09:00:00.000Z", "updated_at": "2026-06-01T09:00:00.000Z" },
      { "id": 2, "criteria_name": "Technical Quality & Track Record", "category": "quality", "weight_percentage": "40.00", "is_active": true, "created_by": 1, "created_at": "2026-06-01T09:00:00.000Z", "updated_at": "2026-06-01T09:00:00.000Z" }
    ],
    "active_weight_total": 100.00
  }
  ```
- **Error responses:**
  - `401 Unauthorized` - missing/invalid JWT.

### 2. `POST /api/evaluation-criteria`

- **Purpose:** Define a new evaluation criterion (UC-B1).
- **Auth required:** Yes - `role: 'ma_staff'` only.
- **Request body:**
  ```json
  { "criteria_name": "Sustainability Practices", "category": "quality", "weight_percentage": 10.00 }
  ```
- **Example success response** - `201 Created`:
  ```json
  { "id": 5, "criteria_name": "Sustainability Practices", "category": "quality", "weight_percentage": "10.00", "is_active": true, "created_by": 1, "created_at": "2026-07-10T09:00:00.000Z", "updated_at": "2026-07-10T09:00:00.000Z" }
  ```
- **Error responses:**
  - `400 Bad Request` - missing field, `weight_percentage` outside `(0, 100]`, or invalid `category`.
  - `409 Conflict` - adding this weight would push the sum of all `is_active: true` criteria over 100% (UC-B1 edge case). Body includes `current_active_total` so the client can show the gap.
  - `401 Unauthorized` / `403 Forbidden` - not authenticated / not `ma_staff`.

### 3. `PUT /api/evaluation-criteria/:id`

- **Purpose:** Edit a criterion's name or weight (UC-B2).
- **Auth required:** Yes - `role: 'ma_staff'` only.
- **Request body:**
  ```json
  { "weight_percentage": 55.00 }
  ```
- **Example success response** - `200 OK`:
  ```json
  { "id": 1, "criteria_name": "Price Competitiveness", "category": "price", "weight_percentage": "55.00", "is_active": true, "created_by": 1, "created_at": "2026-06-01T09:00:00.000Z", "updated_at": "2026-07-10T09:15:00.000Z" }
  ```
- **Error responses:**
  - `404 Not Found` - no criterion with that `id`.
  - `409 Conflict` - resulting active weight sum != 100%.
  - `401 Unauthorized` / `403 Forbidden`.
- **Note:** editing a criterion never rewrites `ai_extracted_inputs`/`pqm_score` on past `evaluations` rows scored under the old weight - those keep their original values (UC-B2 edge case).

### 4. `DELETE /api/evaluation-criteria/:id`

- **Purpose:** Deactivate a criterion (UC-B2). This is a soft delete - it sets `is_active: false`, it does not remove the row, since past evaluations reference the weight that was in effect.
- **Auth required:** Yes - `role: 'ma_staff'` only.
- **Request body:** none.
- **Example success response** - `200 OK`:
  ```json
  { "id": 3, "is_active": false, "updated_at": "2026-07-10T09:20:00.000Z" }
  ```
- **Error responses:**
  - `404 Not Found`.
  - `401 Unauthorized` / `403 Forbidden`.

---

## Processing Tender Form / PQM Evaluations

### 5. `POST /api/tenders/:tenderId/evaluations`

- **Purpose:** Open the Processing Tender Form and kick off AI extraction of price/quality inputs for a tender (UC-B4). Creates a new `evaluations` row with `status: 'processing'`.
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:**
  ```json
  { "document_ids": [9, 10, 11, 12] }
  ```
  `document_ids` are the `tender_documents.id` values (Zheng Hong's Scope A) Gemini should read - typically the latest main offer, alternative offer, and license.
- **Example success response** - `202 Accepted` (AI extraction is async):
  ```json
  { "id": 6, "tender_id": 5, "status": "processing", "evaluated_by": 2, "created_at": "2026-07-10T09:30:00.000Z" }
  ```
- **Error responses:**
  - `404 Not Found` - no tender with that id.
  - `409 Conflict` - tender's `eligibility_status` is `'rejected'`; the Processing Tender Form is blocked entirely for a debarred/rejected tender (UC-B4 edge case). Body: `{ "error": "tender_ineligible", "eligibility_status": "rejected" }`.
  - `502 Bad Gateway` - Gemini API call failed/timed out; no `evaluations` row is created.
  - `401 Unauthorized` / `403 Forbidden`.

### 6. `GET /api/tenders/:tenderId/evaluations`

- **Purpose:** List every evaluation attempt for a tender, oldest first - surfaces re-evaluation history (UC-B11) since a tender can have more than one `evaluations` row.
- **Auth required:** Yes - any authenticated role.
- **Example success response** - `200 OK`:
  ```json
  {
    "data": [
      { "id": 3, "status": "rejected", "pqm_score": "88.00", "evaluation_date": "2026-06-08", "created_at": "2026-06-04T09:00:00.000Z" },
      { "id": 4, "status": "scored", "pqm_score": "90.00", "evaluation_date": "2026-07-08", "created_at": "2026-07-06T09:00:00.000Z" }
    ]
  }
  ```
- **Error responses:**
  - `404 Not Found` - no tender with that id.
  - `401 Unauthorized`.

### 7. `GET /api/evaluations/:id`

- **Purpose:** View the full PQM score breakdown for one evaluation attempt (UC-B6): scores, weights used, and raw AI extraction.
- **Auth required:** Yes - any authenticated role.
- **Example success response** - `200 OK`:
  ```json
  {
    "id": 4,
    "tender_id": 5,
    "price_score": "52.00",
    "quality_score": "38.00",
    "pqm_score": "90.00",
    "status": "scored",
    "ai_extracted_inputs": { "main_offer_price": 92000000, "alternative_offer_price": 88000000, "price_deviation_flagged": false, "technical_proposal_score_raw": 95 },
    "criteria_used": [
      { "criteria_name": "Price Competitiveness", "category": "price", "weight_percentage": "60.00" },
      { "criteria_name": "Technical Quality & Track Record", "category": "quality", "weight_percentage": "40.00" }
    ],
    "evaluated_by": 2,
    "evaluation_date": "2026-07-08"
  }
  ```
- **Error responses:**
  - `404 Not Found`.
  - `401 Unauthorized`.
- **Note:** when `status: 'incomplete'`, the response includes a `missing_fields` array (from `ai_extracted_inputs`) instead of a `pqm_score` of `0`, so the UI can distinguish "not enough data to score" from "genuinely scored low" (UC-B6 edge case).

### 8. `PATCH /api/evaluations/:id/confirm-inputs`

- **Purpose:** Evaluator reviews/corrects the AI-extracted inputs and confirms them, which triggers deterministic PQM computation (UC-B4 step 5 -> UC-B5). The score is calculated in the backend, not by the LLM.
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:**
  ```json
  { "ai_extracted_inputs": { "main_offer_price": 92000000, "alternative_offer_price": 88000000, "technical_proposal_score_raw": 95 } }
  ```
- **Example success response** - `200 OK`:
  ```json
  { "id": 4, "status": "scored", "price_score": "52.00", "quality_score": "38.00", "pqm_score": "90.00", "evaluation_date": "2026-07-08" }
  ```
- **Error responses:**
  - `404 Not Found` - no evaluation with that id, or it isn't `status: 'processing'`.
  - `422 Unprocessable Entity` - a required input for the active criteria set is still missing after confirmation; response sets `status: 'incomplete'` instead of computing a partial score, and lists `missing_fields` (UC-B5 edge case):
    ```json
    { "id": 6, "status": "incomplete", "missing_fields": ["technical_proposal_score_raw"] }
    ```
  - `401 Unauthorized` / `403 Forbidden`.

### 9. `POST /api/evaluations/:id/reprocess`

- **Purpose:** Re-evaluate a rejected tender after new information becomes available - e.g. a resolved pricing-deviation clarification from Sulaiman's Scope D (UC-B11). Creates a **new** `evaluations` row rather than mutating the rejected one.
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:**
  ```json
  { "document_ids": [9, 10, 11, 12] }
  ```
- **Example success response** - `201 Created`:
  ```json
  { "id": 4, "tender_id": 5, "status": "processing", "evaluated_by": 2, "created_at": "2026-07-06T09:00:00.000Z" }
  ```
- **Error responses:**
  - `404 Not Found`.
  - `409 Conflict` - source evaluation's `status` is not `'rejected'` (only a rejected evaluation can be reprocessed).
  - `401 Unauthorized` / `403 Forbidden`.

---

## Risk Assessment & Mitigation Matrix

### 10. `POST /api/evaluations/:id/risk-assessments/generate`

- **Purpose:** Generate the AI-drafted Risk Assessment & Mitigation Matrix for a scored evaluation (UC-B7).
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:** none.
- **Example success response** - `201 Created`:
  ```json
  {
    "data": [
      { "id": 6, "evaluation_id": 4, "risk_description": "Vendor's BCA FM01 Grade L6 status removes the tender-value ceiling check...", "risk_level": "high", "ai_generated": true, "review_status": "pending_review" }
    ]
  }
  ```
- **Error responses:**
  - `404 Not Found` - no evaluation with that id.
  - `409 Conflict` - evaluation `status` is not `'scored'` yet (risk matrix requires a completed PQM score).
  - `502 Bad Gateway` - Gemini API call failed/timed out; no `risk_assessments` rows are created, so a retry doesn't leave a half-written matrix behind (UC-B7 edge case).
  - `401 Unauthorized` / `403 Forbidden`.

### 11. `GET /api/evaluations/:id/risk-assessments`

- **Purpose:** View the risk matrix for an evaluation, including review status of each item.
- **Auth required:** Yes - any authenticated role.
- **Example success response** - `200 OK`:
  ```json
  {
    "data": [
      { "id": 4, "risk_description": "AI flagged the S$4M gap between Main and Alternative Offer as a possible under-costed alternative scope.", "mitigation_plan": null, "risk_level": "high", "ai_generated": true, "review_status": "rejected", "reviewed_by": 2 },
      { "id": 5, "risk_description": "Vendor subcontracts specialised M&E works to a third party not yet vetted by the MA.", "mitigation_plan": "Request subcontractor vetting documents prior to contract award.", "risk_level": "medium", "ai_generated": true, "review_status": "reviewed", "reviewed_by": 2 }
    ]
  }
  ```
- **Error responses:**
  - `404 Not Found` - no evaluation with that id (returns `{ "data": [] }` with `200 OK` if the evaluation exists but has no risk items yet, e.g. `status: 'incomplete'`).
  - `401 Unauthorized`.

### 12. `PATCH /api/risk-assessments/:id/review`

- **Purpose:** Reviewer accepts, edits, or rejects an AI-drafted risk item (UC-B8).
- **Auth required:** Yes - `role: 'evaluator'` or `'management'`.
- **Request body:**
  ```json
  { "review_status": "reviewed", "risk_description": "Vendor's on-site team...", "mitigation_plan": "Require a named backup staffing list with 2 reserve technicians." }
  ```
  `review_status` is one of `'reviewed'` / `'rejected'`; description/plan edits are optional. `mitigation_plan` may be omitted/`null` when `review_status: 'rejected'` - rejecting an AI-drafted item means dismissing the framing, not supplying a fix for it.
- **Example success response** - `200 OK`:
  ```json
  { "id": 6, "review_status": "reviewed", "reviewed_by": 2, "mitigation_plan": "Require a named backup staffing list with 2 reserve technicians.", "updated_at": "2026-07-10T10:00:00.000Z" }
  ```
- **Error responses:**
  - `404 Not Found`.
  - `400 Bad Request` - `review_status` is not `'reviewed'`/`'rejected'` (can't set a risk item back to `'pending_review'` through this endpoint).
  - `401 Unauthorized` / `403 Forbidden`.

---

## Approval Process

### 13. `POST /api/evaluations/:id/approvals`

- **Purpose:** Manager (C-suite) logs an approve/reject decision against an evaluation (UC-B9).
- **Auth required:** Yes - `role: 'management'` only.
- **Request body:**
  ```json
  { "decision": "approved", "remarks": "Breakdown received and reviewed. PQM score and risk mitigations are acceptable." }
  ```
- **Example success response** - `201 Created`:
  ```json
  { "id": 2, "evaluation_id": 1, "approver_id": 3, "decision": "approved", "remarks": "Breakdown received and reviewed. PQM score and risk mitigations are acceptable.", "decided_at": "2026-07-10T10:15:00.000Z" }
  ```
  On success, `evaluations.status` is also updated to `'approved'` or `'rejected'`.
- **Error responses:**
  - `404 Not Found` - no evaluation with that id.
  - `400 Bad Request` - `decision: 'rejected'` submitted with no `remarks` - a rejection must always carry a reason (UC-B9 edge case).
  - `409 Conflict` - evaluation is not `status: 'scored'`, or it has `risk_assessments` rows still at `review_status: 'pending_review'` - approval is blocked until the risk matrix is fully human-reviewed (UC-B8/UC-B9 precondition).
  - `401 Unauthorized` / `403 Forbidden` - not authenticated / not `management` (only C-suite roles may log a decision).

### 14. `GET /api/evaluations/:id/approvals`

- **Purpose:** View the approval decision audit trail for an evaluation (UC-B10) - an evaluation may have more than one row if a Manager revisits an earlier decision; the most recent row is the current one.
- **Auth required:** Yes - any authenticated role.
- **Example success response** - `200 OK`:
  ```json
  {
    "data": [
      { "id": 1, "approver_id": 3, "decision": "rejected", "remarks": "Please provide the underlying technical scoring breakdown...", "decided_at": "2026-06-21T14:00:00.000Z" },
      { "id": 2, "approver_id": 3, "decision": "approved", "remarks": "Breakdown received and reviewed...", "decided_at": "2026-06-25T16:30:00.000Z" }
    ]
  }
  ```
  Returns `{ "data": [] }` with `200 OK` (not a `404`) if the evaluation exists but hasn't been decided yet - the UI shows "Awaiting approval" rather than treating an empty history as an error (UC-B10 edge case).
- **Error responses:**
  - `404 Not Found` - no evaluation with that id.
  - `401 Unauthorized`.

---

## Shared Dev Auth Setup

All endpoints above expect `Authorization: Bearer <JWT>`, verified server-side with `jsonwebtoken.verify(token, process.env.JWT_SECRET)`. So that everyone's locally-issued test tokens validate against everyone else's local backend, the whole team should add the same secret to their `.env`:

```
DEV_JWT_SECRET=dev-secret-sccci-tender-2026
```

**This is a local-development-only value.** Do not reuse it for any deployed (staging/prod) environment, and do not commit real user credentials or a production secret to this repo.

JWT payload shape (matches `users` table columns from `backend/src/seeders/20260101000001-demo-users.js`):

```json
{
  "sub": <users.id>,
  "full_name": "<users.full_name>",
  "email": "<users.email>",
  "role": "<users.role>",
  "iat": <issued-at, unix seconds>,
  "exp": <expiry, unix seconds>
}
```

Signed with `HS256` against `DEV_JWT_SECRET` above. Each token below is valid for 90 days from issue (`iat` corresponds to 2026-07-09T09:00:00Z, `exp` to roughly 2026-10-07) - dev-only, so a long expiry avoids re-minting tokens mid-sprint.

### `ma_staff` - Alice Tan (`users.id: 1`)

Payload:
```json
{ "sub": 1, "full_name": "Alice Tan", "email": "alice.tan@townms.gov.sg", "role": "ma_staff", "iat": 1783759200, "exp": 1791535200 }
```

Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImZ1bGxfbmFtZSI6IkFsaWNlIFRhbiIsImVtYWlsIjoiYWxpY2UudGFuQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoibWFfc3RhZmYiLCJpYXQiOjE3ODM3NTkyMDAsImV4cCI6MTc5MTUzNTIwMH0.fvBPBkccb8WRirmlUcSyKd-_9Qjz3VlApurN0Cx2RYQ
```

### `evaluator` - Ben Ong (`users.id: 2`)

Payload:
```json
{ "sub": 2, "full_name": "Ben Ong", "email": "ben.ong@townms.gov.sg", "role": "evaluator", "iat": 1783759200, "exp": 1791535200 }
```

Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImZ1bGxfbmFtZSI6IkJlbiBPbmciLCJlbWFpbCI6ImJlbi5vbmdAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJldmFsdWF0b3IiLCJpYXQiOjE3ODM3NTkyMDAsImV4cCI6MTc5MTUzNTIwMH0.EnxXZvVizgHBryq5JvjJIyh-hydXihBlPxYdvLryKcY
```

### `management` - Cheryl Lim (`users.id: 3`)

Payload:
```json
{ "sub": 3, "full_name": "Cheryl Lim", "email": "cheryl.lim@townms.gov.sg", "role": "management", "iat": 1783759200, "exp": 1791535200 }
```

Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImZ1bGxfbmFtZSI6IkNoZXJ5bCBMaW0iLCJlbWFpbCI6ImNoZXJ5bC5saW1AdG93bm1zLmdvdi5zZyIsInJvbGUiOiJtYW5hZ2VtZW50IiwiaWF0IjoxNzgzNzU5MjAwLCJleHAiOjE3OTE1MzUyMDB9.nKFlKRGtOjI8AECT0jRPKdHn-UGulcpYXWdWg3zCSRs
```

These were generated with plain Node `crypto` (HMAC-SHA256) against the secret above - anyone can regenerate/verify them locally without needing `jsonwebtoken` installed yet:

```js
const crypto = require('crypto');
const b64url = (s) => Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const verify = (token, secret) => {
  const [h, p, s] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return expected === s;
};
```
