# API Documentation - Sulaiman (Scope D: Alternate Proposal Communication System)

Covers only the endpoints this scope owns, matching the use cases (UC-D1 to UC-D9) and database schema All routes are mounted under `/api`. All responses are JSON. All endpoints require a valid JWT (`Authorization: Bearer <token>`) unless stated otherwise - there are no public/unauthenticated endpoints in this scope.

---

## Pricing Deviation Detection

### `POST /api/tenders/:tenderId/clarification-logs/detect-deviation`

- **Purpose:** Trigger (or re-trigger) AI pricing-deviation detection between a tender's main and alternative offer (UC-D1). Called automatically once Scope B's PQM scoring completes; exposed here for manual re-runs (e.g. after a price revision).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:** none
- **Success Response `201 Created`** (deviation exceeds tolerance):
  ```json
  {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
    "id": 12,
    "tender_id": 7,
    "log_type": "pricing_deviation",
    "status": "flagged",
    "main_offer_price_snapshot": "15000000.00",
    "alternative_offer_price_snapshot": "14200000.00",
    "deviation_amount": "800000.00",
    "deviation_percentage": "5.33",
    "ai_rationale": "Alternative offer is 5.33% below the main offer, exceeding the 3% tolerance threshold.",
    "follow_up_due_at": null,
    "created_at": "2026-07-10T09:00:00.000Z",
    "updated_at": "2026-07-10T09:00:00.000Z"
  }
  ```
- **Success Response `200 OK`** (deviation within tolerance): same shape with `"status": "no_action_required"` (recorded for audit, does not appear in the action queue).
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No tender with that `id` |
  | `409 Conflict` | Tender has no `alternative_offer_price` submitted - nothing to compare against, so no log is created |
  | `409 Conflict` | An active (`flagged`/`draft_ready`/`approved`/`sent`/`responded`/`escalated`) `pricing_deviation` log already exists for this tender |
  | `502 Bad Gateway` | ChatGPT API request failed or returned an unparseable result |

---

## Clarification Logs

### `GET /api/clarification-logs`

- **Purpose:** List/filter clarification and notification logs across tenders (UC-D6).
- **Auth required:** Yes - any authenticated role
- **Query Parameters:**
  | Param | Type | Notes |
  |---|---|---|
  | `tender_id` | integer | Filter by tender |
  | `log_type` | string | `pricing_deviation` or `job_adjustment_notification` |
  | `status` | string | `flagged`, `no_action_required`, `draft_ready`, `approved`, `sent`, `responded`, `escalated`, `resolved` |
  | `overdue` | boolean | `true` returns only `status: 'sent'` logs past `follow_up_due_at` (UC-D8 dashboard) |
  | `page`, `limit` | integer | Pagination, defaults `page=1`, `limit=20` |
- **Success Response `200 OK`:**
  ```json
  {
    "data": [
      {
        "id": 12,
        "tender_id": 7,
        "tender_ref_no": "TC-2026-007",
        "vendor_name": "Coastal Works Pte Ltd",
        "log_type": "pricing_deviation",
        "status": "sent",
        "deviation_percentage": "5.33",
        "follow_up_due_at": "2026-07-15",
        "updated_at": "2026-07-10T09:30:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 4 }
  }
  ```
  Returns `"data": []` (not an error) when no logs match the filter.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Invalid filter value (e.g. unrecognized `status` enum) |
  | `401 Unauthorized` | Missing/invalid/expired JWT |

### `GET /api/clarification-logs/:id`

