# API Documentation - Jerrold (Scope B: Evaluation, Processing & Risk Framework)

> Note on scope: this document covers the endpoints for my scope - Evaluation Criteria, manual per-criterion PQM scoring, the Risk Assessment & Mitigation Matrix, and the Approval Process - per `design/jerrold/use-cases.md` and `design/jerrold/database-schema.md`. There is no "Order Management" feature or "farm staff / host / buyer" roles in this project (that looks like boilerplate from a different template); roles below use this project's actual `users.role` values seeded in `backend/src/seeders/20260101000001-demo-users.js`: `ma_staff`, `evaluator`, `management`.

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
- **Note:** editing a criterion never rewrites the `weight_percentage_snapshot`/`pqm_score` on past `evaluations` rows scored under the old weight - those keep their original values via `evaluation_criterion_scores`'s snapshot columns (UC-B2 edge case).

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

## Manual Criterion Scoring / PQM Evaluations

> **Corrected:** this section previously described an AI-document-extraction scoring
> flow (`document_ids` -> `ai_extracted_inputs` -> `PATCH .../confirm-inputs`). Per
> lecturer feedback, that flow never had a real ChatGPT integration behind it (the
> stub always returned nulls) and has been fully replaced with manual per-criterion
> staff scoring - see `design/jerrold/use-cases.md` UC-B4/UC-B5 and
> `design/jerrold/database-schema.md`'s `evaluation_criterion_scores` table.

### 5. `POST /api/tenders/:tenderId/evaluations`

- **Purpose:** Create an evaluation from an existing tender (UC-B4). Creates a new `evaluations` row with `status: 'processing'` and one unscored `evaluation_criterion_scores` row per active criterion.
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:** none.
- **Example success response** - `201 Created`:
  ```json
  { "id": 6, "tender_id": 5, "status": "processing", "evaluated_by": 2, "created_at": "2026-07-10T09:30:00.000Z" }
  ```
- **Error responses:**
  - `404 Not Found` - no tender with that id.
  - `409 Conflict` - tender's `eligibility_status` is `'rejected'` (UC-B4 edge case). Body: `{ "error": "tender_ineligible", "eligibility_status": "rejected" }`.
  - `409 Conflict` - active `evaluation_criteria` don't sum to exactly 100%. Body: `{ "active_weight_total": 85 }`.
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

- **Purpose:** View the full PQM score breakdown for one evaluation attempt (UC-B6): the tender it's for, and every criterion's snapshotted name/category/weight alongside its staff score, weighted contribution, and remarks.
- **Auth required:** Yes - any authenticated role.
- **Example success response** - `200 OK`:
  ```json
  {
    "id": 4,
    "tender_id": 5,
    "tender_ref_no": "TC-2026-005",
    "vendor_name": "MegaWorks Holdings Pte Ltd",
    "price_score": "48.00",
    "quality_score": "36.00",
    "pqm_score": "84.00",
    "status": "scored",
    "criterion_scores": [
      { "id": 7, "evaluation_criteria_id": 1, "criteria_name": "Price Competitiveness", "category": "price", "weight_percentage": "60.00", "staff_score": "80.00", "weighted_score": "48.00", "remarks": "Competitive pricing" },
      { "id": 8, "evaluation_criteria_id": 2, "criteria_name": "Technical Quality & Track Record", "category": "quality", "weight_percentage": "40.00", "staff_score": "90.00", "weighted_score": "36.00", "remarks": "Strong track record" }
    ],
    "evaluated_by": 2,
    "evaluation_date": "2026-07-08"
  }
  ```
- **Error responses:**
  - `404 Not Found`.
  - `401 Unauthorized`.
