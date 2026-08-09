# Use Cases - Kai Xuan (Scope E: Dashboard, Strategic Rankings, Contract Opportunity CRUD)

Covers every function this scope owns, grounded in the actual implementation: `backend/src/controllers/ContractController.js`, `backend/src/services/ContractService.js`, `backend/src/repositories/ContractRepository.js`, `backend/src/controllers/dashboardController.js`, `backend/src/services/dashboardService.js`, and the corresponding frontend pages under `frontend/src/features/contracts/` and `frontend/src/features/dashboard/`. Matches `design/kai-xuan/api-documentation.md` and `design/kai-xuan/database-schema.md`.

---

## UC-E1: Create Contract Opportunity

- **Actor:** MA Staff (`role: 'ma_staff'`)
- **Trigger:** User clicks "Create Contract" on the Contract Opportunities list (`ContractListPage.jsx`) and fills in the "New Contract" form (`ContractFormPage.jsx`).
- **Main Flow:**
  1. User fills in required fields - Contract Title (`name`), Service Type (`category`), Budget Limit (`budgetLimit`), Opening Date, Closing Date - plus any of the ~20 optional contract-terms fields (duration, extensions, payment milestones, insurance, security deposit, governing law, etc.).
  2. Frontend runs its own client-side checks (budget > 0, closing date after opening date, contract end date after contract start date, insurance max >= min, guarantee % between 0-100) before submitting.
  3. Frontend calls `POST /api/v1/contracts` with the form payload.
  4. Backend validates the body against `createContractSchema` (Yup), then `ContractService.createContract` re-checks `openingDate < closingDate` server-side.
  5. Backend generates a collision-free id in the form `CTR-XXXXXXXX` (8-char uppercase hex from a UUID) and inserts the row with `status` defaulting to `'Draft'` and `isDeleted: false`.
  6. On success, the frontend invalidates the `contracts` query cache, shows a success toast, and navigates back to `/contracts`.
- **Edge Case / Alternative Flow:**
  - **Opening date is not before closing date:** rejected with `400` both client-side (form error) and server-side (`ContractService.createContract` throws before the insert), so a stale/bypassed client check can't slip through.
  - **Caller is not `ma_staff`:** blocked with `403` by the `authorise('ma_staff')` middleware before the controller runs.
  - **Caller has no/expired JWT:** blocked with `401` by `authenticate` before `authorise` even runs.
  - **Required field missing or wrong type (e.g. `budgetLimit` not a positive number):** blocked with `400 ValidationError` by the `validate(createContractSchema)` middleware, which lists every failing field (`abortEarly: false`).

## UC-E2: List, Search & Filter Contract Opportunities

- **Actor:** Any authenticated role (evaluator, ma_staff, management, report_preparer, vendor_liaison)
- **Trigger:** User navigates to `/contracts` (`ContractListPage.jsx`).
- **Main Flow:**
  1. Frontend calls `GET /api/v1/contracts`, which returns every non-deleted contract (`isDeleted: false`), newest first.
  2. User types into the Search box or picks a Status/Category filter; `ContractListPage.jsx` filters the already-fetched list client-side (by `name`, `id`, `contractRefNo`, `townCouncilName` substring match, exact `status`, exact `category`) - there are no server-side query parameters for this endpoint.
  3. Table re-renders with the filtered subset and a "Clear filters" affordance appears once any filter is active.
- **Edge Case / Alternative Flow:**
  - **No contracts match the filters:** table body shows a "No contracts found" row instead of an empty table.
  - **Caller has no/expired JWT:** `401` from `authenticate` - the whole page fails to load.

## UC-E3: View Contract Opportunity Detail

- **Actor:** Any authenticated role
- **Trigger:** User clicks "View" on a contract row, or navigates to `/contracts/:id` (`ContractDetailPage.jsx`).
- **Main Flow:**
  1. Frontend calls `GET /api/v1/contracts/:id` for the contract's full field set, and `GET /api/v1/contracts/:id/tenders` for every tender submitted against it (each with its latest evaluation's `pqm_score`/`price_score`/`quality_score`/`status`, per `ContractRepository.findById`'s and `getTendersByContract`'s `include`).
  2. Page renders KPI summary cards (Budget Limit, Closing Date/days remaining, Supplier count, Evaluated count), the full contract-terms breakdown across four cards (Basic Info, Duration/Extensions/DLP, Commercial Terms, Insurance/Security/Legal), and a "Submitted Tenders" table with a per-tender workflow stepper (Draft -> Submitted -> Evaluating -> Ranked) and risk badge.
  3. If the closing date is within 7 days, an amber "closing soon" banner appears; if it has already passed and the contract isn't `Archived`, a separate warning banner appears.
- **Edge Case / Alternative Flow:**
  - **No contract with that id (or it was soft-deleted):** `GET /:id` returns `404`; the page shows a "Contract not found" state with a link back to `/contracts`.
  - **Contract has zero tenders yet:** the tenders table shows an empty state with a "Submit First Tender" call to action instead of an empty table.

