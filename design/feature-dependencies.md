# Feature Dependency Analysis

Cross-referenced from `README.md` (task allocation), `design/er-diagram.md`, and each member's `design/<name>/database-schema.md` + `design/<name>/api-documentation.md`. Goal: identify what blocks what across the 5 scopes, so the team can sequence work and unblock people as early as possible.

---

## Dependency Table

| Feature | Owned By | Depends On | Owned By | Type (API / DB / Auth) | Can Mock? |
|---|---|---|---|---|---|
| Tender Submission Intake; Eligibility Parsing; Document Storage | Zheng Hong | JWT auth + `users` table + RBAC roles | All (Group) | Auth | No - every write endpoint requires `created_by`/`uploaded_by` FK + role check |
| Evaluation Criteria Weight Setup; Approval Workflow | Jerrold | JWT auth + `users` table + RBAC roles (`ma_staff`, `evaluator`, `management`) | All (Group) | Auth | No - same reason as above |
| Board Paper / Deck Generation | Calista | JWT auth + `users` table | All (Group) | Auth | No |
| Pricing Deviation Detection; Clarification Drafting | Sulaiman | JWT auth + `users` table + RBAC roles | All (Group) | Auth | No |
| Strategic Rankings Dashboard | Kai Xuan | JWT auth + `users` table | All (Group) | Auth | No |
| PQM Score Calculation (AI Bid Term Extraction) | Jerrold | `tenders` table row (`evaluations.tender_id` FK) and `tenders.eligibility_status != 'rejected'` check | Zheng Hong | DB | Yes - seed a fixture `tenders` row/table early; swap to live Scope A API once ready |
| PQM Score Calculation | Jerrold | `GET /api/tenders/:id/documents` → `tender_documents.id` list passed as `document_ids` | Zheng Hong | API | Yes - hardcode fake document IDs during dev; the AI extraction call itself can be stubbed |
| Risk Matrix Generation / Review Gate; Approval Audit Trail | Jerrold | Own `evaluations` row only (`evaluation.status === 'scored'`) | Jerrold (in-scope) | DB | N/A - internal to Scope B, no cross-team block |
| Board Paper Text Generation (financial/risk sections) | Calista | `GET /api/evaluations/:id` (PQM breakdown) + `GET /api/evaluations/:id/risk-assessments` | Jerrold | API | Yes - board paper generation is read-only downstream; mock evaluation/risk JSON payloads until Scope B's endpoints are live |
| Board Paper Text Generation | Calista | `tenders` row (vendor name, tender ref) | Zheng Hong | DB | Yes - mock with fixture tender data |
| Pricing Deviation Detection | Sulaiman | Trigger fired "once Scope B's PQM scoring completes" (per Sulaiman's own API doc) | Jerrold | API (event trigger) | Yes - Sulaiman's own doc already designs the manual re-run endpoint (`POST /api/tenders/:tenderId/clarification-logs/detect-deviation`) as the fallback/mock path |
| Pricing Deviation Detection | Sulaiman | `tenders.id`, `main_offer_price`, `alternative_offer_price` | Zheng Hong | DB | Yes - fixture tender row with both offer prices |
| Re-evaluation after clarification (`POST /api/evaluations/:id/reprocess`) | Jerrold | Resolved `clarification_logs` outcome | Sulaiman | API (event trigger) | Yes - Jerrold's reprocess endpoint can be called manually/independent of Sulaiman's resolve step during dev |
| Job Adjustment Requests (material-change routing) | Sulaiman | Scope A's tender edit-lock rule (UC-A3: no edits once `under_evaluation`+) | Zheng Hong | API (business rule alignment, not a call) | Yes - Sulaiman can hardcode the "material → same approval role as tender edit" rule and adjust later |
| Clarification dispatch (`POST /api/clarification-logs/:id/send`) | Sulaiman | Vendor contact info | **Nobody yet - unassigned gap** | DB | Yes, but only until the team assigns an owner (see Flags below) |
| Dashboard KPIs / Rankings List | Kai Xuan | `evaluations` (`pqm_score`, `status`) | Jerrold | API/DB | Yes - dashboard is read-only aggregation; ship with fixture/mock JSON first, swap to live query later |
| Dashboard KPIs / Rankings List | Kai Xuan | `tenders` (status, submission_date, vendor_name) | Zheng Hong | API/DB | Yes - same as above |
| Scoring List Submit & Archive (`POST /api/dashboard/archive`) | Kai Xuan | Current `evaluations` snapshot at archive time | Jerrold | API | Yes for the endpoint shape; No for correctness - the real snapshot needs Jerrold's live scoring data before this can be trusted for a real board decision |
| `scoring_archives.archived_by` | Kai Xuan | `users.id` | All (Group) | DB (FK, type mismatch - see Flags) | N/A until type conflict resolved |

---

## Circular Dependency

**Jerrold (Scope B) ↔ Sulaiman (Scope D) form a cycle, not a one-way chain:**

1. Sulaiman's pricing-deviation detection is triggered by Jerrold's PQM scoring completing (B → D).
2. Jerrold's re-evaluation (`POST /api/evaluations/:id/reprocess`) is triggered by Sulaiman's clarification being resolved (D → B).

Neither scope can be fully "done first" - each waits on the other's live trigger to close the loop. **Recommended fix (needs team sign-off):** both sides already expose manual-trigger endpoints as their documented fallback (Sulaiman's `detect-deviation` endpoint, Jerrold's `reprocess` endpoint) - build and test each scope independently against manual triggers first, and only wire the automatic chained triggers (evaluation → auto-detect deviation; clarification resolved → auto-reprocess) as a final integration step once both sides are stable. Don't let one block the other's initial build.

> **RESOLVED (this pass):** `design/jerrold/database-schema.md`, `design/jerrold/use-cases.md` (UC-B11), `design/sulaiman/database-schema.md`, and `design/sulaiman/use-cases.md` (UC-D1) now explicitly document both triggers as manual, evaluator/staff-initiated actions for initial build - not automatic listeners. Wiring the automatic chained versions remains a deliberate, later integration step per the recommendation above.

---

## Shared Core Items Needing Whole-Team Agreement Before Coding

1. **`users` table** - the base shared table every scope FKs against (`created_by`, `evaluated_by`, `approver_id`, `reviewed_by`, `escalated_by`, `resolved_by`, `requested_by`, `archived_by`, etc.). Column name is `id` (INTEGER, autoincrement) per `design/er-diagram.md` and every scope except Kai Xuan's. **Must be locked (type, column name, role enum) before any scope starts writing migrations that FK against it.**

2. **PK/FK naming mismatch - Calista's schema.** `design/calista/database-schema.md` defines `board_papers.tender_id → tenders.tender_id` and `created_by → users.user_id`. Zheng Hong's actual columns are `tenders.id` and `users.id` (matches the group ER diagram). As written, Calista's FK doesn't resolve against Scope A's real schema - needs a one-line fix, but must be caught before migrations are written, not after.
   > **RESOLVED (this pass):** `design/calista/database-schema.md` and `design/calista/api-documentation.md` now point to `tenders.id` / `users.id`.

3. **PK type mismatch - Kai Xuan's schema.** `scoring_archives.id` is `UUID` and `archived_by` is `UUID`, while every other table in the system (including `users.id`) is `INTEGER` autoincrement. A `UUID` column cannot cleanly FK against an `INTEGER` `users.id`. Either Kai Xuan's table switches to `INTEGER`, or the whole team agrees to move `users.id` to UUID (much bigger change, affects all 5 scopes' JWT `sub` claims and all FKs) - this needs an explicit decision, not an assumption.
   > **PARTIALLY RESOLVED (this pass):** `scoring_archives.archived_by` (the actual FK to `users.id`) is now `INTEGER`. `scoring_archives.id` itself is left as `UUID` since no other scope FKs against it - flag for the team only if a future feature needs to reference an archive row from another table.

4. **Does Board Paper generation source from `tenders` or `evaluations`?** `design/er-diagram.md` models `BOARD_PAPERS` as sourced from `EVALUATIONS` (i.e., only approved evaluation data should flow into a board paper, matching the workflow in `problem-statement.md`: Approve → Report). Calista's actual schema/API instead FKs `board_papers` straight to `tender_id` and generates directly from a `tenderId`, bypassing `evaluations` entirely. If board papers can be generated before an evaluation is approved, that breaks the intended human-review gate. Needs explicit team decision: should `POST /api/boardpapers` require an `evaluation_id` (and check `status: 'approved'`) instead of a raw `tenderId`?

5. **Vendor contact information has no owner.** Sulaiman's schema flags this gap directly: dispatching a clarification requires vendor contact info that doesn't exist on any table yet. Likely candidate: a `vendor_contacts` table or new fields on Zheng Hong's `tenders`. Needs an owner assigned before Sulaiman's send-clarification flow (UC-D4) can be fully implemented (it can still be mocked/stubbed until then).

6. **Kai Xuan's dashboard references a `Vendors` table** in its schema note that doesn't exist anywhere in `design/er-diagram.md` or any other scope's schema (`vendor_name` is a plain string field on `tenders`, not its own table). Needs clarifying with Kai Xuan before dashboard queries are built against a table that was never designed.

7. **New tables not yet in the shared ER diagram.** Both Zheng Hong (`eligibility_checks`, `bca_grade_limits`, `eligibility_thresholds`) and Sulaiman (`clarification_messages`, `clarification_attachments`, `job_adjustment_requests`) have flagged in their own docs that they added tables beyond `design/er-diagram.md`. The shared ER diagram should be updated in one pass so it stays the single source of truth - do this alongside item 1, before migrations are written.

---

## Suggested Build Order

**Phase 0 - Team agreement (no code yet):** Resolve the 7 items above as a group - lock `users` schema/role enum/JWT shape, fix Calista's FK column names, decide Kai Xuan's PK type, decide board-paper source (`evaluation_id` vs `tender_id`), assign an owner for vendor contact info, correct the `Vendors` reference, and update the shared ER diagram with the new tables everyone has already added.

**Phase 1 - Foundation (blocks everyone, build first):**
- Group: `users` table, JWT auth middleware, RBAC guards, seeders for demo users.
- Zheng Hong: `tenders`, `tender_documents` (other scopes FK against these next).

**Phase 2 - Parallel, unblocked via mocks:**
- Zheng Hong: eligibility tables/endpoints (in-scope, no blockers left).
- Jerrold: `evaluation_criteria`, `evaluations` - mock `tenders` rows via fixtures/seed data until Zheng Hong's live API lands.
- Sulaiman: `clarification_logs` core CRUD - mock `tenders` rows the same way; build the manual `detect-deviation` trigger first (don't wait on Jerrold's live PQM completion event).

**Phase 3 - Second layer (needs Phase 2 output, still parallelizable):**
- Jerrold: `risk_assessments`, `approvals` (in-scope, depends only on own `evaluations`).
- Calista: `board_papers`/`proposals` - mock Jerrold's evaluation/risk JSON payloads; swap to live once Phase 3 Jerrold work lands.
- Kai Xuan: dashboard KPIs/rankings - mock Jerrold's `evaluations` and Zheng Hong's `tenders` data; swap to live queries once available.

**Phase 4 - Integration:**
- Sulaiman: `job_adjustment_requests` and follow-up notifications (needs the Scope A edit-lock rule agreed in Phase 0).
- Wire the real automatic B ↔ D triggers (evaluation-scored → auto-detect deviation; clarification-resolved → auto-reprocess) only after both sides are independently stable - this is the last thing to connect, not the first.
- Kai Xuan: `POST /api/dashboard/archive` against real evaluation snapshots (only trustworthy once Jerrold's scoring is live, not mocked).
