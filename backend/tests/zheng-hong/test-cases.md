# Test Cases - Zheng Hong (Backend)

## tenderScopeA.test.js

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-ZH-001 | Rejects an unauthenticated create request | Sends `POST /api/tenders` with an empty body and no Authorization header | Response status is 401 |
| BE-ZH-002 | Blocks non ma_staff roles from creating a tender | Sends `POST /api/tenders` as an `evaluator`-role user with a valid tender payload | Response status is 403 |
| BE-ZH-003 | Rejects a create request missing required fields | Sends `POST /api/tenders` as `ma_staff` with only `contractId` in the body | Response status is 400 and `res.body.type` is `'ValidationError'` |
| BE-ZH-004 | Rejects creating a tender against a contract that does not exist | Sends `POST /api/tenders` as `ma_staff` referencing a non-existent `contractId` | Response status is 400 |
| BE-ZH-005 | Rejects creating a tender against a Closed contract | Sends `POST /api/tenders` as `ma_staff` against a contract with status `Closed` | Response status is 422 |
| BE-ZH-006 | ma_staff can create a tender against an open contract | Sends `POST /api/tenders` as `ma_staff` with a full valid payload against an `Open` contract | Response status is 201, `status` defaults to `'draft'`, `eligibility_status` defaults to `'pending'`, and `vendor_uen` is echoed back |
| BE-ZH-007 | Rejects a duplicate tender_ref_no | Sends `POST /api/tenders` reusing a `tender_ref_no` that was already created | Response status is 409 |
| BE-ZH-008 | Gets a single tender by id, including its linked contract | Sends `GET /api/tenders/:id` for the previously created tender | Response status is 200, `tender_ref_no` matches, and the nested `contract.id` matches the open contract |
| BE-ZH-009 | 404s when getting a tender that does not exist | Sends `GET /api/tenders/999999` | Response status is 404 |
| BE-ZH-010 | Lists tenders and supports filtering by vendor_name (case-insensitive, partial) | Sends `GET /api/tenders?vendor_name=acme` as `evaluator` | Response status is 200, the result set includes the tender with ref `TC-A-001`, and pagination page is 1 |
| BE-ZH-011 | Lists tenders filtered by contractId | Sends `GET /api/tenders?contractId=<openContractId>` as `evaluator` | Response status is 200 and every returned tender's `contractId` matches the filter |
| BE-ZH-012 | Blocks non ma_staff roles from updating a tender | Sends `PATCH /api/tenders/:id` as `evaluator` attempting to change `vendor_name` | Response status is 403 |
| BE-ZH-013 | ma_staff can update editable fields on a draft tender | Sends `PATCH /api/tenders/:id` as `ma_staff` updating `paid_up_capital`, `bca_fm01_license_no`, `bca_fm01_grade`, and `non_debarment_declared` on a draft tender | Response status is 200 and all four updated fields are reflected in the response body |
| BE-ZH-014 | 404s when updating a tender that does not exist | Sends `PATCH /api/tenders/999999` as `ma_staff` | Response status is 404 |
| BE-ZH-015 | Blocks edits once the tender is locked (under_evaluation / approved / rejected / withdrawn) | Sends `PATCH /api/tenders/:id` as `ma_staff` against a tender with status `under_evaluation` | Response status is 409 |
| BE-ZH-016 | Blocks non ma_staff roles from deleting a tender | Sends `DELETE /api/tenders/:id` as `evaluator` | Response status is 403 |
| BE-ZH-017 | Blocks deleting a tender locked by its status | Sends `DELETE /api/tenders/:id` as `ma_staff` against a tender with status `approved` | Response status is 409 |
| BE-ZH-018 | 404s when deleting a tender that does not exist | Sends `DELETE /api/tenders/999999` as `ma_staff` | Response status is 404 |
| BE-ZH-019 | ma_staff can delete a non-locked tender | Sends `DELETE /api/tenders/:id` as `ma_staff` against a `draft` tender | Response status is 204 and the tender can no longer be found by `Tender.findByPk` |
| BE-ZH-020 | 404s uploading a document to a tender that does not exist | Sends `POST /api/tenders/999999/documents` as `ma_staff` with a file attached | Response status is 404 |
| BE-ZH-021 | Rejects an upload with no file attached | Sends `POST /api/tenders/:id/documents` as `ma_staff` with `file_type` set but no file attached | Response status is 400 |
| BE-ZH-022 | Rejects an upload with an invalid file_type | Sends `POST /api/tenders/:id/documents` as `ma_staff` with `file_type` set to `'not_a_real_type'` and a file attached | Response status is 400 and `res.body.type` is `'ValidationError'` |
| BE-ZH-023 | Blocks non ma_staff roles from uploading documents | Sends `POST /api/tenders/:id/documents` as `evaluator` with a valid file attached | Response status is 403 |
| BE-ZH-024 | ma_staff can upload a main_offer document | Sends `POST /api/tenders/:id/documents` as `ma_staff` with `file_type: 'main_offer'` and a PDF file attached (Cloudinary upload mocked) | Response status is 201, `file_type` is `'main_offer'`, `version` is 1, `is_latest` is true, and the mocked `cloudinaryService.uploadBuffer` was called |
| BE-ZH-025 | Lists documents for a tender | Sends `GET /api/tenders/:id/documents` as `evaluator` after one document was uploaded | Response status is 200, exactly one document is returned, matching the previously uploaded document's id |
| BE-ZH-026 | Replaces a document, bumping the version and marking the prior one not latest | Sends `PUT /api/tenders/:id/documents/:docId` as `ma_staff` with a new file, then re-lists documents with `latest_only=true` | Response status is 201, new version is 2 and `is_latest` is true; the prior document record's `is_latest` becomes false; the latest-only list contains only the version-2 document |
| BE-ZH-027 | 404s replacing a document that does not exist on the tender | Sends `PUT /api/tenders/:id/documents/999999` as `ma_staff` with a file attached | Response status is 404 |
| BE-ZH-028 | 409s triggering an eligibility check before any documents are uploaded | Sends `POST /api/tenders/:id/eligibility-check` as `ma_staff` for a `submitted` tender with no documents | Response status is 409 |
| BE-ZH-029 | Blocks non ma_staff roles from triggering an eligibility check | Sends `POST /api/tenders/:id/eligibility-check` as `evaluator` | Response status is 403 |
| BE-ZH-030 | Marks a tender eligible when every deterministic check passes | Triggers the eligibility check for a tender with offer price under its BCA grade ceiling, paid-up capital above threshold, a BCA license/grade, non-debarment declared, and a document uploaded | Response status is 200, `eligibility_status` is `'eligible'`, `checks_created` is 4, the AI summary reads "All eligibility criteria met.", all 4 stored checks have `passed: true`, and the tender's persisted `eligibility_status` is `'eligible'` |
| BE-ZH-031 | Flags a tender when paid-up capital is below the minimum threshold | Triggers the eligibility check for a tender with `paid_up_capital` (100000) below the 500000 threshold, otherwise passing | Response status is 200, `eligibility_status` is `'flagged'`, the AI summary mentions "paid-up capital", and the stored `min_paid_up_capital` check has `passed: false` |
| BE-ZH-032 | Flags a tender whose main offer price exceeds its BCA grade tender value ceiling | Triggers the eligibility check for a tender with `main_offer_price` (2,000,000) above L1's 1,500,000 ceiling | `eligibility_status` is `'flagged'` and the stored `bca_fm01_tender_limit` check has `passed: false` |
| BE-ZH-033 | Does not cap the tender value when the BCA grade has no ceiling (L4 -> null max_tender_value) | Triggers the eligibility check for a tender on grade L4 (whose `max_tender_value` is null) with an offer price of 50,000,000 | `eligibility_status` is `'eligible'` and the stored `bca_fm01_tender_limit` check has `passed: true` |
| BE-ZH-034 | Rejects a tender outright when non-debarment is not declared, even if other checks pass | Triggers the eligibility check for a tender with `non_debarment_declared: false` but otherwise passing values | Response status is 200, `eligibility_status` is `'rejected'`, and the tender's persisted `eligibility_status` is `'rejected'` |
| BE-ZH-035 | Re-running the check clears prior checks rather than accumulating duplicates | Triggers the eligibility check twice in a row for the same tender (which has no `bca_fm01_grade` set) | Exactly 3 `EligibilityCheck` rows exist afterward (not 6), since the tender-limit check is skipped without a grade and the second run replaces rather than appends |
| BE-ZH-036 | 404s triggering an eligibility check for a tender that does not exist | Sends `POST /api/tenders/999999/eligibility-check` as `ma_staff` | Response status is 404 |
| BE-ZH-037 | Rejects an override missing notes | Sends `PATCH /api/eligibility-checks/:id` as `ma_staff` with `passed: true` but no `notes` field | Response status is 400 |
| BE-ZH-038 | Blocks roles outside ma_staff/evaluator from overriding | Sends `PATCH /api/eligibility-checks/:id` as a `management`-role user with `passed` and `notes` provided | Response status is 403 |
| BE-ZH-039 | ma_staff can manually override a failed check, and eligibility status recomputes | Sends `PATCH /api/eligibility-checks/:id` as `ma_staff` to flip a failed `min_paid_up_capital` check to `passed: true` with notes | Response status is 200, `passed` is true, `source` is `'manual_override'`, and the parent tender's `eligibility_status` recomputes to `'eligible'` |
| BE-ZH-040 | 404s overriding a check that does not exist | Sends `PATCH /api/eligibility-checks/999999` as `ma_staff` with `passed` and `notes` provided | Response status is 404 |
| BE-ZH-041 | Lists the current BCA grade limits | Sends `GET /api/config/bca-grade-limits` as `evaluator` | Response status is 200 and the L1 entry's `max_tender_value` is 1500000 |
| BE-ZH-042 | Blocks non ma_staff roles from updating a BCA grade limit | Sends `PUT /api/config/bca-grade-limits/L2` as `evaluator` | Response status is 403 |
| BE-ZH-043 | ma_staff can set a new BCA grade limit | Sends `PUT /api/config/bca-grade-limits/L2` as `ma_staff` with `max_tender_value: 6000000` | Response status is 200, the returned `max_tender_value` is 6000000, and a subsequent list call reflects the updated L2 value |
| BE-ZH-044 | Rejects an invalid grade in the URL | Sends `PUT /api/config/bca-grade-limits/L9` as `ma_staff` (L9 is not a valid grade) | Response status is 400 |
| BE-ZH-045 | Lists eligibility thresholds | Sends `GET /api/config/eligibility-thresholds` as `evaluator` | Response status is 200 and the `min_paid_up_capital` entry's `threshold_value` is 500000 |
| BE-ZH-046 | Blocks non ma_staff roles from updating a threshold | Sends `PUT /api/config/eligibility-thresholds/min_paid_up_capital` as `evaluator` | Response status is 403 |
| BE-ZH-047 | ma_staff can update an existing threshold | Sends `PUT /api/config/eligibility-thresholds/min_paid_up_capital` as `ma_staff` with `threshold_value: 750000`, then restores it back to 500000 | Response status is 200 and the returned `threshold_value` is 750000 |
| BE-ZH-048 | 404s updating a threshold with an unknown criterion_key | Sends `PUT /api/config/eligibility-thresholds/not_a_real_criterion` as `ma_staff` | Response status is 404 |

