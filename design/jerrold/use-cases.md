# Use Cases - Jerrold (Scope B: Evaluation, Processing & Risk Framework)

Covers every function this scope owns, per `design/er-diagram.md` (`EVALUATION_CRITERIA`, `EVALUATIONS`, `RISK_ASSESSMENTS`, `APPROVALS`) and `project-requirements.md`: evaluation criteria weight management, AI-assisted PQM score processing, the AI-generated Risk Assessment & Mitigation Matrix and its human-review gate, and the C-suite approval/rejection workflow.

## UC-B1: Define Evaluation Criteria Weights

- **Actor:** MA / procurement staff (admin function)
- **Trigger:** A new tender evaluation cycle needs its scoring criteria set up before any bids can be scored.
- **Main Flow:**
  1. Admin user opens "Evaluation Criteria" configuration screen.
  2. Admin adds a criterion with `criteria_name`, `category` (e.g. `'price'` or `'quality'`), and `weight_percentage`.
  3. System validates that all active criteria weights sum to 100%.
  4. System saves each criterion as an `evaluation_criteria` row with `created_by` set to the admin's user id.
- **Edge Case / Alternative Flow:**
  - **Weights do not sum to 100% after the add:** system blocks the save and shows the current total, since a PQM score computed against a mis-weighted criteria set would be invalid for every tender scored under it.

## UC-B2: Edit or Deactivate Evaluation Criteria

- **Actor:** MA / procurement staff (admin function)
- **Trigger:** A criterion's weighting needs to change, or a criterion is no longer relevant for future tenders.
- **Main Flow:**
  1. Admin opens an existing `evaluation_criteria` row.
  2. Admin updates `weight_percentage` or marks the criterion inactive.
  3. System re-validates that all active weights still sum to 100%.
  4. System saves the change; only future evaluations use the new weighting.
- **Edge Case / Alternative Flow:**
  - **Criterion is already referenced by a completed `evaluations` row:** system does not retroactively rescore past evaluations - that evaluation's `evaluation_criterion_scores` snapshot (`criteria_name_snapshot`/`category_snapshot`/`weight_percentage_snapshot`) and `pqm_score` keep their original values, preserving the audit trail.

## UC-B3: View Evaluation Criteria List

- **Actor:** MA / procurement staff, Evaluators
- **Trigger:** A user needs to see the current scoring weightage before reviewing or processing a tender's evaluation.
- **Main Flow:**
  1. User opens the "Evaluation Criteria" list view.
  2. System fetches all `evaluation_criteria` rows, grouped by `category`.
  3. UI displays each criterion's name, category, and weight, plus the running total.
- **Edge Case / Alternative Flow:**
  - **No active criteria configured yet:** UI shows an empty state prompting an admin to set up weights, since evaluation processing (UC-B4) cannot proceed without them.

## UC-B4: Create Evaluation from an Existing Tender

- **Actor:** Evaluator
- **Trigger:** A tender is ready to be scored (Scope A, `eligibility_status: 'eligible'` or `'flagged'` with override).
- **Main Flow:**
  1. Evaluator selects a tender from the existing `tenders` list by its `tender_ref_no` / `vendor_name` - the internal numeric `tender_id` is never something a user has to know.
  2. System checks the tender's `eligibility_status` is not `'rejected'`.
  3. System loads the active `evaluation_criteria` and validates the set sums to exactly 100%.
  4. System creates the `evaluations` row (`status: 'processing'`, `tender_id`, `evaluated_by`) and one `evaluation_criterion_scores` row per active criterion, snapshotting `criteria_name`/`category`/`weight_percentage` with `staff_score` left `null`.
  5. Evaluator is taken to the scoring form for this evaluation attempt (UC-B5).
- **Edge Case / Alternative Flow:**
  - **Tender's `eligibility_status` is `'rejected'`:** system blocks creation entirely (`409 tender_ineligible`), since a rejected tender should never receive a PQM score.
  - **Active criteria don't sum to exactly 100%:** system blocks creation (`409`, reporting the current `active_weight_total`), since a PQM score computed against a mis-weighted criteria set would be invalid.

