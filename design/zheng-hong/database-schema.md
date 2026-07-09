# Database Schema - Zheng Hong (Scope A: Tender Document Receiving & CRUD)

Covers only the tables owned by this scope. External foreign keys this scope depends on are called out at the bottom - those tables are owned by teammates and are not redefined here.

## Gap Review: Does the Previous Schema Handle This?

**Cloudinary document uploads** - partially. `tender_documents.file_url` stored the file's secure URL, but nothing else. That's not enough to manage the asset later (delete/replace/re-transform it needs the Cloudinary `public_id`), and it didn't distinguish file type/size, or keep history if a vendor re-submits a corrected document. Fixed by adding `cloudinary_public_id`, `resource_type`, `format`, `file_size_bytes`, and a `version`/`is_latest` pair so old uploads stay auditable instead of being overwritten.

**Complex financial metrics / BCA criteria scoring limits** - no, this was missing entirely. The old schema only stored raw declared values (`paid_up_capital`, `bca_fm01_license_no`) plus a single `eligibility_status` enum and a free-text `ai_eligibility_notes` JSONB blob - there was no BCA grade, no tender-value ceiling for that grade, no configurable minimum-capital threshold, and no per-criterion pass/fail record. That meant eligibility was effectively an AI opinion with no auditable math behind it - the same risk the team already flagged for PQM scoring (`problem-statement.md`: *"LLMs are unreliable at precise arithmetic... computes the score deterministically in the backend"*). Fixed by applying the same pattern here:
- AI only **extracts** raw values (capital amount, BCA grade, license number) - it does not decide pass/fail.
- Two new reference tables (`bca_grade_limits`, `eligibility_thresholds`) hold the actual scoring limits as configurable data, not hardcoded logic.
- A new `eligibility_checks` table stores the backend's deterministic comparison of extracted value vs. threshold, per criterion, with the threshold value snapshotted at check time for audit purposes.
- `tenders.eligibility_status` becomes a derived summary field the backend computes from `eligibility_checks`, not a field the AI sets directly.

## Table: `tenders`

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| tender_ref_no | `DataTypes.STRING` | `allowNull: false`, `unique: true` |
| vendor_name | `DataTypes.STRING` | `allowNull: false` |
| submission_date | `DataTypes.DATEONLY` | `allowNull: false` |
| main_offer_price | `DataTypes.DECIMAL(14,2)` | `allowNull: false` |
| alternative_offer_price | `DataTypes.DECIMAL(14,2)` | `allowNull: true` (not every vendor submits an alternative offer) |
| paid_up_capital | `DataTypes.DECIMAL(14,2)` | `allowNull: true` - raw value AI-extracted from submitted financials |
| bca_fm01_license_no | `DataTypes.STRING` | `allowNull: true` |
| bca_fm01_grade | `DataTypes.ENUM('L1','L2','L3','L4','L5','L6')` | `allowNull: true` - raw value AI-extracted from the license document |
| non_debarment_declared | `DataTypes.BOOLEAN` | `allowNull: false`, `defaultValue: false` |
| eligibility_status | `DataTypes.ENUM('pending','eligible','flagged','rejected')` | `allowNull: false`, `defaultValue: 'pending'` - **derived**: backend recomputes this from `eligibility_checks`, never set directly by AI |
| ai_eligibility_summary | `DataTypes.TEXT` | `allowNull: true` - human-readable AI explanation only; structured pass/fail data lives in `eligibility_checks` |
| status | `DataTypes.ENUM('draft','submitted','under_evaluation','approved','rejected','withdrawn')` | `allowNull: false`, `defaultValue: 'draft'` |
| created_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: false` |
| created_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |
| updated_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

> Changed from the previous version: `ai_eligibility_notes JSONB` renamed to `ai_eligibility_summary TEXT` (narrative only); structured numeric checks moved out to `eligibility_checks`. Money fields widened from `DECIMAL(12,2)` to `DECIMAL(14,2)` to comfortably hold town-council-scale contract values. Added `bca_fm01_grade`.

## Table: `tender_documents`

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| tender_id | `DataTypes.INTEGER` | **FK → `tenders.id`**, `allowNull: false`, `onDelete: 'CASCADE'` |
| file_type | `DataTypes.ENUM('main_offer','alternative_offer','license','other')` | `allowNull: false` |
| original_filename | `DataTypes.STRING` | `allowNull: false` |
| cloudinary_public_id | `DataTypes.STRING` | `allowNull: false` - required to delete/replace/transform the asset via the Cloudinary API |
| file_url | `DataTypes.STRING` | `allowNull: false` (Cloudinary `secure_url`) |
| resource_type | `DataTypes.ENUM('image','raw')` | `allowNull: false`, `defaultValue: 'raw'` - most tender docs are PDF/DOCX, not images |
| format | `DataTypes.STRING` | `allowNull: true` (e.g. `pdf`, `docx`, `png`) |
| file_size_bytes | `DataTypes.INTEGER` | `allowNull: false` |
| version | `DataTypes.INTEGER` | `allowNull: false`, `defaultValue: 1` |
| is_latest | `DataTypes.BOOLEAN` | `allowNull: false`, `defaultValue: true` - old versions kept (not deleted) when a vendor re-submits a corrected file, for compliance audit |
| uploaded_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: false` |
| uploaded_at | `DataTypes.DATE` | `allowNull: false`, `defaultValue: DataTypes.NOW` |

