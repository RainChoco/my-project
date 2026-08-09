# Test Cases - Jerrold (Frontend)

## EvaluationDetailPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-JD-001 | Evaluator scores every criterion and submits the evaluation | Renders the page as an `evaluator` role with a processing evaluation containing two unscored criteria (Price, Quality), fills both score inputs (80, 90), and clicks "Submit evaluation" | `saveDraftScores` is called with both criteria's staff scores, `submitEvaluation` is called with the evaluation id, and the page shows "Submitted - PQM score 84." |
| FE-JD-002 | Save a draft without scoring every criterion | As an evaluator, only the first (Price) score input is filled before clicking "Save draft" | `saveDraftScores` is called and "Draft scores saved." is shown, while `submitEvaluation` is never called |
| FE-JD-003 | Client-side block on submitting with an unscored criterion | Evaluator fills only the Price score, leaves Quality empty, and clicks "Submit evaluation" | The page shows "Still need a score for: Quality." and `submitEvaluation` is never called |
| FE-JD-004 | Read-only scores table when scoring is not permitted | Renders the page as a `management` role viewing an evaluation already in `scored` status | No spinbutton score inputs are rendered and the "Submit evaluation" button is not present |
| FE-JD-005 | Evaluator re-evaluates a rejected evaluation | Evaluator views a `rejected` evaluation, clicks "Re-evaluate", and confirms the "Re-evaluate this tender?" dialog | `reprocessEvaluation` is called with the evaluation id |
| FE-JD-006 | Re-evaluate option hidden for a non-evaluator role | Renders a `rejected` evaluation for a `management` role user | The "Re-evaluate" button is not present in the document |

## ApprovalHistoryPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-JD-007 | Decision controls hidden for a non-management role | Renders a `scored` evaluation for an `evaluator` role | "Approve Evaluation" and "Reject Evaluation" buttons are not present |
| FE-JD-008 | Decision controls shown for a management role | Renders the same `scored` evaluation for a `management` role | "Approve Evaluation" and "Reject Evaluation" buttons are both visible |
| FE-JD-009 | Manager approves a scored evaluation | Management user clicks "Approve Evaluation" and confirms the "Approve this evaluation?" dialog | `createApproval` is called with `{ decision: 'approved', remarks: undefined }`, and "Evaluation approved successfully." is shown |
| FE-JD-010 | Reject requires remarks before it can proceed | Management user clicks "Reject Evaluation" with no remarks entered, then fills "Manager Remarks" and confirms | Validation message "Please provide a reason for rejecting this evaluation." shows first and `createApproval` is not called until remarks are entered; it is then called with `{ decision: 'rejected', remarks: 'Pricing needs clarification' }` |
| FE-JD-011 | Render the approval decision history | `fetchApprovals` returns one approved record with approver name and remarks | Approver name "Kai Xuan", the "Approved" label, and remarks text "Looks good" are all rendered |
| FE-JD-012 | Decision form hidden once a decision has been made | Evaluation status is `approved` for a `management` role | "Decision Completed - see Decision history above." is shown, and Approve/Reject buttons are absent |

## PendingApprovalsPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-JD-013 | List pending evaluations with summary counts | Mocks two completed evaluations (one `scored`, one `approved`) plus tender/evaluator detail lookups | The pending evaluation (TC-1, Vendor A, Contract A, "Evaluator #7") renders, "Pending Approvals" appears at least twice (heading + stat card), and the already-approved TC-2 is excluded from the list |
| FE-JD-014 | Filter the pending list by search term | Types a non-matching vendor name into the search input | TC-1 disappears from the list and "No pending approvals match your search." is shown |
| FE-JD-015 | Navigate to the approval page when Review is clicked | Clicks the "Review" button on the pending evaluation row | The mocked `useNavigate` is called with `/evaluations/1/approval` |

## EvaluationCriteriaPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-JD-016 | Render the criteria table and summary cards | `fetchCriteria` returns two active criteria (Price 60%, Quality 40%) totalling 100% weight | Both criteria names render, "Total Criteria" and "100%" summary values show, and "Ready for Evaluation" status is displayed |
| FE-JD-017 | Show "Not Ready" when active weights are below 100% | `fetchCriteria` returns a single active criterion with `active_weight_total: 60` | "Not Ready" status text is rendered |
| FE-JD-018 | Create a new criterion from a quick-add suggestion | No active criteria exist so template suggestions render; user clicks "Use this" on the Price Competitiveness suggestion, sets weight to 60, and saves | `createCriterion` is called with `{ criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60 }`, success message `"Price Competitiveness" was added.` shows, and the add-criterion form closes |
| FE-JD-019 | Prompt to reuse an existing criterion on duplicate creation | `createCriterion` rejects with a `duplicate_criterion_name` API error while creating from a quick-add suggestion | "Criterion already exists" message and detail text referencing the existing 'Price Competitiveness' criterion are shown |
| FE-JD-020 | Deactivate an active criterion after confirmation | Clicks "Deactivate" on a criterion row and confirms the "Deactivate ... ?" dialog | `deactivateCriterion` is called with criterion id 1 and "Criterion deactivated." success message is shown |
| FE-JD-021 | Block permanent deletion in the UI for an in-use criterion | Renders a criterion row where `is_used: true` | The "Delete" button in that row is disabled |
| FE-JD-022 | Permanently delete an unused criterion after confirmation | Clicks "Delete" on an unused criterion row and confirms the "Delete criterion?" dialog | `deleteCriterionPermanently` is called with criterion id 2 and `"Technical Quality" was permanently deleted.` message is shown |

## EvaluationsPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-JD-023 | Continue an in-progress evaluation for the selected tender | Tender has an existing `processing` evaluation; user clicks "Continue Evaluation" | The scoring workspace shows "Tender Evaluation" heading, and the prior attempt row (#10) shows "Evaluator #5" |
| FE-JD-024 | Create a new evaluation once readiness checks pass | Evaluator role, no existing evaluations for the tender, and criteria weight totals 100%; clicks "Create Evaluation" and confirms the dialog | `createEvaluationFromTender` is called with tender id `1` and "Evaluation created successfully." is shown |
| FE-JD-025 | Disable evaluation creation for a role that cannot create evaluations | `management` role viewing a tender with no existing evaluations | "Create Evaluation" button is disabled and "Only evaluators can create an evaluation." text is shown |
| FE-JD-026 | Render the completed evaluations comparison table | `fetchCompletedEvaluations` returns one `approved` evaluation with a PQM score of 80 | "TC-2 - Vendor B" label and the score "80" are rendered in the comparison table |
