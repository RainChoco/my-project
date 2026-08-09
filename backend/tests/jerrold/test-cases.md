# Test Cases - Jerrold (Backend)

## evaluationScopeB.test.js

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-JD-001 | ma_staff can create a criterion | POST `/api/evaluation-criteria` as `ma_staff` with a Price Competitiveness criterion at 60% weight | Response is `201`, `category` is `'price'`, `is_active` is `true` |
| BE-JD-002 | Evaluator cannot create a criterion | POST `/api/evaluation-criteria` as `evaluator` role | Response is `403` |
| BE-JD-003 | Reject a weight that would push the active total over 100% | POST a new criterion at 50% while the existing active total is already 60% | Response is `409` with `current_active_total` of `60` |
| BE-JD-004 | Add the remaining 40% to reach exactly 100% | POST a Technical Quality criterion at 40% weight | Response is `201` |
| BE-JD-005 | List criteria with the active weight total | GET `/api/evaluation-criteria` as evaluator | Response is `200`, returns 2 criteria, and `active_weight_total` is `100` |
| BE-JD-006 | Reject an edit that breaks the exact-100% rule | PUT the price criterion's weight to 55% | Response is `409` |
| BE-JD-007 | Reject invalid category with 400 | POST a criterion with `category: 'nonsense'` | Response is `400` with `type` of `'ValidationError'` |
| BE-JD-008 | Accept capability and experience categories | Frees weight headroom, creates criteria with `category: 'capability'` and `category: 'experience'`, cleans them up, then reactivates the quality criterion | Both creations return `201` with the matching category, and the active weight total is restored to `100` afterward |
| BE-JD-009 | Reject a duplicate criterion name, case-insensitive and trimmed | POST a criterion named `'  price competitiveness  '` (differs only by case/whitespace from an existing one) | Response is `409` with `error: 'duplicate_criterion_name'` and `existing_criterion.id` matching the original criterion |
| BE-JD-010 | Permanently delete an unused criterion and recalculate the active weight total | Deactivates quality to free headroom, creates a temporary unused criterion, verifies the weight total, then permanently deletes it | Temp criterion has `is_used: false`; active weight total is `65` before deletion and `60` after; reactivating quality restores the total to `100` |
| BE-JD-011 | Duplicate lookup prioritises the active record over older inactive ones | Seeds two inactive rows plus one active row sharing a normalized name, then attempts to create a duplicate | Response is `409`; `existing_criterion` points to the active row (`is_active: true`) with the message `"An active criterion named 'Legacy Duplicate Criterion' already exists."` |
| BE-JD-012 | Flag criteria that share a normalized name as duplicates | Seeds a legacy inactive duplicate of the existing active Price Competitiveness criterion, then lists criteria | Both the original and the duplicate row have `is_duplicate_name: true` |
| BE-JD-013 | Duplicate cleanup preview and execution keep the active record, delete unused duplicates, and preserve historically-used ones | Seeds an active row, two unused inactive duplicates, and one inactive duplicate that is referenced by a real `EvaluationCriterionScore`, then runs preview and cleanup | Preview marks the active row as `keep`, the two unused rows for `delete`, and the used row as `preserved`; cleanup deletes only the two unused duplicates, leaving the active and used rows intact |
| BE-JD-014 | Duplicate cleanup picks the newest inactive record as the reactivation candidate when no active record exists | Seeds two inactive rows sharing a normalized name with no active row, runs preview and cleanup | Preview picks the newer row as `keep`/`reactivate_candidate_id` and the older row for `delete`; cleanup deletes the older row, and the newer row remains inactive (not auto-reactivated) |
| BE-JD-015 | ma_staff can create an evaluation | POST `/api/tenders/:id/evaluations` as `ma_staff` for an eligible tender | Response is `201` with `status: 'processing'` |
| BE-JD-016 | Evaluator can still create an evaluation | Same POST as `evaluator` role | Response is `201` |
| BE-JD-017 | Management cannot create an evaluation | Same POST as `management` role | Response is `403` |
| BE-JD-018 | Unauthenticated request is rejected | Same POST with no `Authorization` header | Response is `401` |
| BE-JD-019 | ma_staff can save draft scores and submit the evaluation it created | ma_staff creates an evaluation, fetches its criterion scores, PATCHes staff scores of 80 for each, then submits | Score PATCH returns `200`; submit returns `200` with `status: 'scored'` |
| BE-JD-020 | 404s when the tender does not exist | POST an evaluation for tender id `999` | Response is `404` |
| BE-JD-021 | Blocks creating an evaluation for an ineligible (rejected) tender | POST an evaluation for tender 2, whose `eligibility_status` is `'rejected'` | Response is `409` with `error: 'tender_ineligible'` |
| BE-JD-022 | Creates an evaluation from an eligible tender with a fresh unscored criterion snapshot | POST an evaluation for eligible tender 1, then GET its detail | Response is `201`; detail has 2 `criterion_scores`, all with `staff_score: null`, and correct `tender_ref_no`/`vendor_name` |
| BE-JD-023 | Lists evaluation attempts for the tender | GET `/api/tenders/1/evaluations` | Response is `200` with 1 evaluation attempt returned |
| BE-JD-024 | Saves a partial draft score for one criterion | PATCH scores with only the price criterion scored at 80 | Response is `200`; price row's `staff_score` is `80` and `weighted_score` is `48`; quality row's `staff_score` is still `null` |
| BE-JD-025 | Blocks submission while a criterion is still unscored | POST submit while the quality criterion is unscored | Response is `422` and `missing_criteria` includes the quality criterion id |
| BE-JD-026 | Rejects an out-of-range staff score | PATCH the quality criterion's score to `150` | Response is `400` |
| BE-JD-027 | Computes the backend-weighted PQM score once every criterion is scored | Scores quality at 90 (price already 80), then submits | Response is `200` with `status: 'scored'`, `price_score: 48`, `quality_score: 36`, `pqm_score: 84` |
| BE-JD-028 | Blocks editing scores once the evaluation is scored | PATCH scores again after the evaluation reached `scored` status | Response is `409` |
| BE-JD-029 | Management approves a scored evaluation | POST `/api/evaluations/:id/approvals` as `management` with `decision: 'approved'` | Response is `201` with `decision: 'approved'` |
| BE-JD-030 | Blocks a non-management user from logging a decision, even on an already-decided evaluation | POST approvals as `evaluator` on the evaluation just approved above | Response is `403` (role check runs before the "already decided" business rule) |
| BE-JD-031 | Blocks a non-management user from logging a decision on a still-pending evaluation | Creates and fully scores a fresh evaluation, then POSTs approvals as `evaluator` | Response is `403` |
| BE-JD-032 | Lists the approval decision history, including the manager's name | GET `/api/evaluations/:id/approvals` as `management` | Response is `200` with 1 record whose `approver_name` is `'Kai Xuan'` |
| BE-JD-033 | Requires remarks when rejecting | POST approvals with `decision: 'rejected'` and no remarks | Response is `400` |
| BE-JD-034 | Requires remarks when requesting revision | POST approvals with `decision: 'revision_requested'` and no remarks | Response is `400` |
| BE-JD-035 | Accepts revision_requested with remarks and keeps the evaluation scored | POST approvals with `decision: 'revision_requested'` and remarks provided | Response is `201` with `decision: 'revision_requested'`; the evaluation's status remains `'scored'` |
| BE-JD-036 | Rejects the evaluation with remarks | POST approvals with `decision: 'rejected'` and remarks provided | Response is `201`; the evaluation's status becomes `'rejected'` |
| BE-JD-037 | Blocks logging a decision on an evaluation that is not yet scored | Creates a fresh (`processing`) evaluation, then POSTs approvals as `management` | Response is `409` |
| BE-JD-038 | Only a rejected evaluation can be reprocessed (UC-B11) | POST `/api/evaluations/:id/reprocess` on the now-`rejected` evaluation | Response is `201` with `status: 'processing'` and `tender_id: 1`; the new attempt has a fresh unscored criterion snapshot, and the prior evaluation remains `'rejected'` |
| BE-JD-039 | Blocks reprocessing a scored (not-yet-decided) evaluation | POST reprocess on an evaluation still in `'scored'` status | Response is `409` |
| BE-JD-040 | Lists only evaluations that have gone through backend scoring | GET `/api/evaluations` as `evaluator` | Response is `200`; every returned evaluation has status `scored`, `approved`, or `rejected`, and includes the known `TC-TEST-001` tender |
| BE-JD-041 | Blocks permanently deleting a criterion referenced by evaluation_criterion_scores | DELETE `/permanent` on the price criterion, which is known to be `is_used: true`, then falls back to deactivating it | Permanent delete returns `409` with `error: 'criterion_in_use'` and a message directing the user to deactivate instead; the subsequent soft-delete (deactivate) call returns `200` with `is_active: false` |

## authSeeding.test.js

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-JD-042 | Creates the Alice Tan demo account with the expected password | Runs `seedDemoUsers` against a freshly synced database, then looks up the seeded user by email | User exists with `full_name: 'Alice Tan'`, `role: 'ma_staff'`, and its `password_hash` matches `'DevPass123!'` via `bcrypt.compare` |

## demoDataSeeding.test.js

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| BE-JD-043 | Seeds demo users, contracts, and tenders | Runs `seedDemoUsers` and `seedDemoData` together against a freshly synced database | User/contract/tender counts meet their minimums (>=3, >=2, >=13 respectively), and specific known records exist: Alice Tan user, the `CTR-PRPGTC-RR-22-001` contract containing `'Pasir Ris East'`, and tender `TC-2026-001` with vendor `'BrightBuild Pte Ltd'` |
