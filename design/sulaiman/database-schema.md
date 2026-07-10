# Database Schema - Sulaiman (Scope D: Alternate Proposal Communication System)

## Description
Covers the tables who are only owned by this scope (use-cases UC-D1 to UC-D9)

## Table: `clarification_logs`

Header row per clarification / notification thread. One row covers the full lifecycle from AI-flagged deviation through resolution (UC-D1, UC-D3, UC-D4, UC-D9). Individual messages (drafts, sent notices, reminders, vendor replies) live in `clarification_messages`, not on this row, so the full thread can be displayed and resent without overwriting history (UC-D6, UC-D8).

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| tender_id | `DataTypes.INTEGER` | **FK → `tenders.id`** (external, see below), `allowNull: false`, `onDelete: 'CASCADE'` |
| log_type | `DataTypes.ENUM('pricing_deviation','job_adjustment_notification')` | `allowNull: false`, `defaultValue: 'pricing_deviation'` - distinguishes the original UC-D1 pricing clarification from a UC-D7 job-adjustment follow-up notification, since both reuse this same table and review-before-send gate |
| status | `DataTypes.ENUM('flagged','no_action_required','draft_ready','approved','sent','responded','escalated','resolved')` | `allowNull: false`, `defaultValue: 'flagged'` |
| main_offer_price_snapshot | `DataTypes.DECIMAL(14,2)` | `allowNull: true` - snapshot of `tenders.main_offer_price` at detection time, kept even if the tender's price is later revised |
| alternative_offer_price_snapshot | `DataTypes.DECIMAL(14,2)` | `allowNull: true` |
| deviation_amount | `DataTypes.DECIMAL(14,2)` | `allowNull: true` |
| deviation_percentage | `DataTypes.DECIMAL(5,2)` | `allowNull: true` |
| ai_rationale | `DataTypes.TEXT` | `allowNull: true` - short AI-generated explanation of the computed deviation (UC-D1) |
| follow_up_due_at | `DataTypes.DATEONLY` | `allowNull: true` - configured follow-up window deadline used to surface overdue `sent` logs (UC-D8) |
| responded_at | `DataTypes.DATE` | `allowNull: true` |
| response_notes | `DataTypes.TEXT` | `allowNull: true` - vendor's confirmation, revised offer, or justification as logged by staff (UC-D5) |
| outcome_notes | `DataTypes.TEXT` | `allowNull: true` - required (enforced in application logic) before `status` can move to `'resolved'` (UC-D9) |
| resolved_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` |
| resolved_at | `DataTypes.DATE` | `allowNull: true` |
| created_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |
| updated_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

## Table: `clarification_messages`

Append-only thread of every message tied to a `clarification_logs` row - AI drafts, the staff-approved and dispatched message, resend reminders, and logged vendor replies. Kept separate from the header row so a resend (UC-D8) adds a new entry instead of overwriting the original send.

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
| tender_id | `DataTypes.INTEGER` | **FK → `tenders.id`** (external, see below), `allowNull: false` - direct tender-level link kept for audit even though it's reachable via the clarification log |
| description | `DataTypes.TEXT` | `allowNull: false` |
| justification | `DataTypes.TEXT` | `allowNull: false` |
| approval_status | `DataTypes.ENUM('pending_approval','approved','rejected')` | `allowNull: false`, `defaultValue: 'pending_approval'` - when the adjustment materially changes price/scope mid-evaluation, this must be routed through the same approval roles as a tender edit (Scope A's UC-A3 restriction) rather than accepted silently |
| follow_up_clarification_log_id | `DataTypes.INTEGER` | **FK → `clarification_logs.id`**, `allowNull: true` - the `job_adjustment_notification`-type log created to confirm the adjustment terms back to the vendor, reusing the review-before-send gate (UC-D3, UC-D4) |
| requested_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: false` |
| approved_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` |
| approved_at | `DataTypes.DATE` | `allowNull: true` |
| created_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |
| updated_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

## Sequelize Associations

```js
// clarification_logs
ClarificationLog.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
ClarificationLog.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolvedByUser' });
ClarificationLog.hasMany(ClarificationMessage, { foreignKey: 'clarification_log_id', as: 'messages', onDelete: 'CASCADE' });
ClarificationLog.hasMany(JobAdjustmentRequest, { foreignKey: 'clarification_log_id', as: 'jobAdjustmentRequests', onDelete: 'CASCADE' });

// clarification_messages
ClarificationMessage.belongsTo(ClarificationLog, { foreignKey: 'clarification_log_id', as: 'clarificationLog' });
ClarificationMessage.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
ClarificationMessage.belongsTo(User, { foreignKey: 'created_by', as: 'author' });
ClarificationMessage.hasMany(ClarificationAttachment, { foreignKey: 'clarification_message_id', as: 'attachments', onDelete: 'CASCADE' });

// clarification_attachments
ClarificationAttachment.belongsTo(ClarificationMessage, { foreignKey: 'clarification_message_id', as: 'message' });

// job_adjustment_requests
JobAdjustmentRequest.belongsTo(ClarificationLog, { foreignKey: 'clarification_log_id', as: 'clarificationLog' });
JobAdjustmentRequest.belongsTo(ClarificationLog, { foreignKey: 'follow_up_clarification_log_id', as: 'followUpNotification' });
JobAdjustmentRequest.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
JobAdjustmentRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
JobAdjustmentRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
```

## External Foreign Key References Needed

These tables are **not owned by this scope** - listed here only so the owning teammate knows what shape is depended on.

| Referenced Table | Field Needed | Owner | Used By |
|---|---|---|---|
| `tenders` | `id` (`DataTypes.INTEGER`, PK), `main_offer_price` (`DataTypes.DECIMAL(14,2)`), `alternative_offer_price` (`DataTypes.DECIMAL(14,2)`, nullable) | Zheng Hong (Scope A) | `clarification_logs.tender_id`; `main_offer_price`/`alternative_offer_price` are read (not FK'd) to compute the deviation snapshot; `job_adjustment_requests.tender_id` |
| `users` | `id` (`DataTypes.INTEGER`, PK) | Shared / Auth infra (group) | `clarification_logs.resolved_by`, `clarification_messages.approved_by`, `clarification_messages.created_by`, `job_adjustment_requests.requested_by`, `job_adjustment_requests.approved_by` |


## Notes
The schema doesn’t specify vendor contact info anywhere yet, but UC-D4’s edge case requires blocking dispatch when “the vendor has no contact information on file.” This scope assumes vendor contact info will be on a table owned by another scope (most likely alongside `tenders.vendor_name` in Zheng Hong's Scope A tables) - raise this gap with the team so a `vendor_contacts`-shaped table (or fields on `tenders`) gets defined and this doc can reference its FK.

Adds 3 tables (clarification_messages, clarification_attachments, job_adjustment_requests) on top of the one table (clarification_requests) implied by the shared design/er-diagram.md. That file is an artifact maintained by the group so hasn't been updated here - please raise these additions with the team so the shared ER diagram and Mermaid export are in sync with the schema for this scope