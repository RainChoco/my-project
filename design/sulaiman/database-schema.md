# Database Schema - Sulaiman (Scope D: Alternate Proposal Communication System)

## Description
Covers the tables who are only owned by this scope (use-cases UC-D1 to UC-D9)

## Table: `clarification_logs`

Header row per clarification / notification thread. One row covers the full lifecycle from AI-flagged deviation through resolution (UC-D1, UC-D3, UC-D4, UC-D9). Individual messages (drafts, sent notices, reminders, vendor replies) live in `clarification_messages`, not on this row, so the full thread can be displayed and resent without overwriting history (UC-D6, UC-D8).

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| tender_id | `DataTypes.INTEGER` | **FK → `tenders.id`** (external, see below), `allowNull: false`, `onDelete: 'RESTRICT'` - changed from `CASCADE`: deleting a tender must not silently wipe the audit trail of clarifications/notifications sent about it |
| log_type | `DataTypes.ENUM('pricing_deviation','job_adjustment_notification')` | `allowNull: false`, `defaultValue: 'pricing_deviation'` - distinguishes the original UC-D1 pricing clarification from a UC-D7 job-adjustment follow-up notification, since both reuse this same table and review-before-send gate. See "Status applicability by `log_type`" below - not every status/field combination is valid for both types |
| status | `DataTypes.ENUM('flagged','no_action_required','draft_ready','approved','sent','responded','escalated','resolved')` | `allowNull: false`, `defaultValue: 'flagged'` |
| main_offer_price_snapshot | `DataTypes.DECIMAL(14,2)` | `allowNull: true` - snapshot of `tenders.main_offer_price` at detection time, kept even if the tender's price is later revised. Only populated when `log_type = 'pricing_deviation'` |
| alternative_offer_price_snapshot | `DataTypes.DECIMAL(14,2)` | `allowNull: true` |
| deviation_amount | `DataTypes.DECIMAL(14,2)` | `allowNull: true` |
| deviation_percentage | `DataTypes.DECIMAL(6,2)` | `allowNull: true` - widened from `DECIMAL(5,2)` to avoid overflow on a pathological low-base-price deviation |
| ai_rationale | `DataTypes.TEXT` | `allowNull: true` - short AI-generated explanation of the computed deviation (UC-D1) |
| follow_up_due_at | `DataTypes.DATEONLY` | `allowNull: true` - configured follow-up window deadline used to surface overdue `sent` logs (UC-D8) |
| escalated_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` - MA procurement staff notified when `status` moves to `'escalated'` (UC-D8). Previously missing, unlike the actor/timestamp pair recorded for every other terminal-ish transition |
| escalated_at | `DataTypes.DATE` | `allowNull: true` |
| responded_at | `DataTypes.DATE` | `allowNull: true` |
| response_notes | `DataTypes.TEXT` | `allowNull: true` - vendor's confirmation, revised offer, or justification as logged by staff (UC-D5) |
| outcome_notes | `DataTypes.TEXT` | `allowNull: true` - required before `status` can move to `'resolved'` (UC-D9); enforced by a DB-level `CHECK` (see Constraints below), not application logic alone |
| resolved_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` |
| resolved_at | `DataTypes.DATE` | `allowNull: true` |
| created_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |
| updated_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

### Constraints

