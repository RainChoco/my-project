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
  - **Criterion is already referenced by a completed `evaluations` row:** system does not retroactively rescore past evaluations - `evaluations.ai_extracted_inputs` and `pqm_score` for those rows keep their original values, preserving the audit trail.

## UC-B3: View Evaluation Criteria List

- **Actor:** MA / procurement staff, Evaluators
- **Trigger:** A user needs to see the current scoring weightage before reviewing or processing a tender's evaluation.
- **Main Flow:**
  1. User opens the "Evaluation Criteria" list view.
  2. System fetches all `evaluation_criteria` rows, grouped by `category`.
  3. UI displays each criterion's name, category, and weight, plus the running total.
- **Edge Case / Alternative Flow:**
  - **No active criteria configured yet:** UI shows an empty state prompting an admin to set up weights, since evaluation processing (UC-B4) cannot proceed without them.

## UC-B4: Process Tender for Evaluation (AI Input Extraction)

- **Actor:** Evaluator, triggered after a tender passes eligibility (Scope A, `eligibility_status: 'eligible'` or `'flagged'` with override)
- **Trigger:** Evaluator opens the "Process Tender" form for a tender ready to be scored.
- **Main Flow:**
  1. Evaluator selects a tender and opens the Processing Tender Form.
  2. Evaluator confirms/selects which uploaded documents (main offer, alternative offer) ChatGPT should read.
  3. System sends the tender's documents plus the active `evaluation_criteria` to ChatGPT to extract structured price and quality inputs.
  4. System writes the extracted values to `evaluations.ai_extracted_inputs` (JSONB) and creates the `evaluations` row with `status: 'processing'`, `tender_id`, and `evaluated_by`.
  5. Evaluator reviews the extracted inputs on the form before confirming, then submits to trigger PQM computation (UC-B5).
- **Edge Case / Alternative Flow:**
  - **Tender's `eligibility_status` is `'rejected'`:** system blocks the Processing Tender Form from opening entirely, since a rejected tender should never receive a PQM score.

## UC-B5: Compute Deterministic PQM Score

- **Actor:** System, triggered by Evaluator confirming extracted inputs (UC-B4)
- **Trigger:** An `evaluations` row exists with `status: 'processing'` and confirmed `ai_extracted_inputs`.
- **Main Flow:**
  1. Backend reads the confirmed `ai_extracted_inputs` and the active `evaluation_criteria` weights.
  2. Backend deterministically calculates `price_score` and `quality_score` in code (not via the LLM), since arithmetic precision matters for a compliance-facing score.
  3. Backend combines the weighted scores into `pqm_score` (out of 100%).
  4. System saves the scores to the `evaluations` row and sets `status: 'scored'` and `evaluation_date`.
- **Edge Case / Alternative Flow:**
  - **`ai_extracted_inputs` is missing a value the formula needs** (e.g. AI could not read the alternative offer price): system does not silently compute a partial score - it sets `status: 'incomplete'` and flags which input is missing for the evaluator to supply manually before scoring can proceed.

## UC-B6: View Evaluation / PQM Score Breakdown

- **Actor:** Evaluators, Management
- **Trigger:** A user wants to see how a tender's PQM score was derived, or compare scores across vendors for the same tender exercise.
- **Main Flow:**
  1. User opens a tender's evaluation detail view.
  2. System fetches the `evaluations` row(s) for that `tender_id`.
  3. UI displays `price_score`, `quality_score`, `pqm_score`, the criteria weights used, and the raw `ai_extracted_inputs` for transparency.
- **Edge Case / Alternative Flow:**
  - **Evaluation `status` is `'incomplete'`:** UI surfaces the missing-input warning from UC-B5 instead of displaying a `pqm_score` of 0, so it isn't mistaken for a genuinely low score.

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
  2. Evaluator manually triggers "Re-process Evaluation" (`POST /api/evaluations/:id/reprocess`), which creates a new `evaluations` row (not an edit of the rejected one) linked to the same `tender_id`.
  3. Flow resumes at UC-B4 (AI input extraction) using any updated documents/vendor responses.
  4. The prior rejected `evaluations` row and its `approvals`/`risk_assessments` remain untouched as historical record.
- **Edge Case / Alternative Flow:**
  - **Underlying tender documents haven't changed since the rejection:** system still allows re-processing (e.g. a Manager may want a different evaluator's read of the same evidence), but flags on the new evaluation that no source documents changed since the last rejection, so reviewers know why the inputs look identical.