- **Purpose:** View a single log's full thread - source figures, every draft/sent/reminder/vendor-response message, and any linked job adjustment request (UC-D3, UC-D6).
- **Auth required:** Yes - any authenticated role
- **Success Response `200 OK`:**
  ```json
  {
    "id": 12,
    "tender_id": 7,
    "log_type": "pricing_deviation",
    "status": "sent",
    "main_offer_price_snapshot": "15000000.00",
    "alternative_offer_price_snapshot": "14200000.00",
    "deviation_amount": "800000.00",
    "deviation_percentage": "5.33",
    "ai_rationale": "Alternative offer is 5.33% below the main offer, exceeding the 3% tolerance threshold.",
    "follow_up_due_at": "2026-07-15",
    "escalated_by": null,
    "escalated_at": null,
    "responded_at": null,
    "response_notes": null,
    "outcome_notes": null,
    "resolved_by": null,
    "resolved_at": null,
    "messages": [
      {
        "id": 30,
        "message_type": "draft",
        "subject": "Clarification Request - TC-2026-007 Pricing Deviation",
        "body": "Dear Coastal Works Pte Ltd, ...",
        "ai_generated": true,
        "approved_by": 5,
        "approved_at": "2026-07-10T09:20:00.000Z",
        "sent_at": null,
        "dispatch_channel": null,
        "source_draft_id": null,
        "created_by": 5,
        "created_at": "2026-07-10T09:10:00.000Z"
      },
      {
        "id": 31,
        "message_type": "sent",
        "subject": "Clarification Request - TC-2026-007 Pricing Deviation",
        "body": "Dear Coastal Works Pte Ltd, ...",
        "ai_generated": false,
        "approved_by": null,
        "approved_at": null,
        "sent_at": "2026-07-10T09:30:00.000Z",
        "dispatch_channel": "email",
        "source_draft_id": 30,
        "created_by": 5,
        "created_at": "2026-07-10T09:30:00.000Z"
      }
    ],
    "job_adjustment_requests": []
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `404 Not Found` | No clarification log with that `id` |

---

## Draft, Review & Dispatch (UC-D2, UC-D3, UC-D4)

### `POST /api/clarification-logs/:id/draft-message`

- **Purpose:** Generate an AI-drafted clarification message for a flagged log (UC-D2).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:** none
- **Success Response `201 Created`:** new `clarification_messages` row (`message_type: "draft"`, `ai_generated: true`); parent log's `status` moves to `draft_ready`.
  ```json
  {
    "id": 30,
    "clarification_log_id": 12,
    "message_type": "draft",
    "subject": "Clarification Request - TC-2026-007 Pricing Deviation",
    "body": "Dear Coastal Works Pte Ltd, we note that your alternative offer of S$14,200,000.00 is 5.33% below your main offer of S$15,000,000.00. Kindly confirm or justify this deviation within 5 business days.",
    "ai_generated": true,
    "approved_by": null,
    "approved_at": null,
    "sent_at": null,
    "dispatch_channel": null,
    "source_draft_id": null,
    "created_by": 5,
    "created_at": "2026-07-10T09:10:00.000Z"
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No clarification log with that `id` |
  | `409 Conflict` | Log `status` is not `flagged` |
  | `502 Bad Gateway` | ChatGPT API request failed or timed out - log remains at `status: 'flagged'` so staff can retry or write the message manually |

### `PATCH /api/clarification-messages/:messageId`

- **Purpose:** Edit a draft's subject/body before approval - correct tone, figures, or add context (UC-D3).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:**
  ```json
  {
    "subject": "Clarification Request - TC-2026-007 Pricing Deviation (Revised)",
    "body": "Dear Coastal Works Pte Ltd, we note that your alternative offer is S$800,000.00 (5.33%) below your main offer..."
  }
  ```
- **Success Response `200 OK`:** updated `clarification_messages` row (same shape as the draft-message response above).
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `body` is empty |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No message with that `id` |
  | `409 Conflict` | `message_type` is not `draft` (only drafts are editable) |

### `POST /api/clarification-messages/:messageId/approve`

- **Purpose:** Approve a draft message for dispatch (UC-D3).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:** none
- **Success Response `200 OK`:** updated `clarification_messages` row with `approved_by`/`approved_at` set; parent log's `status` moves to `approved`.
  ```json
  {
    "id": 30,
    "clarification_log_id": 12,
    "message_type": "draft",
    "approved_by": 5,
    "approved_at": "2026-07-10T09:20:00.000Z"
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No message with that `id` |
  | `409 Conflict` | `message_type` is not `draft`, or parent log `status` is not `draft_ready` |

### `POST /api/clarification-logs/:id/send`

- **Purpose:** Dispatch the approved message to the vendor's registered contact (UC-D4).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:**
  ```json
  { "dispatch_channel": "email" }
  ```
  `dispatch_channel` is `email` (system-sent) or `manual` (staff sent it outside the system and is logging the dispatch).
- **Success Response `200 OK`:** new `clarification_messages` row (`message_type: "sent"`, `source_draft_id` pointing back to the approved draft); parent log's `status` moves to `sent` with `sent_at` set (same shape as the `sent` message in the `GET /api/clarification-logs/:id` example above).
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `dispatch_channel` missing or not one of `email`/`manual` |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No clarification log with that `id` |
  | `409 Conflict` | Log `status` is not `approved` |
  | `409 Conflict` | Vendor has no contact information on file - staff must add vendor contact details before dispatch can proceed |

---

## Vendor Responses & Attachments (UC-D5)

### `POST /api/clarification-logs/:id/responses`

- **Purpose:** Record a vendor's reply to a sent clarification (confirmation, revised offer, or justification) (UC-D5).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:**
  ```json
  {
    "subject": "RE: Clarification Request - TC-2026-007",
    "body": "We confirm the alternative offer reflects a bulk-material discount secured after tender close.",
    "response_notes": "Vendor confirms deviation is a bulk-discount, no revised price submitted."
  }
  ```
- **Success Response `201 Created`:** new `clarification_messages` row (`message_type: "vendor_response"`); parent log's `status` moves to `responded`, `responded_at` and `response_notes` set.
  ```json
  {
    "id": 32,
    "clarification_log_id": 12,
    "message_type": "vendor_response",
    "subject": "RE: Clarification Request - TC-2026-007",
    "body": "We confirm the alternative offer reflects a bulk-material discount secured after tender close.",
    "ai_generated": false,
    "sent_at": null,
    "dispatch_channel": null,
    "source_draft_id": null,
    "created_by": 5,
    "created_at": "2026-07-11T14:00:00.000Z"
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `body` or `response_notes` missing |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No clarification log with that `id` |
  | `409 Conflict` | Log `status` is not `sent` |

### `POST /api/clarification-messages/:messageId/attachments`

- **Purpose:** Attach a supporting document (e.g. a revised quotation letter) to a logged vendor response, stored in Cloudinary (UC-D5).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:** `multipart/form-data`
  | Field | Type | Notes |
  |---|---|---|
  | `file` | file | The document binary |
- **Success Response `201 Created`:**
  ```json
  {
    "id": 8,
    "clarification_message_id": 32,
    "original_filename": "coastal-works-revised-quote.pdf",
    "cloudinary_public_id": "town-council-tender/tc-2026-007/clarifications/revised-quote",
    "file_url": "https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-007/clarifications/revised-quote.pdf",
    "resource_type": "raw",
    "format": "pdf",
    "file_size_bytes": 842011,
    "uploaded_at": "2026-07-11T14:05:00.000Z"
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | No file attached |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No message with that `id` |
  | `409 Conflict` | `message_type` is not `vendor_response` |
  | `502 Bad Gateway` | Cloudinary upload failed |

---

## Job Adjustment Requests (UC-D7)

### `POST /api/clarification-logs/:id/job-adjustment-requests`

- **Purpose:** Log a scope/timeline/terms change implied by a vendor's response (UC-D7).
- **Auth required:** Yes - role: `vendor_liaison`
- **Request Body:**
  ```json
  {
    "source_message_id": 32,
    "description": "Extend completion date by 3 weeks to accommodate the alternative material's longer lead time.",
    "justification": "Vendor's revised quote is contingent on a supplier delivery window that falls outside the current contract schedule.",
    "is_material": true
  }
  ```
- **Success Response `201 Created`:**
  ```json
  {
    "id": 4,
    "clarification_log_id": 12,
    "source_message_id": 32,
    "tender_id": 7,
    "description": "Extend completion date by 3 weeks to accommodate the alternative material's longer lead time.",
    "justification": "Vendor's revised quote is contingent on a supplier delivery window that falls outside the current contract schedule.",
    "is_material": true,
    "approval_status": "pending_approval",
    "follow_up_clarification_log_id": null,
    "requested_by": 5,
    "approved_by": null,
    "approved_at": null,
    "created_at": "2026-07-11T15:00:00.000Z",
    "updated_at": "2026-07-11T15:00:00.000Z"
  }
  ```
  `is_material: false` requests may be created directly at `approval_status: "approved"` by the application.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `description` or `justification` missing |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `vendor_liaison` |
  | `404 Not Found` | No clarification log with that `id`, or `source_message_id` does not belong to it |
  | `409 Conflict` | Parent log `status` is not `responded` |

### `GET /api/job-adjustment-requests`

- **Purpose:** List/filter job adjustment requests (UC-D7).
- **Auth required:** Yes - any authenticated role
- **Query Parameters:**
  | Param | Type | Notes |
  |---|---|---|
  | `tender_id` | integer | Filter by tender |
  | `approval_status` | string | `pending_approval`, `approved`, `rejected` |
  | `is_material` | boolean | Filter to material (evaluation-affecting) requests only |
- **Success Response `200 OK`:**
  ```json
  {
    "data": [
      { "id": 4, "tender_id": 7, "description": "Extend completion date by 3 weeks...", "is_material": true, "approval_status": "pending_approval" }
    ]
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |

### `PATCH /api/job-adjustment-requests/:id`

- **Purpose:** Approve or reject a job adjustment request (UC-D7). Material requests must be routed through the same approval roles as a tender edit mid-evaluation (Scope A's UC-A3 restriction).
- **Auth required:** Yes - role: `ma_staff`
- **Request Body:**
  ```json
  { "approval_status": "approved" }
  ```
- **Success Response `200 OK`:** updated request with `approved_by`/`approved_at` set when `approval_status` is `approved`.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `approval_status` missing or not one of `approved`/`rejected` |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | `404 Not Found` | No job adjustment request with that `id` |
  | `409 Conflict` | Request is already `approved` or `rejected` |

### `POST /api/job-adjustment-requests/:id/follow-up-notification`

- **Purpose:** Create the follow-up notification log confirming the adjustment terms back to the vendor, reusing the review-before-send gate (UC-D3, UC-D4 via UC-D7).
- **Auth required:** Yes - role: `vendor_liaison`
- **Request Body:** none
- **Success Response `201 Created`:** new `clarification_logs` row (`log_type: "job_adjustment_notification"`, `status: "draft_ready"`), with `follow_up_clarification_log_id` set on the originating job adjustment request. Draft it via `POST /api/clarification-logs/:id/draft-message`, then approve and send it via the same endpoints used for pricing-deviation logs.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `vendor_liaison` |
  | `404 Not Found` | No job adjustment request with that `id` |
  | `409 Conflict` | Request `approval_status` is not `approved`, or a follow-up notification already exists for this request |

---

## Resend, Escalate & Resolve (UC-D8, UC-D9)

### `POST /api/clarification-logs/:id/resend`

- **Purpose:** Send a follow-up reminder for an overdue `sent` log without overwriting the original message (UC-D8).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:** none
- **Success Response `201 Created`:** new `clarification_messages` row (`message_type: "reminder"`); parent log's `sent_at` and `follow_up_due_at` are reset from the reminder's dispatch time.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No clarification log with that `id` |
  | `409 Conflict` | Log `status` is not `sent` |

### `POST /api/clarification-logs/:id/escalate`

- **Purpose:** Escalate an unanswered log to MA procurement staff when the tender's evaluation deadline is imminent (UC-D8).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:** none
- **Success Response `200 OK`:** updated log with `status: "escalated"`, `escalated_by`/`escalated_at` set.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No clarification log with that `id` |
  | `409 Conflict` | Log `status` is not `sent` |

### `POST /api/clarification-logs/:id/resolve`

- **Purpose:** Close a clarification log once the vendor response (and any resulting adjustment) has been reviewed (UC-D9).
- **Auth required:** Yes - roles: `ma_staff`, `vendor_liaison`
- **Request Body:**
  ```json
  { "outcome_notes": "Deviation justified as a bulk-material discount; no price change accepted." }
  ```
- **Success Response `200 OK`:** updated log with `status: "resolved"`, `resolved_by`/`resolved_at` set, and locked from further edits.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `outcome_notes` missing or empty - a resolution must always carry a documented outcome |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` or `vendor_liaison` |
  | `404 Not Found` | No clarification log with that `id` |
  | `409 Conflict` | Log `status` is not `responded` or `escalated` |

---

## Shared Dev Auth Setup (for local testing only)

> **Security note:** this value is for local development convenience only, shared among the team so everyone's local backend can verify each other's test tokens. It must **not** be reused as the `JWT_SECRET` on the deployed Render backend in `deployment.md` - that must be a separate, randomly generated production secret that is never committed to the repo. `.env` files stay gitignored as usual; this value is recorded here only because it is a shared team fixture, not a per-deployment production credential. This is the same secret already established in `design/zheng-hong/api-documentation.md` - do not generate a second one, or tokens signed against it won't verify across everyone's local backend.

Add to your local `backend/.env`:
```
DEV_JWT_SECRET=dev-secret-tender-app
```

The backend's local dev auth middleware should verify incoming tokens with `jwt.verify(token, process.env.DEV_JWT_SECRET)`.

### Pre-Signed Test Tokens (HS256, signed with `DEV_JWT_SECRET` above)

Each token is valid for 90 days from issuance and decodes to the payload shown beside it. Use whichever matches the role you need to test as `Authorization: Bearer <token>`. These reuse the exact same seeded users as `design/zheng-hong/api-documentation.md` (see `backend/src/seeders/20260101000001-demo-users.js` and `20260101000007-demo-users-vendor-liaison.js`) - same secret + same payload always produces the same signature, so the tokens are identical byte-for-byte.

**`ma_staff`** - payload:
```json
{ "sub": 1, "full_name": "Alice Tan", "email": "alice.tan@townms.gov.sg", "role": "ma_staff", "iat": 1781000000, "exp": 1788776000 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImZ1bGxfbmFtZSI6IkFsaWNlIFRhbiIsImVtYWlsIjoiYWxpY2UudGFuQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoibWFfc3RhZmYiLCJpYXQiOjE3ODEwMDAwMDAsImV4cCI6MTc4ODc3NjAwMH0.GLMqNPXMMU-EMr6bjFtzfwYV4qefmFeNAZ4YwSdHE5E
```

**`evaluator`** - payload:
```json
{ "sub": 2, "full_name": "Ben Ong", "email": "ben.ong@townms.gov.sg", "role": "evaluator", "iat": 1781000000, "exp": 1788776000 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImZ1bGxfbmFtZSI6IkJlbiBPbmciLCJlbWFpbCI6ImJlbi5vbmdAdG93bm1zLmdvdi5zZyIsInJvbGUiOiJldmFsdWF0b3IiLCJpYXQiOjE3ODEwMDAwMDAsImV4cCI6MTc4ODc3NjAwMH0.WQeEvEw8njqi859z-JBX8vSz1tM1_l8fiHkaTzoGLDk
```

**`vendor_liaison`** - payload:
```json
{ "sub": 5, "full_name": "Farid Rahman", "email": "farid.rahman@townms.gov.sg", "role": "vendor_liaison", "iat": 1781000000, "exp": 1788776000 }
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImZ1bGxfbmFtZSI6IkZhcmlkIFJhaG1hbiIsImVtYWlsIjoiZmFyaWQucmFobWFuQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoidmVuZG9yX2xpYWlzb24iLCJpYXQiOjE3ODEwMDAwMDAsImV4cCI6MTc4ODc3NjAwMH0.rzW0nW_viTylUb8prs3pR3Hwu9NdkHJcITR-5t0mwKQ
```

These were generated with a plain Node `crypto` HMAC-SHA256 script (no external libraries) against the exact payloads shown - anyone on the team can regenerate fresh ones locally the same way once the real `jsonwebtoken`-based auth middleware exists, by calling `jwt.sign(payload, process.env.DEV_JWT_SECRET, { algorithm: 'HS256' })`.