- `CHECK (status <> 'resolved' OR outcome_notes IS NOT NULL)` - a resolution must always carry a documented outcome (UC-D9); enforced at the database layer instead of relying solely on application code.
- Partial unique index: `UNIQUE (tender_id) WHERE log_type = 'pricing_deviation' AND status NOT IN ('resolved', 'no_action_required')` - prevents a second active pricing-deviation clarification being opened on the same tender while one is already in flight (e.g. if Scope B's evaluation is rerun and UC-D1 fires again).

### Status applicability by `log_type`

- **`pricing_deviation`**: full range `flagged → (no_action_required | draft_ready) → approved → sent → (responded | escalated) → resolved`, using the deviation snapshot fields, `ai_rationale`, `follow_up_due_at`, and `escalated_*`.
- **`job_adjustment_notification`**: skips detection entirely - created directly at `draft_ready` and only ever moves `draft_ready → approved → sent → responded → resolved`. The deviation snapshot fields, `ai_rationale`, `follow_up_due_at`, and `escalated_*` are left `null` for these rows.

## Table: `clarification_messages`

Append-only thread of every message tied to a `clarification_logs` row - AI drafts, the staff-approved and dispatched message, resend reminders, and logged vendor replies. Kept separate from the header row so a resend (UC-D8) adds a new entry instead of overwriting the original send.

Rows are never mutated after creation: approving a draft only stamps `approved_by`/`approved_at` onto that same `'draft'` row; dispatching it inserts a **new** `'sent'` row (linked back via `source_draft_id`) rather than flipping the draft's `message_type` in place. This keeps the exact wording that was approved on the historical record, separate from what was actually sent.

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| clarification_log_id | `DataTypes.INTEGER` | **FK → `clarification_logs.id`**, `allowNull: false`, `onDelete: 'CASCADE'` |
| message_type | `DataTypes.ENUM('draft','sent','reminder','vendor_response')` | `allowNull: false` |
| subject | `DataTypes.STRING` | `allowNull: true` (a logged vendor response may not have a subject) |
| body | `DataTypes.TEXT` | `allowNull: false` |
| ai_generated | `DataTypes.BOOLEAN` | `allowNull: false`, `defaultValue: false` - true for AI auto-drafts (UC-D2) before staff edits are saved |
| approved_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` - set when staff approves this message pre-dispatch (UC-D3) |
| approved_at | `DataTypes.DATE` | `allowNull: true` |
| sent_at | `DataTypes.DATE` | `allowNull: true` - set only for `message_type` `'sent'` or `'reminder'` |
| dispatch_channel | `DataTypes.ENUM('email','manual')` | `allowNull: true` - set only for `'sent'`/`'reminder'` rows; records whether the system emailed the vendor or staff logged an out-of-system dispatch (UC-D4) |
| source_draft_id | `DataTypes.INTEGER` | **FK → `clarification_messages.id`** (self-referencing), `allowNull: true` - for `'sent'`/`'reminder'` rows, points back to the `'draft'` row that was approved, keeping the draft itself untouched as its own audit record |
| created_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: false` - staff who drafted, approved-and-sent, or logged this entry |
| created_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

## Table: `clarification_attachments`

Supporting documents a vendor liaison attaches when logging a vendor's response (UC-D5). Mirrors the Cloudinary field pattern used elsewhere in the project.

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| clarification_message_id | `DataTypes.INTEGER` | **FK → `clarification_messages.id`**, `allowNull: false`, `onDelete: 'CASCADE'` |
| original_filename | `DataTypes.STRING` | `allowNull: false` |
| cloudinary_public_id | `DataTypes.STRING` | `allowNull: false` - required to delete/replace/transform the asset via the Cloudinary API |
| file_url | `DataTypes.STRING` | `allowNull: false` (Cloudinary `secure_url`) |
| resource_type | `DataTypes.ENUM('image','raw')` | `allowNull: false`, `defaultValue: 'raw'` |
| format | `DataTypes.STRING` | `allowNull: true` (e.g. `pdf`, `docx`, `png`) |
| file_size_bytes | `DataTypes.INTEGER` | `allowNull: false` |
| uploaded_at | `DataTypes.DATE` | `allowNull: false`, `defaultValue: DataTypes.NOW` |

## Table: `job_adjustment_requests`

A scope/timeline/terms change implied by a vendor's response, logged and routed for approval separately from the pricing clarification itself (UC-D7).

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| clarification_log_id | `DataTypes.INTEGER` | **FK → `clarification_logs.id`**, `allowNull: false`, `onDelete: 'CASCADE'` - the clarification whose vendor response prompted this request |
| source_message_id | `DataTypes.INTEGER` | **FK → `clarification_messages.id`**, `allowNull: true` - the specific `'vendor_response'` message that prompted this request; `clarification_log_id` alone can't disambiguate this if the log accumulates more than one vendor reply over time |
| tender_id | `DataTypes.INTEGER` | **FK → `tenders.id`** (external, see below), `allowNull: false`, `onDelete: 'RESTRICT'` - direct tender-level link kept for audit even though it's reachable via the clarification log |
| description | `DataTypes.TEXT` | `allowNull: false` |
| justification | `DataTypes.TEXT` | `allowNull: false` |
| is_material | `DataTypes.BOOLEAN` | `allowNull: false`, `defaultValue: false` - true when the change affects price/scope mid-evaluation; only material requests must be routed through the same approval roles as a tender edit (Scope A's UC-A3 restriction, per UC-D7's edge case) |
| approval_status | `DataTypes.ENUM('pending_approval','approved','rejected')` | `allowNull: false`, `defaultValue: 'pending_approval'` - for non-material requests the application may set this straight to `'approved'`; material ones must go through actual sign-off |
| follow_up_clarification_log_id | `DataTypes.INTEGER` | **FK → `clarification_logs.id`**, `allowNull: true`, `unique: true` - the `job_adjustment_notification`-type log created to confirm the adjustment terms back to the vendor, reusing the review-before-send gate (UC-D3, UC-D4); unique so two requests can't share the same follow-up log |
| requested_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: false` |
| approved_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` |
| approved_at | `DataTypes.DATE` | `allowNull: true` |
| created_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |
| updated_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

## Sequelize Associations

```js
// clarification_logs
ClarificationLog.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
ClarificationLog.belongsTo(User, { foreignKey: 'escalated_by', as: 'escalatedByUser' });
ClarificationLog.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolvedByUser' });
ClarificationLog.hasMany(ClarificationMessage, { foreignKey: 'clarification_log_id', as: 'messages', onDelete: 'CASCADE' });
ClarificationLog.hasMany(JobAdjustmentRequest, { foreignKey: 'clarification_log_id', as: 'jobAdjustmentRequests', onDelete: 'CASCADE' });

// clarification_messages
ClarificationMessage.belongsTo(ClarificationLog, { foreignKey: 'clarification_log_id', as: 'clarificationLog' });
ClarificationMessage.belongsTo(ClarificationMessage, { foreignKey: 'source_draft_id', as: 'sourceDraft' });
ClarificationMessage.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
ClarificationMessage.belongsTo(User, { foreignKey: 'created_by', as: 'author' });
ClarificationMessage.hasMany(ClarificationAttachment, { foreignKey: 'clarification_message_id', as: 'attachments', onDelete: 'CASCADE' });

// clarification_attachments
ClarificationAttachment.belongsTo(ClarificationMessage, { foreignKey: 'clarification_message_id', as: 'message' });

// job_adjustment_requests
JobAdjustmentRequest.belongsTo(ClarificationLog, { foreignKey: 'clarification_log_id', as: 'clarificationLog' });
JobAdjustmentRequest.belongsTo(ClarificationLog, { foreignKey: 'follow_up_clarification_log_id', as: 'followUpNotification' });
JobAdjustmentRequest.belongsTo(ClarificationMessage, { foreignKey: 'source_message_id', as: 'sourceMessage' });
JobAdjustmentRequest.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
JobAdjustmentRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
JobAdjustmentRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
```

## External Foreign Key References Needed

These tables are **not owned by this scope** - listed here only so the owning teammate knows what shape is depended on.

| Referenced Table | Field Needed | Owner | Used By |
|---|---|---|---|
| `tenders` | `id` (`DataTypes.INTEGER`, PK), `main_offer_price` (`DataTypes.DECIMAL(14,2)`), `alternative_offer_price` (`DataTypes.DECIMAL(14,2)`, nullable) | Zheng Hong (Scope A) | `clarification_logs.tender_id`; `main_offer_price`/`alternative_offer_price` are read (not FK'd) to compute the deviation snapshot; `job_adjustment_requests.tender_id` |
| `users` | `id` (`DataTypes.INTEGER`, PK) | Shared / Auth infra (group) | `clarification_logs.escalated_by`, `clarification_logs.resolved_by`, `clarification_messages.approved_by`, `clarification_messages.created_by`, `job_adjustment_requests.requested_by`, `job_adjustment_requests.approved_by` |


## Trigger Sequencing Note (Scope D ↔ Scope B)

`clarification_logs` creation (UC-D1) is documented in `design/sulaiman/api-documentation.md` as `POST /api/tenders/:tenderId/clarification-logs/detect-deviation` - a **manually-invoked endpoint**, not an automatic listener on Scope B's PQM scoring completing. This is intentional: Scope B's re-evaluation (`POST /api/evaluations/:id/reprocess`) is itself triggered by a Scope D clarification being resolved, so an automatic trigger in both directions would create a circular build dependency (see `design/feature-dependencies.md`, "Circular Dependency"). Build and test deviation detection against the manual endpoint first (MA staff clicks "Check for Pricing Deviation" once a tender is scored); only wire an automatic trigger off Scope B's `evaluations.status: 'scored'` event (if the team decides to add one later) once both scopes are independently stable.

## Notes
The schema doesn’t specify vendor contact info anywhere yet, but UC-D4’s edge case requires blocking dispatch when “the vendor has no contact information on file.” This scope assumes vendor contact info will be on a table owned by another scope (most likely alongside `tenders.vendor_name` in Zheng Hong's Scope A tables) - raise this gap with the team so a `vendor_contacts`-shaped table (or fields on `tenders`) gets defined and this doc can reference its FK.

Adds 3 tables (clarification_messages, clarification_attachments, job_adjustment_requests) on top of the one table (clarification_requests) implied by the shared design/er-diagram.md. That file is an artifact maintained by the group so hasn't been updated here - please raise these additions with the team so the shared ER diagram and Mermaid export are in sync with the schema for this scope