*(BE-ZH-049 onward were added later in `tenderScopeA.test.js`, interspersed at specific points rather than appended at the end of the file - IDs here are sequential by addition order, not strict file line-order.)*

| BE-ZH-049 | Returns a friendly fallback message (never the raw Cloudinary error) and creates no document record when the upload service is unconfigured | Mocks `cloudinaryService.uploadBuffer` to reject with a `CLOUDINARY_NOT_CONFIGURED`-tagged error, then uploads a document | Response status is 502, `message` is exactly `'Document upload service currently unavailable'` (never mentions "cloudinary"), the `TenderDocument` count for that tender is unchanged, and the server log contains a "not configured" diagnostic |
| BE-ZH-050 | Returns the same friendly fallback message for a generic Cloudinary-side failure (not just "not configured") | Mocks `cloudinaryService.uploadBuffer` to reject with a plain `Error('Network timeout contacting Cloudinary')` | Response status is 502 and `message` is exactly `'Document upload service currently unavailable'` |
| BE-ZH-051 | Persists an explicit `status: 'submitted'` from the request body as-is, not overridden to draft | Sends `POST /api/tenders` as `ma_staff` with `status: 'submitted'` and `eligibility_status: 'eligible'` explicitly included | Response status is 201, `status` is `'submitted'`, `eligibility_status` is `'eligible'`, and the persisted DB row's `status` is `'submitted'` |

