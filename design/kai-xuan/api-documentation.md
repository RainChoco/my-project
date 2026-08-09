# API Documentation - Kai Xuan (Scope E: Dashboard, Strategic Rankings, Contract Opportunity CRUD)

Covers only the endpoints this scope owns, matching `design/kai-xuan/use-cases.md` and `design/kai-xuan/database-schema.md`. Grounded directly in `backend/src/routes/contractRoutes.js`, `backend/src/routes/dashboardRoutes.js`, `backend/src/controllers/ContractController.js`, `backend/src/controllers/dashboardController.js`, `backend/src/services/ContractService.js`, `backend/src/services/dashboardService.js`, and their Yup validators. All responses are JSON. All routes are mounted under `/api` (`backend/src/index.js`: `app.use('/api', routes)`).

**Mount points** (`backend/src/routes/index.js`):
- Contract CRUD is mounted **only** under `/api/v1/contracts` (there is no flat `/api/contracts`).
- Dashboard is mounted **twice**, at `/api/dashboard` (flat, kept for backward compatibility) and `/api/v1/dashboard` - both point at the exact same router/controller, so behavior (including auth) is identical on either path. Examples below use the `/api/dashboard` form.

> **Auth reality check (important):** as of the most recent change, `contractRoutes.js` requires `authenticate` on every route below, and `authenticate` + `authorise('ma_staff')` on the three mutating routes. This was a real, recent change - an earlier version of this file had no auth middleware at all. `dashboardRoutes.js` was **not** given the same treatment: `GET /kpis` and `GET /rankings` currently have **no auth middleware whatsoever** (open to unauthenticated callers), and `POST /archive` has `authenticate` only, with **no role restriction**. This is documented as-is below (not the intended end state) so the docs reflect what the code actually enforces today - see the Auth Gap Note in `use-cases.md`.

---

## Contract Opportunity CRUD

### `GET /api/v1/contracts`

