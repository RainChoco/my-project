# Use Cases - Zheng Hong (Scope A: Tender Document Receiving & CRUD)

Covers every function this scope owns, per `design/zheng-hong/database-schema.md`: tender intake/CRUD, document upload with versioning, AI-assisted eligibility parsing, deterministic eligibility checks, manual override/review, and the BCA/eligibility reference data those checks depend on.

## UC-A1: Upload New Tender Submission

- **Actor:** MA / procurement staff
- **Trigger:** A vendor's tender package (Main Offer, optionally an Alternative Offer, license, and supporting documents) is received and ready to be logged into the system.
- **Main Flow:**
  1. MA staff opens "New Tender Submission" and enters vendor name, tender reference number, submission date, and main offer price.
  2. MA staff uploads the associated documents (main offer, alternative offer if any, BCA license, other supporting files).
  3. System uploads each file to Cloudinary and creates a `tender_documents` row per file (`version: 1`, `is_latest: true`).
  4. System creates the `tenders` row with `status: 'draft'` and `eligibility_status: 'pending'`.
  5. MA staff submits the tender, moving `status` to `'submitted'`, which queues AI eligibility parsing (UC-A6).
- **Edge Case / Alternative Flow:**
  - **Duplicate `tender_ref_no`:** system rejects the submission with a validation error before any documents are uploaded to Cloudinary, so no orphaned files are created.
  - **Alternative Flow:** vendor has no Alternative Offer - `alternative_offer_price` and the corresponding document are simply omitted; this is valid, not an error.

## UC-A2: List & Filter Tender Submissions

- **Actor:** MA / procurement staff, Evaluators, Management
- **Trigger:** User opens the tender list/dashboard to review current submissions.
- **Main Flow:**
  1. User opens the tender list view.
  2. System fetches `tenders`, optionally filtered by `status`, `eligibility_status`, or vendor name.
  3. System displays each tender's reference number, vendor, price, eligibility status, and workflow status.
  4. User selects a tender to view full details, including its documents and eligibility check breakdown.
- **Edge Case / Alternative Flow:**
  - **No tenders match the filter:** system shows an empty state rather than an error, and preserves the applied filter so the user can adjust it.

## UC-A3: Edit Tender Submission Details

- **Actor:** MA / procurement staff
- **Trigger:** A correction is needed to a tender's declared details (e.g. price typo) before evaluation begins.
- **Main Flow:**
  1. MA staff opens a tender with `status: 'draft'` or `'submitted'`.
  2. MA staff edits an allowed field (e.g. `vendor_name`, `main_offer_price`).
  3. System validates and saves the change, updating `updated_at`.
- **Edge Case / Alternative Flow:**
  - **Tender already `under_evaluation`, `approved`, or `rejected`:** system blocks the edit and instructs the user to raise a clarification instead (Scope D), since changing scored data after evaluation has started would invalidate the PQM score and audit trail.

## UC-A4: Withdraw / Delete Tender Submission

- **Actor:** MA / procurement staff
- **Trigger:** A vendor formally withdraws, or a tender was logged in error (e.g. duplicate entry).
- **Main Flow:**
  1. MA staff selects a tender with `status: 'draft'` or `'submitted'`.
  2. MA staff confirms withdrawal/deletion.
  3. System cascades the delete to `tender_documents` and `eligibility_checks` for that tender (`onDelete: 'CASCADE'`).
- **Edge Case / Alternative Flow:**
  - **Tender is `approved` or `under_evaluation`:** hard delete is blocked; system requires an explicit "withdraw" status transition instead - the tender's `status` changes to `'withdrawn'`, keeping the record (and its audit trail) intact rather than removing it.

## UC-A5: Upload a Replacement Document (Versioning)

- **Actor:** MA / procurement staff
- **Trigger:** A vendor sends a corrected version of a previously uploaded document (e.g. a fixed main offer PDF).
- **Main Flow:**
  1. MA staff opens the tender and selects "Replace Document" on an existing `tender_documents` entry.
  2. MA staff uploads the new file.
  3. System uploads it to Cloudinary as a new asset, inserts a new `tender_documents` row with `version` incremented and `is_latest: true`.
  4. System sets `is_latest: false` on the previous version of that document - the old row and its Cloudinary asset are retained, not deleted.
- **Edge Case / Alternative Flow:**
  - **Cloudinary upload fails mid-request:** system does not create the new `tender_documents` row or flip `is_latest` on the old one, so the previous version remains the latest until a successful retry.

## UC-A6: AI Eligibility Parsing