## UC-E4: Edit Contract Opportunity

- **Actor:** MA Staff (`role: 'ma_staff'`)
- **Trigger:** User clicks "Edit Contract" from the detail page or "Edit" from the list, opening `ContractFormPage.jsx` pre-filled via `GET /api/v1/contracts/:id`.
- **Main Flow:**
  1. User changes one or more fields (any subset - all fields are optional on update).
  2. Same client-side checks as UC-E1 run before submit.
  3. Frontend calls `PUT /api/v1/contracts/:id` with the full form state.
  4. Backend validates against `updateContractSchema`, re-checks `openingDate < closingDate` if both are present in the payload, and applies the update.
  5. On success, the frontend invalidates the `contracts` cache and navigates back to `/contracts`.
- **Edge Case / Alternative Flow:**
  - **Contract id does not exist (including a soft-deleted one):** `ContractService.updateContract` throws a generic `Error('Contract not found')`, which `ContractController.update`'s catch-all maps to **`400`**, not `404` - this scope's update endpoint does not distinguish "not found" from "bad input" in its HTTP status, unlike the read endpoints.
  - **New opening/closing dates are inconsistent:** `400`.
  - **Caller is not `ma_staff` / not authenticated:** `403` / `401`.

## UC-E5: Delete (Soft-Delete) Contract Opportunity

- **Actor:** MA Staff (`role: 'ma_staff'`)
- **Trigger:** User clicks "Delete" on a contract row and confirms in the `ConfirmDeleteContractDialog`.
- **Main Flow:**
  1. Frontend calls `DELETE /api/v1/contracts/:id`.
  2. `ContractService.deleteContract` calls `ContractRepository.softDelete`, which sets `isDeleted: true` rather than removing the row - the contract (and its historical tender/evaluation links) remain in the database for audit purposes.
  3. On success, the contracts list cache is invalidated so the row disappears from `/contracts` (all reads filter `isDeleted: false`).