> Changed from the previous version: added `cloudinary_public_id`, `resource_type`, `format`, `file_size_bytes`, `version`, `is_latest`.

## Table: `eligibility_checks` (new)

One row per eligibility criterion evaluated for a tender - the deterministic, auditable result the backend computes after AI extraction.

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| tender_id | `DataTypes.INTEGER` | **FK → `tenders.id`**, `allowNull: false`, `onDelete: 'CASCADE'` |
| criterion | `DataTypes.ENUM('min_paid_up_capital','bca_fm01_license_valid','bca_fm01_tender_limit','non_debarment')` | `allowNull: false` |
| threshold_value_used | `DataTypes.DECIMAL(14,2)` | `allowNull: true` - snapshot of the limit/threshold applied at check time (from `eligibility_thresholds` or `bca_grade_limits`), kept even if the reference data later changes |
| actual_value | `DataTypes.DECIMAL(14,2)` | `allowNull: true` - the extracted value being checked (e.g. declared capital, or offer price vs. grade limit) |
| passed | `DataTypes.BOOLEAN` | `allowNull: false` |
| source | `DataTypes.ENUM('ai_extracted','manual_override')` | `allowNull: false`, `defaultValue: 'ai_extracted'` |
| notes | `DataTypes.TEXT` | `allowNull: true` |
| checked_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` - null when the check is purely automated |
| checked_at | `DataTypes.DATE` | `allowNull: false`, `defaultValue: DataTypes.NOW` |

## Table: `bca_grade_limits` (new, reference/lookup data)

Configurable BCA FM01 grade-to-tender-value ceiling, so the limit is data the team can update, not a hardcoded number in application code.

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| grade | `DataTypes.ENUM('L1','L2','L3','L4','L5','L6')` | `allowNull: false` |
| max_tender_value | `DataTypes.DECIMAL(14,2)` | `allowNull: true` (`null` = no ceiling for that grade) |
| effective_from | `DataTypes.DATEONLY` | `allowNull: false` |
| updated_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

> `grade` is no longer unique on its own - a composite unique index on `(grade, effective_from)` replaces it, so multiple dated limits per grade can coexist as history instead of each update overwriting the only row for that grade:
> ```js
> BcaGradeLimit.init({ /* fields above */ }, {
>   indexes: [
>     { unique: true, fields: ['grade', 'effective_from'] }
>   ]
> });
> ```
> "Current" limit for a grade = the row with the latest `effective_from` that is `<= now()`; lookups at check time must query for that, not assume one row per grade.

## Table: `eligibility_thresholds` (new, reference/config data)

Configurable non-BCA thresholds (currently just minimum paid-up capital), kept generic so future criteria don't require a schema change.

| Field | Sequelize Type | Constraints |
|---|---|---|
| id | `DataTypes.INTEGER` | Primary Key, autoIncrement |
| criterion_key | `DataTypes.STRING` | `allowNull: false`, `unique: true` (e.g. `'min_paid_up_capital'`) |
| threshold_value | `DataTypes.DECIMAL(14,2)` | `allowNull: false` |
| description | `DataTypes.STRING` | `allowNull: true` |
| updated_by | `DataTypes.INTEGER` | **FK → `users.id`** (external, see below), `allowNull: true` |
| updated_at | `DataTypes.DATE` | `allowNull: false`, Sequelize-managed timestamp |

## Sequelize Associations

```js
// tenders
Tender.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Tender.hasMany(TenderDocument, { foreignKey: 'tender_id', as: 'documents', onDelete: 'CASCADE' });
Tender.hasMany(EligibilityCheck, { foreignKey: 'tender_id', as: 'eligibilityChecks', onDelete: 'CASCADE' });

// tender_documents
TenderDocument.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
TenderDocument.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// eligibility_checks
EligibilityCheck.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
EligibilityCheck.belongsTo(User, { foreignKey: 'checked_by', as: 'reviewer' });

// eligibility_thresholds
EligibilityThreshold.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });
```

## External Foreign Key References Needed

These tables are **not owned by this scope** - listed here only so the owning teammate knows what shape is depended on.

| Referenced Table | Field Needed | Owner | Used By |
|---|---|---|---|
| `users` | `id` (`DataTypes.INTEGER`, PK) | Shared / Auth infra (group) | `tenders.created_by`, `tender_documents.uploaded_by`, `eligibility_checks.checked_by`, `eligibility_thresholds.updated_by` |

For cross-awareness only (no action needed from this scope): `evaluations`, `clarification_requests`, `tender_rankings`, and `kpi_metrics` (owned by Jerrold, Sulaiman, and Kai Xuan respectively) each hold their own `tender_id` FK pointing back to `tenders.id` defined above.

## Note for the Team

This adds three tables (`eligibility_checks`, `bca_grade_limits`, `eligibility_thresholds`) that don't yet exist in the shared `design/er-diagram.md`. That file is a group-maintained artifact, so it hasn't been changed here - raise these additions with the team so the shared ER diagram and Mermaid export stay in sync with this scope's actual schema.
