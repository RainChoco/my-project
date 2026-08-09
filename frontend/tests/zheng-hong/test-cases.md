# Test Cases - Zheng Hong (Frontend)

## TendersDashboardPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-ZH-001 | Renders tender list for ma_staff, including create button | Renders the dashboard for a user with the `ma_staff` role while `listTenders` resolves two sample tenders | The "Tender Management" heading, both tender reference numbers, and a "New Tender Submission" button are all shown |
| FE-ZH-002 | Hides management actions and create button for non ma_staff role | Renders the dashboard for a user with the `evaluator` role with the same two sample tenders loaded | The "New Tender Submission", "Edit", and "Delete" buttons are not rendered, but a "View" button is shown for each of the 2 tenders |
| FE-ZH-003 | Shows empty state when there are no tenders on record | Renders the dashboard as `ma_staff` with `listTenders` resolving an empty data array | The message "No tenders match the current filters." is displayed |
| FE-ZH-004 | Surfaces an error alert when the tender list fails to load | Renders the dashboard as `ma_staff` with `listTenders` rejecting with a response containing message "Server exploded" | The text "Server exploded" is displayed to the user |
| FE-ZH-005 | Deletes a tender after confirming in the dialog | Clicks "Delete" on the first tender row, then confirms via the "Delete tender" button in the resulting confirmation dialog | A confirmation dialog with "permanently delete" text appears, and `deleteTender` is called with the tender's id (1) |
| FE-ZH-006 | Disables Delete for a tender whose status locks it (e.g. approved) | Renders the dashboard with a single tender whose status is `approved` | The "Delete" button for that tender is disabled |

## EligibilityConfigPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-ZH-007 | Renders the loaded BCA grade limits and compliance thresholds | Renders the config page with mocked BCA grade limits (L1-L6) and eligibility thresholds (min paid-up capital, min BizSAFE level) | The "Eligibility Configuration" heading is shown, the paid-up capital field has value 2000000, and the L6 row's "No limit" checkbox is checked (since L6 has a null max_tender_value) |
| FE-ZH-008 | Shows an error state when the configuration fails to load | Renders the page with `listBcaGradeLimits` rejecting with a network error | The text "Failed to load eligibility configuration" (case-insensitive match) is displayed |
| FE-ZH-009 | Saves an updated minimum paid-up capital threshold | Changes the paid-up capital input to 2500000 and clicks "Save Rules" | `updateEligibilityThreshold` is called with `('min_paid_up_capital', { threshold_value: 2500000 })`, and `updateBcaGradeLimit` is not called since grade limits were unchanged |
| FE-ZH-010 | Resets the form back to the standard defaults when confirmed | Changes the paid-up capital input to 999, then clicks "Reset to Standard Rules" followed by confirming "Reset" in the resulting dialog | The paid-up capital input reverts back to 2000000 |

## TenderFormPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-ZH-011 | Shows the entry-mode selection screen first, then the manual form on request | Renders the create-mode form and clicks the "New Tender Submission" button from the initial entry-mode chooser | The initial screen shows "Choose how you'd like to log this tender.", and after clicking through, the "Vendor Name" and "Contract Opportunity" fields become visible |
| FE-ZH-012 | Blocks submission with validation errors when required fields are missing | Opens the manual tender form and blurs the empty "Vendor Name" field without filling it in | The validation message "Vendor name is required" is displayed and `createTender` is never called |
| FE-ZH-013 | Submits a valid tender and creates it against the selected contract | Fills in contract, vendor name, submission date, and main offer price with valid values and clicks "Save Tender" | `createTender` is called exactly once with a payload containing `contractId: 'CTR-001'`, `vendor_name: 'Acme Facilities'`, and `main_offer_price: 800000` |
| FE-ZH-014 | Shows a toast reflecting the actual saved status ("submitted"), not a hardcoded draft message | Submits a valid tender where `createTender` resolves with `status: 'submitted'`, leaving the Submission Status dropdown at its default | The success toast reads "TC-2026-018 was submitted successfully.", not a hardcoded "was logged as a draft." |
| FE-ZH-015 | Shows a "logged as a draft" toast only when the tender is actually saved with status draft | Submits a valid tender after changing the Submission Status dropdown to "Draft", where `createTender` resolves with `status: 'draft'` | The success toast reads "TC-2026-019 was logged as a draft." |
| FE-ZH-016 | Disables submission while the selected contract is blocked from new tenders (e.g. Closed) | Selects a contract whose status is "Closed" from the Contract Opportunity dropdown | A message matching "Tender submission is not allowed" is displayed and the "Save Tender" button is disabled |
| FE-ZH-017 | Still saves the tender (and attempts navigation) even if the optional document upload fails, e.g. a Cloudinary outage | Selects a PDF file in the "Tender Document Package" dropzone, submits a valid tender, and `uploadTenderImage` rejects with a 502 "Cloudinary upload failed" | `createTender` resolves and `uploadTenderImage` is still called with the created tender's id and file - proving the save was never rolled back or blocked by the later upload failure |
| FE-ZH-018 | Surfaces the server error and highlights tender_ref_no on a duplicate-reference 409 | Fills in a valid tender and submits it while `createTender` rejects with a 409 response containing message "tender_ref_no already exists" | The text "tender_ref_no already exists" is displayed (at least once) on the page |

## uploadErrorMessage.test.js

*(Located at `frontend/src/features/tenders/utils/uploadErrorMessage.test.js`, co-located with its source module rather than under `frontend/tests/zheng-hong/` - matching the pre-existing pattern already used elsewhere in this repo, e.g. `frontend/src/features/board-papers/utils/historyStorage.test.js`. Still discovered and run by `npm test` regardless of location.)*

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-ZH-019 | Returns a reassuring, retry-oriented message for a 502 (Cloudinary failure) | Calls `getUploadErrorMessage` with an error whose `response.status` is 502 | The returned message matches /upload service currently unavailable/i and /data was saved/i |
| FE-ZH-020 | Returns a timeout-specific message for ECONNABORTED | Calls `getUploadErrorMessage` with an error whose `code` is `'ECONNABORTED'` | The returned message matches /timed out/i |
| FE-ZH-021 | Returns a connectivity message when there is no response at all | Calls `getUploadErrorMessage` with an error that has a `request` but no `response` | The returned message matches /could not reach the server/i |
| FE-ZH-022 | Falls back to the backend message for other error statuses | Calls `getUploadErrorMessage` with a 400 response whose body has `message: 'file_type is required'` | The returned message is exactly `'file_type is required'` |
| FE-ZH-023 | Falls back to the provided default when the backend gives no message | Calls `getUploadErrorMessage` with a 500 response with an empty body and a custom fallback string | The returned message is exactly the provided fallback string |