## UC-B5: Score Evaluation Criteria & Compute Weighted PQM

- **Actor:** Evaluator (scoring), System (weighted calculation)
- **Trigger:** An `evaluations` row exists with `status: 'processing'` and its `evaluation_criterion_scores` rows are unscored (UC-B4).
- **Main Flow:**
  1. Evaluator enters a `staff_score` (0-100) and optional `remarks` for each criterion on the scoring form; progress can be saved as a draft any number of times (`PATCH /api/evaluations/:id/scores`).
  2. Once every criterion has a `staff_score`, evaluator submits the evaluation (`POST /api/evaluations/:id/submit`).
  3. Backend recomputes each row's `weighted_score` (`staff_score / 100 * weight_percentage_snapshot`) - never trusting a client-supplied value - and sums them into `price_score` / `quality_score` / `pqm_score`.
  4. System sets `status: 'scored'` and `evaluation_date`; the final PQM score is displayed to the evaluator.
- **Edge Case / Alternative Flow:**
  - **Submission attempted while any criterion is still unscored:** system blocks with `422` and lists which criteria are missing a score, rather than computing a partial total.
  - **Draft scores edited after the evaluation is already `'scored'`:** blocked (`409`) - only a fresh re-evaluation attempt (UC-B11) can be rescored.

## UC-B6: View Evaluation / PQM Score Breakdown & Compare Results

- **Actor:** Evaluators, Management
- **Trigger:** A user wants to see how a tender's PQM score was derived, or compare scores across evaluation attempts/vendors.
- **Main Flow:**
  1. User opens a tender's evaluation detail view, or the Evaluations list's comparison table.
  2. System fetches the `evaluations` row(s) for that `tender_id`, or every completed evaluation across tenders for the comparison table.
  3. UI displays each criterion's snapshotted `criteria_name`/`category`/`weight_percentage` alongside its `staff_score` and `weighted_score`, plus `price_score`/`quality_score`/`pqm_score` - exactly as recorded at scoring time, unaffected by any later edit to `evaluation_criteria`.
- **Edge Case / Alternative Flow:**
  - **Evaluation `status` is `'processing'`:** UI shows the live scoring form instead of a final PQM score, so an in-progress evaluation is never mistaken for a genuinely low one.

## UC-B7: Generate AI Risk Assessment & Mitigation Matrix

- **Actor:** System (ChatGPT API), triggered by Evaluator once an evaluation reaches `status: 'scored'`
- **Trigger:** A tender's PQM score has been computed and its constraints (pricing gaps, eligibility flags, contractual terms) are available.
- **Main Flow:**
  1. Evaluator clicks "Generate Risk Matrix" on a scored evaluation.
  2. System sends the tender's constraints and evaluation data to ChatGPT to draft risk items.
  3. For each identified risk, system creates a `risk_assessments` row with `risk_description`, `mitigation_plan`, `risk_level`, `ai_generated: true`, and `review_status: 'pending_review'`.
  4. UI presents the drafted matrix to the evaluator for review (UC-B8) rather than treating it as final.
- **Edge Case / Alternative Flow:**
  - **ChatGPT API call fails or times out:** system leaves the evaluation at `status: 'scored'` with no `risk_assessments` rows created, and surfaces a retry option, rather than saving an empty or partial matrix as if it were complete.

## UC-B8: Review & Approve Risk Assessment Content

- **Actor:** Evaluator or C-suite reviewer
- **Trigger:** An AI-generated `risk_assessments` row is sitting at `review_status: 'pending_review'`.
- **Main Flow:**
  1. Reviewer opens the risk matrix for a tender.
  2. Reviewer reads each AI-drafted risk item and either accepts it as-is, edits `risk_description`/`mitigation_plan`/`risk_level`, or rejects it.
  3. System updates `review_status` to `'reviewed'` (or `'rejected'`) and sets `reviewed_by` to the reviewer's user id.
  4. Once all risk items for the evaluation are `'reviewed'`, the matrix becomes eligible to be shown in the approval workflow (UC-B9) and later consumed by Scope C.
