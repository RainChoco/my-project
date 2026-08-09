# Test Cases - Kai Xuan (Backend)

## checkEvalDump.test.js

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-KX-001 | Dump Evaluations Table Schema | Opens a connection to `tender_db.sqlite` and runs `PRAGMA table_info(evaluations)` to list the `evaluations` table's columns. | Logs the column names (or a DB error) to the console and calls `done()`; this is a diagnostic script with no `expect()` assertions. |

## checkTenderDump.test.js

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-KX-002 | Dump Tenders Table Rows and Schema | Opens `tender_db.sqlite`, selects the first 5 rows from the `tenders` table, then runs `PRAGMA table_info(tenders)` to list its columns. | Logs the queried rows (or error) and the column names to the console and calls `done()`; this is a diagnostic script with no `expect()` assertions. |

## checkYup.test.js

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-KX-003 | Validate Empty String Query Fields Against Rankings Schema | Calls `getRankingsSchema.validate()` (a Yup schema mirroring the rankings query params) against an object where `status`, `category`, `dateFrom`, and `dateTo` are empty strings, alongside a valid `contractId`, `page`, `pageSize`, `sortBy`, and `sortOrder`. | Logs either "Validation passed!" or "Validation failed: <message>" to the console via a try/catch; this is a diagnostic script with no `expect()` assertions. |

## dashboardController.test.js

Seeded data (in `beforeAll`): one contract (`CTR-TEST-001`), three tenders (two `approved`, one `submitted`) linked to that contract, and one evaluation per tender with `pqm_score` values 92.5, 88.0, and 95.1 respectively. A real JWT is issued for the seeded admin user for use on authenticated archive requests.

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-KX-004 | Fetch Aggregated KPIs Without Filters | Calls `GET /api/dashboard/kpis` with no query parameters against the seeded tenders/evaluations. | Returns HTTP 200 with `status: 'success'`, a `data` object containing `totalTenders` and `averagePQM`, and `data.totalTenders` equal to 3. |
| BE-KX-005 | Apply contractId Filter to KPIs | Calls `GET /api/dashboard/kpis?contractId=<testContractId>` using the seeded contract's id. | Returns HTTP 200 with `data.totalTenders` equal to 3, since all seeded tenders belong to that contract. |
| BE-KX-006 | Return Zero Tenders for Unknown contractId | Calls `GET /api/dashboard/kpis?contractId=CTR-NONEXISTENT`. | Returns HTTP 200 with `data.totalTenders` equal to 0. |
| BE-KX-007 | Fetch Rankings With Default Pagination | Calls `GET /api/dashboard/rankings` with no query parameters. | Returns HTTP 200 with `status: 'success'`, `data` as an array of length 3, and `pagination.page` equal to 1. |
| BE-KX-008 | Sort Rankings by pqmScore Ascending | Calls `GET /api/dashboard/rankings?sortBy=pqmScore&sortOrder=asc` against the seeded evaluations (pqm scores 92.5, 88.0, 95.1). | Returns HTTP 200 with the first result's `pqmScore` close to 88.0 and the last result's `pqmScore` close to 95.1, confirming ascending order. |
| BE-KX-009 | Filter Rankings by contractId | Calls `GET /api/dashboard/rankings?contractId=<testContractId>`. | Returns HTTP 200 with `data.length` equal to 3. |
| BE-KX-010 | Archive a Finalized Scoring List | Sends an authenticated (`Bearer` JWT) `POST /api/dashboard/archive` with the seeded `contractId` and an `archiveReason`. | Returns HTTP 201 with `status: 'success'` and `data.version` equal to 1. |
| BE-KX-011 | Auto-Increment Archive Version on Second Archive | Sends a second authenticated `POST /api/dashboard/archive` for the same `contractId` with a different `archiveReason`. | Returns HTTP 201 with `data.version` incremented to 2. |
| BE-KX-012 | Reject Archive for contractId With No Evaluation Data | Sends an authenticated `POST /api/dashboard/archive` using `contractId: 'CTR-NO-EVALUATIONS'`, which has no associated evaluation records. | Returns HTTP 400 with a `message` matching "No evaluation rankings found". |
| BE-KX-013 | Reject Archive Missing Both contractId and tenderReferenceId | Sends an authenticated `POST /api/dashboard/archive` with only an `archiveReason`, omitting both `contractId` and `tenderReferenceId`. | Returns HTTP 400. |
| BE-KX-014 | Reject Archive Without Authorization Header | Sends `POST /api/dashboard/archive` with a valid `contractId` but no `Authorization` header. | Returns HTTP 401. |