- **Actor:** System (Gemini API), triggered by MA staff submitting a tender
- **Trigger:** A tender moves to `status: 'submitted'` with its documents uploaded.
- **Main Flow:**
  1. System sends the uploaded documents to Gemini to extract `paid_up_capital`, `bca_fm01_license_no`, `bca_fm01_grade`, and the non-debarment declaration.
  2. System writes the extracted raw values onto the `tenders` row.
  3. Backend deterministically compares each extracted value against reference data (`eligibility_thresholds.min_paid_up_capital`, `bca_grade_limits` for the extracted grade) and writes one `eligibility_checks` row per criterion, snapshotting the threshold used (`source: 'ai_extracted'`).
  4. Backend derives `tenders.eligibility_status` from the check results: `'eligible'` if all pass, `'flagged'` if any fail (but not debarred), `'rejected'` if non-debarment fails.
  5. System writes a short `ai_eligibility_summary` narrative for evaluators to read at a glance.
- **Edge Case / Alternative Flow:**
  - **AI cannot extract a value** (e.g. BCA license number not found in the document, as in seed tender `TC-2026-006`): the corresponding field is left `null`, the relevant `eligibility_checks` row is recorded as `passed: false` with a note explaining what was missing, and dependent checks that need that value (e.g. `bca_fm01_tender_limit`, which needs the grade) are skipped rather than guessed.

## UC-A7: Manual Eligibility Override / Review

- **Actor:** MA / procurement staff, or Evaluator (C-suite)
- **Trigger:** A high-stakes AI-flagged result (particularly non-debarment) needs human confirmation before the tender proceeds or is rejected.
- **Main Flow:**
  1. Reviewer opens the eligibility breakdown for a flagged tender.
  2. Reviewer manually verifies the criterion against the authoritative source (e.g. the debarment list).
  3. Reviewer records the outcome, creating/updating an `eligibility_checks` row with `source: 'manual_override'`, `checked_by` set to their user id, and a required `notes` explanation.
  4. System recomputes `tenders.eligibility_status` from the updated check set.
- **Edge Case / Alternative Flow:**
  - **Reviewer attempts to submit an override with no `notes`:** system rejects the save - a manual override must always carry a documented reason, since it is what makes an AI-assisted rejection defensible in an audit (seed tender `TC-2026-003` is exactly this case).

## UC-A8: View Eligibility Check Breakdown

- **Actor:** MA / procurement staff, Evaluators
- **Trigger:** A user needs to understand why a tender is `'eligible'`, `'flagged'`, or `'rejected'`.
- **Main Flow:**
  1. User opens a tender's detail view.
  2. System fetches all `eligibility_checks` rows for that `tender_id`.
  3. UI displays each criterion with its `actual_value`, `threshold_value_used`, `passed` state, `source`, and any `notes`.
- **Edge Case / Alternative Flow:**
  - **Tender is still `draft`/`pending` with zero checks recorded** (e.g. seed tender `TC-2026-004`): UI shows "Eligibility not yet assessed" instead of an empty table, so it isn't mistaken for a tender that passed with no issues.

## UC-A9: Manage BCA Grade Tender-Value Limits (Reference Data)

- **Actor:** MA / procurement staff (admin function)
- **Trigger:** BCA publishes an updated grading schedule, or the team needs to correct a seeded/placeholder limit.
- **Main Flow:**
  1. Admin user opens the BCA grade limits configuration screen.
  2. Admin sets a new `max_tender_value` for a given `grade` with an `effective_from` date - this appends a new historical entry to `bca_grade_limits` rather than overwriting the existing row for that grade.
  3. System saves the change; future `eligibility_checks` runs use the new value.
- **Edge Case / Alternative Flow:**
  - **Existing approved tenders were checked against the old limit:** their `eligibility_checks.threshold_value_used` keeps the snapshotted historical value - updating the reference table does not retroactively change past audit records.

## UC-A10: Manage Eligibility Thresholds (Reference Data)

- **Actor:** MA / procurement staff (admin function)
- **Trigger:** A policy change to a non-BCA eligibility rule (currently minimum paid-up capital).
- **Main Flow:**
  1. Admin user opens the eligibility thresholds configuration screen.
  2. Admin updates `threshold_value` for a `criterion_key` (e.g. `'min_paid_up_capital'`).
  3. System records `updated_by` and `updated_at`, and applies the new threshold to all eligibility checks run from that point forward.
- **Edge Case / Alternative Flow:**
  - **Threshold changed while a tender is mid-evaluation:** the tender's already-recorded `eligibility_checks` are not re-run automatically; a re-check must be explicitly triggered by staff, preventing a silent change to a tender's eligibility outcome without human awareness.