- **Purpose:** List all non-deleted contract opportunities (UC-E2). Filtering/searching is done client-side by the frontend over this full list - there are no server-side query parameters.
- **Auth required:** Yes - any authenticated role.
- **Request:** none.
- **Success Response `200 OK`:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "CTR-3F2A9B10",
        "name": "Zone A Cleaning Services 2026",
        "category": "Cleaning",
        "description": "Routine cleaning services for residential blocks in Zone A.",
        "budgetLimit": "500000.00",
        "openingDate": "2026-07-01T00:00:00.000Z",
        "closingDate": "2026-08-15T00:00:00.000Z",
        "status": "Open",
        "isDeleted": false,
        "contractRefNo": "PRPGTC/RR/22/001",
        "townCouncilName": "Pasir Ris-Punggol Town Council",
        "createdAt": "2026-06-20T09:00:00.000Z",
        "updatedAt": "2026-06-20T09:00:00.000Z"
      }
    ]
  }
  ```
  (Response includes every field on the `Contract` model - see `database-schema.md`; abbreviated here.)
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `500 Internal Server Error` | Unexpected error (`ContractController.getAll`'s catch-all returns the raw `error.message`) |

### `GET /api/v1/contracts/:id`

- **Purpose:** Get full detail for one contract opportunity, including its submitted tenders and each tender's latest evaluation summary (UC-E3).
- **Auth required:** Yes - any authenticated role.
- **Path params:** `id` (string, required - validated by `contractIdParamsSchema`).
- **Success Response `200 OK`:**
  ```json
  {
    "status": "success",
    "data": {
      "id": "CTR-3F2A9B10",
      "name": "Zone A Cleaning Services 2026",
      "category": "Cleaning",
      "budgetLimit": "500000.00",
      "openingDate": "2026-07-01T00:00:00.000Z",
      "closingDate": "2026-08-15T00:00:00.000Z",
      "status": "Open",
      "tenders": [
        {
          "id": 12,
          "tender_ref_no": "TC-2026-012",
          "vendor_name": "CleanTech Pte Ltd",
          "submission_date": "2026-07-10",
          "status": "under_evaluation",
          "eligibility_status": "eligible",
          "contractId": "CTR-3F2A9B10",
          "evaluations": [
            { "id": 6, "pqm_score": "84.00", "price_score": "48.00", "quality_score": "36.00", "status": "scored" }
          ]
        }
      ]
    }
  }
  ```
  `tenders[].evaluations` is limited to the single most recent evaluation attempt per tender (`ContractRepository.findById`'s `include`, `limit: 1`, `order: [['created_at', 'DESC']]`) and is `[]` for a tender that has never been evaluated.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `id` param fails `contractIdParamsSchema` (in practice unreachable via a normal route match, since `id` is always present in the URL) |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `404 Not Found` | No contract with that `id`, or it has `isDeleted: true` (soft-deleted contracts read as not-found) |
  | `404 Not Found` (mislabeled) | **Any** other unexpected error also surfaces as `404` here - `ContractController.getById`'s catch block unconditionally responds `res.status(404)` regardless of the actual failure, so a genuine `500`-class error (e.g. a DB outage) would be misreported to the client as "not found" |

### `GET /api/v1/contracts/:contractId/tenders`

- **Purpose:** List every tender submitted against a contract opportunity, each with its latest evaluation summary (UC-E3). Mounted in `contractRoutes.js` but implemented by `tenderController.getTendersByContract` (a cross-scope helper shared with Zheng Hong's tender model).
- **Auth required:** Yes - any authenticated role.
- **Path params:** `contractId` (string, required).
- **Success Response `200 OK`:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 12,
        "tender_ref_no": "TC-2026-012",
        "vendor_name": "CleanTech Pte Ltd",
        "contractId": "CTR-3F2A9B10",
        "status": "under_evaluation",
        "evaluations": [
          { "id": 6, "pqm_score": "84.00", "price_score": "48.00", "quality_score": "36.00", "status": "scored" }
        ]
      }
    ]
  }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `404 Not Found` | No contract with that `contractId` |
  | `500 Internal Server Error` | Unexpected error (message masked: `"Internal Server Error"`) |

### `POST /api/v1/contracts`

- **Purpose:** Create a new contract opportunity (UC-E1).
- **Auth required:** Yes - role: `ma_staff`.
- **Request Body** (only `name`, `category`, `budgetLimit`, `openingDate`, `closingDate` are required; everything else - including all ~20 contract-terms fields below - is optional):
  ```json
  {
    "name": "Zone A Cleaning Services 2026",
    "contractRefNo": "PRPGTC/RR/22/001",
    "townCouncilName": "Pasir Ris-Punggol Town Council",
    "category": "Cleaning",
    "estateZoneScope": "Division A/B, HDB Blocks 101-156",
    "description": "Routine cleaning services for residential blocks in Zone A.",
    "budgetLimit": 500000.00,
    "openingDate": "2026-07-01",
    "closingDate": "2026-08-15",
    "status": "Draft",
    "contractStartDate": "2026-09-01",
    "contractEndDate": "2029-08-31",
    "contractDurationMonths": 36,
    "defectsLiabilityPeriodMonths": 12,
    "optionToExtend": true,
    "extensionTerms": "+1 Year",
    "terminationNoticePeriodDays": 14,
    "awardedContractSum": null,
    "monthlyManagementFeeRate": 4500.00,
    "paymentMilestones": "20% mobilization, 60% progressive, 20% on completion",
    "liquidatedDamagesRate": 100.00,
    "performanceGuaranteePercent": 5,
    "wicaInsuranceCap": 500000.00,
    "publicLiabilityInsuranceMin": 1000000.00,
    "publicLiabilityInsuranceMax": 2000000.00,
    "minBizsafeLevel": "Level 2",
    "securityDepositAmount": 25000.00,
    "bankGuaranteeTerms": "5% of contract sum, valid till end of DLP",
    "governingLawFramework": "Singapore Town Councils Act & PSSCOC"
  }
  ```
- **Success Response `201 Created`:** the created contract object (same shape as `GET /:id`, minus `tenders`), with a server-generated `id` in the form `CTR-XXXXXXXX`.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Missing `name`/`category`/`budgetLimit`/`openingDate`/`closingDate`; `budgetLimit` not a positive number; any numeric contract-terms field not a positive number where required; `publicLiabilityInsuranceMax < publicLiabilityInsuranceMin`; `contractEndDate <= contractStartDate`; `performanceGuaranteePercent` outside `0-100`; `status`/`category`/`minBizsafeLevel` not one of the allowed enum values (all via `createContractSchema`, `ValidationError` shape with a full `errors[]` list) |
  | `400 Bad Request` | `openingDate >= closingDate` (re-checked server-side in `ContractService.createContract`, independent of the schema-level check) |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Authenticated role is not `ma_staff` |

### `PUT /api/v1/contracts/:id`

- **Purpose:** Edit an existing contract opportunity (UC-E4). Every body field is optional - only supplied fields are validated/updated.
- **Auth required:** Yes - role: `ma_staff`.
- **Request Body:** any subset of the create-body fields, e.g.
  ```json
  { "status": "Awarded", "awardedContractSum": 480000.00 }
  ```
- **Success Response `200 OK`:** updated contract object (same shape as `GET /:id`).
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Any field fails `updateContractSchema` (same per-field rules as create, but all optional) |
  | `400 Bad Request` | Both `openingDate` and `closingDate` supplied with `openingDate >= closingDate` |
  | `400 Bad Request` (not `404`) | No contract with that `id`, or it is soft-deleted - `ContractService.updateContract` throws `Error('Contract not found')`, and `ContractController.update`'s catch-all maps **every** thrown error (validation failures, business-rule failures, and not-found alike) to `400`. There is no `404` path on this endpoint. |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |

### `DELETE /api/v1/contracts/:id`

- **Purpose:** Soft-delete a contract opportunity (UC-E5) - sets `isDeleted: true`; the row and its tender/evaluation history are retained.
- **Auth required:** Yes - role: `ma_staff`.
- **Request Body:** none.
- **Success Response `200 OK`:**
  ```json
  { "status": "success", "message": "Contract deleted successfully" }
  ```
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `id` param fails `contractIdParamsSchema` |
  | `400 Bad Request` (not `404`) | No contract with that `id`, or already soft-deleted - same quirk as `PUT /:id`: `ContractService.deleteContract` throws `Error('Contract not found')`, caught and returned as `400` by `ContractController.delete`. |
  | `401 Unauthorized` | Missing/invalid/expired JWT |
  | `403 Forbidden` | Role is not `ma_staff` |
  | *(no `409`)* | Unlike some other scopes' delete endpoints, this one does **not** block deletion based on the contract's `status` or whether it has tenders/evaluations attached - deletion is always allowed for an existing, non-deleted contract. |

---

## Dashboard - KPIs & Strategic Rankings

### `GET /api/dashboard/kpis`

- **Purpose:** Aggregated KPI metrics for the dashboard header cards, scoped to one contract opportunity (UC-E6).
- **Auth required:** **No auth middleware is applied to this route at all** (`dashboardRoutes.js`: `router.get('/kpis', dashboardController.getKPIs)`) - any caller, authenticated or not, can reach it. This is a real gap relative to the intent (evaluator/staff/management only), not a documented design choice - see the Auth Gap Note in `use-cases.md`.
- **Query Parameters:**
  | Param | Type | Notes |
  |---|---|---|
  | `contractId` | string | Scopes all KPIs to one contract opportunity. If omitted, KPIs are computed across **all** tenders in the system (`evaluationRepository.getAllRankings()`). |
  | `status` | string | Passed through to the tender lookup for `totalTenders`/`recentSubmissions`; not applied to the PQM/risk figures. |
  | `category` | string | Same as `status`. |
  | `dateFrom`, `dateTo` | date | Same as `status`. |

  Note: a `getKPIsSchema` Yup schema exists in `backend/src/validators/dashboardValidator.js` but is **not** wired into this route (no `validate(...)` middleware) - query params are read directly off `req.query` with no validation or type coercion.
- **Success Response `200 OK`:**
  ```json
  {
    "status": "success",
    "data": {
      "totalTenders": 6,
      "averagePQM": 82.5,
      "highRiskTenders": 1,
      "recentSubmissions": 2
    }
  }
  ```
  `averagePQM` is `null` when `totalTenders > 0` but none of them have been evaluated yet (never `0` in that case, to distinguish "no data" from "a real zero score").
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `500 Internal Server Error` | Any unexpected error - message is masked to `"Internal Server Error"`; the real error is only logged server-side via `console.error` (`dashboardController.getKPIs`) |

### `GET /api/dashboard/rankings`

- **Purpose:** Paginated, filtered, sorted list of tenders ranked by PQM score for a contract opportunity (UC-E7).
- **Auth required:** **No auth middleware applied** - same gap as `GET /kpis`. `validate(getRankingsSchema)` **is** applied, so query shape/whitelisting is still enforced even without authentication.
- **Query Parameters:**
  | Param | Type | Notes |
  |---|---|---|
  | `contractId` | string | Scopes rankings to one contract; omit for all tenders system-wide. |
  | `status`, `category` | string | Exact-match filters on the ranking row. |
  | `riskLevel` | string | Case-insensitive match against `'high'`/`'medium'`/`'low'`. |
  | `supplierSearch` | string | Case-insensitive substring match against supplier name or tender ref no. |
  | `pqmMin`, `pqmMax` | number | Inclusive PQM score bounds; rows with `pqmScore: null` are excluded once either bound is set. |
  | `dateFrom`, `dateTo` | date | Date-range filter. |
  | `page` | integer | Default `1`, min `1`. |
  | `pageSize` | integer | Default `10`, min `1`, **max `100`** (hard server-side cap regardless of what's requested). |
  | `sortBy` | string | One of `pqmScore`, `priceScore`, `qualityScore`, `supplierName`, `rank` (whitelisted - anything else is rejected). Default `pqmScore`. |
  | `sortOrder` | string | `asc` or `desc`. Default `desc`. |
- **Success Response `200 OK`:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "tenderId": 12,
        "tenderRefNo": "TC-2026-012",
        "supplierName": "CleanTech Pte Ltd",
        "category": "Cleaning",
        "status": "under_evaluation",
        "pqmScore": 84.0,
        "priceScore": 48.0,
        "qualityScore": 36.0,
        "riskLevel": "medium",
        "rank": 1
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalRecords": 6,
      "totalPages": 1
    }
  }
  ```
  Tenders with no evaluation yet appear with `pqmScore: null`, `riskLevel: null`, and are sorted to the end of the default ranking.
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | `sortBy` not one of the whitelisted values, `sortOrder` not `asc`/`desc`, `pageSize` > 100 or < 1, `page` < 1, or `dateFrom`/`dateTo` not a valid date (`ValidationError` from `getRankingsSchema`) |
  | `500 Internal Server Error` | Any unexpected error - masked to `"Internal Server Error"` |