- **Edge Case / Alternative Flow:**
  - **Reviewer rejects a risk item outright:** the row is kept with `review_status: 'rejected'` rather than deleted, so the audit trail shows what the AI proposed and why a human overruled it - it is simply excluded from what downstream approval/reporting screens display.

## UC-B9: Approve or Reject Tender Evaluation

- **Actor:** C-suite roles (Manager)
- **Trigger:** An evaluation reaches `status: 'scored'` with its risk matrix fully human-reviewed (UC-B8), and is ready for a go/no-go decision.
- **Main Flow:**
  1. Manager opens the evaluation detail view, seeing the PQM score, criteria breakdown, and reviewed risk matrix side by side.
  2. Manager selects "Approve" or "Reject" and optionally enters `remarks`.
  3. System creates an `approvals` row with `evaluation_id`, `approver_id`, `decision`, `remarks`, and `decided_at`.
  4. System updates the `evaluations.status` to `'approved'` or `'rejected'` accordingly, which unlocks the tender for Scope C (board paper/deck generation) if approved.
- **Edge Case / Alternative Flow:**
  - **Manager attempts to reject without entering `remarks`:** system requires a reason for rejection (though remarks stay optional on approval), since a rejection needs to be defensible/actionable for the MA team and any resubmission.
  - **Non-C-suite user attempts to access the approval action:** system hides/blocks the Approve/Reject controls based on `users.role`, since only C-suite roles are authorised to log a decision.

## UC-B10: View Approval Decision History (Audit Trail)

- **Actor:** MA / procurement staff, Evaluators, Management
- **Trigger:** A user needs to confirm who approved or rejected a tender's evaluation, and why.
- **Main Flow:**
  1. User opens a tender's evaluation detail view.
  2. System fetches all `approvals` rows for that `evaluation_id`, ordered by `decided_at`.
  3. UI displays each decision with the approver's name, `decision`, `remarks`, and timestamp.
- **Edge Case / Alternative Flow:**
  - **Evaluation has no `approvals` row yet:** UI shows "Awaiting approval" rather than an empty table, distinguishing "not yet decided" from "decision history unavailable."

## UC-B11: Re-evaluate a Rejected or Returned Tender

- **Actor:** Evaluator
- **Trigger:** A Manager rejects an evaluation (UC-B9) but the tender is not withdrawn - e.g. after a clarification response (Scope D) resolves a pricing deviation, the MA team wants it rescored. **This is always a manual, evaluator-initiated action** - re-processing is never fired automatically off a Scope D clarification being resolved, to avoid a circular build dependency between Scope B and Scope D (see `design/feature-dependencies.md`, "Circular Dependency"). An evaluator checks Scope D's clarification log themselves and decides to re-process.
- **Main Flow:**
  1. Evaluator opens a tender with `evaluations.status: 'rejected'`.
  2. Evaluator manually triggers "Re-evaluate" (`POST /api/evaluations/:id/reprocess`), which creates a new `evaluations` row (not an edit of the rejected one) linked to the same `tender_id`, with a fresh set of unscored `evaluation_criterion_scores` rows snapshotted from the *currently* active criteria.
  3. Flow resumes at UC-B5 (the scoring form) for the evaluator to enter fresh staff scores.
  4. The prior rejected `evaluations` row and its `approvals`/`risk_assessments` remain untouched as historical record.
- **Edge Case / Alternative Flow:**
  - **Active criteria have changed since the rejected attempt:** the new evaluation attempt is scored against the current weighting, not the rejected attempt's - each evaluation's `evaluation_criterion_scores` snapshot always reflects the criteria set in effect when *that* attempt was created, so the two attempts remain independently comparable and neither retroactively changes the other.