- **Edge Case / Alternative Flow:**
  - **Contract id does not exist (or was already soft-deleted):** same quirk as UC-E4 - the service throws `Error('Contract not found')` and `ContractController.delete`'s catch-all returns **`400`**, not `404`.
  - **Caller is not `ma_staff` / not authenticated:** `403` / `401`.
  - Deleting a contract does **not** cascade-delete or block based on its tenders - there is no `409`-style guard here (unlike, e.g., Zheng Hong's tender delete, which blocks on `status`).

## UC-E6: View Strategic KPI Dashboard for a Contract

- **Actor:** Evaluator / MA Staff / Management (any role reaches the page; see Auth Gap note below)
- **Trigger:** User navigates to `/dashboard` (`DashboardPage.jsx`) and selects a Contract Opportunity from the dropdown (populated via `GET /api/v1/contracts`).
- **Main Flow:**
  1. Once a contract is selected, the frontend calls `GET /api/dashboard/kpis?contractId=...` and `GET /api/dashboard/rankings?contractId=...`.
  2. `dashboardService.getKPIs` computes `totalTenders` (all tenders for the contract), `recentSubmissions` (submitted in the last 7 days), `averagePQM` (mean `pqmScore` across evaluated tenders only, `null` if none evaluated yet), and `highRiskTenders` (count with `riskLevel === 'high'`).
  3. Dashboard renders four KPI cards, a "Ranking Summary" section (Top Supplier / Highest Risk Supplier), four analytics charts (Trend, Category, Risk, Submission Status), an evaluation-progress bar, and a procurement stepper (Open -> Receiving Tenders -> Evaluating -> Ranking -> Archived).
  4. Contextual notification banners appear if the contract closes within 7 days, or if any supplier is still pending evaluation.
- **Edge Case / Alternative Flow:**
  - **No contract selected yet:** dashboard shows an `EmptyState` prompting the user to pick one; no API calls are made (`enabled: !!filters.contractId` on both queries).
  - **KPI/rankings fetch fails:** `ErrorState` is shown with a reload action; the backend masks the real error and returns a generic `500 Internal Server Error` for any unexpected failure in either endpoint (`console.error` logs the real cause server-side only).
  - **Contract has tenders but none evaluated yet:** `averagePQM` is `null` and the card shows "Pending Evaluation" instead of a score.

## UC-E7: Filter, Sort & Paginate Strategic Rankings

- **Actor:** Evaluator / MA Staff / Management
- **Trigger:** User interacts with the `FilterBar` (status, category, risk level, supplier search, PQM min/max, date range) or column headers (sort) on the Rankings table within a selected contract.
- **Main Flow:**
  1. `useDashboardFilters` tracks `status`, `category`, `riskLevel`, `supplierSearch`, `pqmMin`, `pqmMax`, `dateFrom`, `dateTo`, `page`, `pageSize`, `sortBy`, `sortOrder` in local state; any filter change resets `page` back to `1`.
  2. Frontend calls `GET /api/dashboard/rankings` with all of the above as query params.
  3. `dashboardService.getRankings` fetches every ranking row for the contract (including unevaluated tenders, which carry `pqmScore: null` / `riskLevel: null`), assigns an initial rank by `pqmScore` (nulls sorted last), applies each filter in sequence, re-sorts by the requested `sortBy`/`sortOrder`, then paginates.
  4. Table re-renders with the filtered/sorted/paginated page and the `Pagination` component reflects `page`/`pageSize`/`totalRecords`/`totalPages`.
- **Edge Case / Alternative Flow:**
  - **No rows match the filters:** `EmptyState` with a link to `/evaluations` is shown instead of an empty table.
  - **`sortBy` is not one of the whitelisted values (`pqmScore`, `priceScore`, `qualityScore`, `supplierName`, `rank`):** rejected with `400 ValidationError` by `validate(getRankingsSchema)` - arbitrary column names can't be injected.
  - **`pageSize` requested above 100:** rejected with `400 ValidationError` (`getRankingsSchema` caps `pageSize` at 100 server-side, regardless of what the UI sends).

## UC-E8: Export Rankings to CSV

- **Actor:** Evaluator / MA Staff / Management
- **Trigger:** User clicks "Export CSV" in the dashboard header while a contract is selected.
- **Main Flow:**
  1. `exportToCSV` (client-side only, no API call) builds a CSV from the **currently loaded page** of `rankingsData` - Rank, Tender ID, Supplier, Category, Status, PQM Score, Risk Level - and triggers a browser download named `rankings-<contractId>.csv`.
- **Edge Case / Alternative Flow:**
  - **No rankings loaded yet (`rankingsData` empty):** the Export button is disabled.
  - Because this only exports the current page/filter view, exporting "all" rankings requires setting `pageSize` high enough first - there is no dedicated export endpoint.

## UC-E9: Submit and Archive Final Scoring List

- **Actor:** Any authenticated role (see Auth Gap note - the endpoint does not currently restrict by role)
- **Trigger:** User clicks "Archive Final Rankings" on the dashboard for a selected contract and confirms in `ArchiveDialog`.
- **Main Flow:**
  1. User optionally enters a free-text archive reason.
  2. Frontend calls `POST /api/dashboard/archive` with `{ contractId, archiveReason }`.
  3. `dashboardService.archiveScoringList` re-fetches the full current ranking snapshot for the contract (`evaluationRepository.getRankingsForContract`), opens a transaction, locks and reads the previous `ScoringArchive` row for that `tender_reference_id` (which stores the `contractId`) with `FOR UPDATE`, computes `nextVersion = previousVersion + 1` (or `1` if none exists), and inserts a new immutable `scoring_archives` row containing the full JSON ranking snapshot, `archived_by` (from the JWT), and `archive_reason`.
  4. On success, the frontend marks the contract as archived in local UI state, bumps the displayed archive version/date, and shows a success toast. The dashboard's "Archive" button becomes disabled once a contract is marked archived in this session.
- **Edge Case / Alternative Flow:**
  - **Neither `contractId` nor the legacy `tenderReferenceId` is supplied:** blocked with `400 ValidationError` by `validate(archiveSchema)` before the controller runs.
  - **Contract has no evaluation rankings at all (e.g. zero tenders, or none evaluated):** `dashboardService.archiveScoringList` throws a `400` ("No evaluation rankings found for this contract").
  - **Contract already has one or more prior archives:** allowed - a new row is created with `archive_version` incremented, rather than being rejected; the unique index is on `(tender_reference_id, archive_version)`, not on `tender_reference_id` alone, so re-archiving after new evaluations come in is supported (unlike the version originally sketched in this doc, which described a `409 Conflict` on re-archive - the implemented behavior instead versions the snapshot).
  - **Caller has no/expired JWT:** `401` from `authenticate` - this is the only auth check on this endpoint; there is no role restriction (`authorise(...)` is not applied), so any authenticated role - not just `ma_staff` - can archive.
  - **Unexpected server/DB error inside the transaction:** masked and returned as `500 Internal Server Error` (the controller only passes through the message for errors with an explicit `.status < 500`).

---

## Auth Gap Note (current implementation, as of this scope's latest change)

`contractRoutes.js` now requires `authenticate` on every route, and `authenticate` + `authorise('ma_staff')` on the three mutating routes (`POST`, `PUT`, `DELETE`) - this was **not** the case in an earlier version of this scope, which shipped with no auth middleware at all.

`dashboardRoutes.js` was **not** updated the same way: `GET /kpis` and `GET /rankings` still have no `authenticate` middleware at all (open to any caller, authenticated or not), and `POST /archive` has `authenticate` but no `authorise(...)` role restriction (any authenticated role can archive, not just `ma_staff`/management). UC-E6, UC-E7, and UC-E9 above describe the dashboard as if restricted to evaluators/staff/management because that's the intended audience per the frontend's navigation and role-based route guards - but the backend does not currently enforce that for the dashboard endpoints the way it does for contract CRUD. This is flagged here (and in `api-documentation.md`) as a real gap to close, not papered over as already-fixed.