## Tender Image / Document Package Upload (tenderScopeA.test.js)

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-ZH-052 | ma_staff can upload an image as the tender document package | Sends `POST /api/tenders/:id/image` as `ma_staff` with a PNG file attached (Cloudinary upload mocked) | Response status is 200 and the mocked `cloudinaryService.uploadBuffer` was called |
| BE-ZH-053 | Returns the friendly fallback message and leaves the tender record untouched when the upload service is unconfigured | Mocks `cloudinaryService.uploadBuffer` to reject with a `CLOUDINARY_NOT_CONFIGURED`-tagged error, then uploads a PDF as the tender's document package | Response status is 502, `message` is exactly `'Document upload service currently unavailable'`, the tender's `image_url` is unchanged from before the attempt, and the server log contains a "not configured" diagnostic |

## cloudinaryService.test.js

*(Unit tests against the real, unmocked `config/cloudinary.js` / `services/cloudinaryService.js` modules - the controller tests above all replace `cloudinaryService` entirely via `jest.mock`, so they never exercise this code directly.)*

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-ZH-054 | Rejects immediately with a CLOUDINARY_NOT_CONFIGURED error when credentials are missing - no network call attempted | Deletes `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET` from `process.env`, reloads the module fresh, and calls `uploadBuffer` | The returned promise rejects with an error whose `code` is `'CLOUDINARY_NOT_CONFIGURED'` |
| BE-ZH-055 | Logs a clear diagnostic at module load time when credentials are missing, naming the missing vars | Deletes the three Cloudinary env vars, then fresh-requires `config/cloudinary.js` while spying on `console.error` | A logged line matches /not configured/i and contains all three missing env var names |
| BE-ZH-056 | Exposes isCloudinaryConfigured as false when any credential is missing | Deletes only `CLOUDINARY_API_SECRET` and fresh-requires `config/cloudinary.js` | `cloudinary.isCloudinaryConfigured` is `false` |
| BE-ZH-057 | Exposes isCloudinaryConfigured as true when all three credentials are present | Sets all three Cloudinary env vars to dummy values and fresh-requires `config/cloudinary.js` | `cloudinary.isCloudinaryConfigured` is `true` |