### `POST /api/dashboard/archive`

- **Purpose:** Archive an immutable snapshot of a contract's final PQM rankings (UC-E9). The backend always recomputes the snapshot server-side from current evaluation data - the client never submits ranking data directly.
- **Auth required:** Yes - `authenticate` only. **No `authorise(...)` role check** - any authenticated user, regardless of role, can archive.
- **Request Body:**
  ```json
  {
    "contractId": "CTR-3F2A9B10",
    "archiveReason": "Final board approval received on 2026-08-10"
  }
  ```
  `contractId` is the current/preferred field name; the legacy field `tenderReferenceId` is still accepted as a fallback (`contractId || tenderReferenceId`) for backward compatibility with older callers. `archiveReason` is optional, max 255 characters. At least one of `contractId`/`tenderReferenceId` is required.
- **Success Response `201 Created`:**
  ```json
  {
    "status": "success",
    "message": "Scoring list archived successfully",
    "data": {
      "archiveId": "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
      "version": 2
    }
  }
  ```
  `version` increments per `contractId` each time it is archived again (there is no rejection on re-archiving - see below).
- **Error Responses:**
  | Status | Condition |
  |---|---|
  | `400 Bad Request` | Neither `contractId` nor `tenderReferenceId` supplied (`ValidationError` from `archiveSchema`, checked before the controller runs) |
  | `400 Bad Request` | `contractId`/`tenderReferenceId` resolves to a contract with zero evaluation ranking rows (e.g. no tenders, or none evaluated yet) - `dashboardService.archiveScoringList` throws `{ status: 400, message: 'No evaluation rankings found for this contract' }` |
  | `401 Unauthorized` | Missing/invalid/expired JWT (`authenticate` middleware); the controller also has its own `if (!userId) return 401` guard, which is effectively unreachable in practice since `authenticate` already rejects unauthenticated requests before `req.user` would be missing |
  | `500 Internal Server Error` | Any error without an explicit `.status` (e.g. a DB/transaction failure) - message is masked; only errors with `status < 500` (i.e. the `400`s above) have their real message passed through to the client |
  | *(no `409`)* | Re-archiving a contract that already has a prior archive is **allowed**, not rejected - a new `scoring_archives` row is inserted with `archive_version` incremented (unique constraint is on `(tender_reference_id, archive_version)`, not on `tender_reference_id` alone). An earlier draft of this scope's docs described a `409 Conflict` on re-archive; that is not what the implemented service does. |