- **Note:** while `status: 'processing'`, `criterion_scores[].staff_score`/`weighted_score` are `null` until the evaluator saves a draft for that criterion; `price_score`/`quality_score`/`pqm_score` stay `null` until the evaluation is submitted (endpoint #8a).

### 8. `PATCH /api/evaluations/:id/scores`

- **Purpose:** Save or update draft criterion scores (UC-B5 step 1). Can be called any number of times while the evaluation is still `status: 'processing'`; partial submissions are allowed.
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:**
  ```json
  { "scores": [ { "evaluation_criteria_id": 1, "staff_score": 80, "remarks": "Competitive pricing" } ] }
  ```
  `staff_score` must be between 0 and 100; `remarks` is optional.
- **Example success response** - `200 OK`: the full evaluation detail shape from endpoint #7, reflecting the updated draft.
- **Error responses:**
  - `404 Not Found` - no evaluation with that id.
  - `400 Bad Request` - `staff_score` out of range, or an `evaluation_criteria_id` that isn't part of this evaluation.
  - `409 Conflict` - evaluation `status` is not `'processing'` (already scored, approved, or rejected - only a fresh re-evaluation attempt (#9) can be rescored).
  - `401 Unauthorized` / `403 Forbidden`.

### 8a. `POST /api/evaluations/:id/submit`

- **Purpose:** Evaluator submits the evaluation once every active criterion has a staff score, triggering the backend-calculated weighted PQM total (UC-B5 steps 2-4). The frontend never submits a `pqm_score` directly - it is always derived here from `staff_score / 100 * weight_percentage_snapshot` per criterion.
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:** none.
- **Example success response** - `200 OK`:
  ```json
  { "id": 4, "status": "scored", "price_score": "48.00", "quality_score": "36.00", "pqm_score": "84.00", "evaluation_date": "2026-07-08" }
  ```
- **Error responses:**
  - `404 Not Found` - no evaluation with that id, or it isn't `status: 'processing'`.
  - `422 Unprocessable Entity` - one or more criteria are still unscored; response lists `missing_criteria` instead of computing a partial total (UC-B5 edge case):
    ```json
    { "id": 6, "status": "processing", "missing_criteria": [{ "evaluation_criteria_id": 2, "criteria_name": "Technical Quality & Track Record" }] }
    ```
  - `401 Unauthorized` / `403 Forbidden`.

### 9. `POST /api/evaluations/:id/reprocess`

- **Purpose:** Re-evaluate a rejected tender - e.g. a resolved pricing-deviation clarification from Sulaiman's Scope D (UC-B11). Creates a **new** `evaluations` row (not a mutation of the rejected one), with a fresh set of unscored `evaluation_criterion_scores` snapshotted from the currently active criteria.
- **Auth required:** Yes - `role: 'evaluator'`.
- **Request body:** none.
- **Example success response** - `201 Created`:
  ```json
  { "id": 9, "tender_id": 5, "status": "processing", "evaluated_by": 2, "created_at": "2026-07-06T09:00:00.000Z" }
  ```
- **Error responses:**
  - `404 Not Found`.
  - `409 Conflict` - source evaluation's `status` is not `'rejected'` (only a rejected evaluation can be reprocessed), or active criteria don't sum to 100% (same check as endpoint #5).
  - `401 Unauthorized` / `403 Forbidden`.

### 9a. `GET /api/evaluations`

- **Purpose:** List every evaluation that has been through backend PQM calculation at least once, for the cross-tender comparison table (UC-B6).
- **Auth required:** Yes - any authenticated role.
- **Query params:** `tender_id` (optional) - restrict the comparison to one tender's attempts.
- **Example success response** - `200 OK`:
  ```json
  {
    "data": [
      { "id": 4, "tender_id": 5, "tender_ref_no": "TC-2026-005", "vendor_name": "MegaWorks Holdings Pte Ltd", "status": "approved", "price_score": "48.00", "quality_score": "36.00", "pqm_score": "84.00", "evaluation_date": "2026-07-08" }
    ]
  }
  ```
  Only evaluations with `status` in `'scored'`, `'approved'`, or `'rejected'` are included - a still-`'processing'` draft never appears here.
- **Error responses:**
  - `401 Unauthorized`.

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
  - `502 Bad Gateway` - ChatGPT API call failed/timed out; no `risk_assessments` rows are created, so a retry doesn't leave a half-written matrix behind (UC-B7 edge case).
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

All endpoints above expect `Authorization: Bearer <JWT>`, verified server-side by the real `authenticate` middleware (`backend/src/middlewares/auth.js`), which calls `jsonwebtoken.verify(token, process.env.JWT_SECRET || process.env.DEV_JWT_SECRET)`. So that everyone's locally-issued test tokens validate against everyone else's local backend, the whole team should add the same secret to their `.env`:

```
DEV_JWT_SECRET=dev-secret-tender-app
```

> **Corrected:** this previously read `dev-secret-sccci-tender-2026`, which didn't match the value already established in `design/zheng-hong/api-documentation.md` and `design/sulaiman/api-documentation.md` (`dev-secret-tender-app`) - tokens signed against the old value here would not have verified against theirs. Now that the real auth middleware exists (`backend/src/services/authService.js`), this doc defers entirely to `design/test-tokens.md` as the single source of truth for the secret and pre-signed tokens, rather than keeping a second, driftable copy here.

**This is a local-development-only value.** Do not reuse it for any deployed (staging/prod) environment, and do not commit real user credentials or a production secret to this repo.

JWT payload shape (matches `users` table columns and `backend/src/services/authService.js#signToken`):

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

Pre-signed `ma_staff`, `evaluator`, and `management` test tokens (and `report_preparer`/`vendor_liaison`, for scopes that need them) are in **`design/test-tokens.md`** - generated by the real `authService.signToken`, so they are guaranteed to verify against the actual middleware. Use those instead of hand-rolling new ones here.
