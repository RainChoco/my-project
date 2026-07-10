# Database Schema - Jerrold (Scope B: Evaluation, Processing & Risk Framework)

Tables owned by this scope, per `design/er-diagram.md` and `design/jerrold/use-cases.md`: `evaluation_criteria`, `evaluations`, `risk_assessments`, `approvals`. All tables use Sequelize's default `id` (INTEGER, autoincrement) primary key and `underscored: true` / `timestamps: true` model options unless noted.

## External Foreign Key Dependencies

These tables reference rows owned by teammates. I don't define these tables - just the columns that point at them:

| Column | References | Owner |
|---|---|---|
| `evaluation_criteria.created_by` | `users.id` | shared/auth (group-owned) |
| `evaluations.tender_id` | `tenders.id` | Zheng Hong (Scope A) |
| `evaluations.evaluated_by` | `users.id` | shared/auth |
| `risk_assessments.reviewed_by` | `users.id` | shared/auth |
| `approvals.approver_id` | `users.id` | shared/auth |

**What downstream teammates need from me:** Calista's `board_papers.evaluation_id` and Sulaiman's flows that read PQM/risk data will FK against `evaluations.id`. `risk_assessments` and `approvals` are keyed off `evaluations.id`, not `tenders.id` directly - anyone joining tender -> risk/approval data needs to go through `evaluations` first.

---

## 1. `evaluation_criteria`

Stores the weighted scoring criteria used to compute PQM scores. Weights across all `is_active: true` rows must sum to 100 (enforced in the `services/` layer at create/update time, not a DB constraint - Postgres can't easily check a sum across sibling rows).

| Column | Type | Constraints |
|---|---|---|
| `id` | `DataTypes.INTEGER` | PK, autoincrement |
| `criteria_name` | `DataTypes.STRING` | NOT NULL |
| `category` | `DataTypes.ENUM('price', 'quality')` | NOT NULL |
| `weight_percentage` | `DataTypes.DECIMAL(5, 2)` | NOT NULL, `CHECK (weight_percentage > 0 AND weight_percentage <= 100)` |
| `is_active` | `DataTypes.BOOLEAN` | NOT NULL, default `true` |
| `created_by` | `DataTypes.INTEGER` | FK -> `users.id`, NOT NULL |
| `created_at` | `DataTypes.DATE` | NOT NULL, default `NOW` |
| `updated_at` | `DataTypes.DATE` | NOT NULL, default `NOW` |

```js
const EvaluationCriteria = sequelize.define('EvaluationCriteria', {
  criteria_name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM('price', 'quality'), allowNull: false },
  weight_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0.01, max: 100 },
  },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'evaluation_criteria',
  underscored: true,
});

EvaluationCriteria.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(EvaluationCriteria, { as: 'criteriaCreated', foreignKey: 'created_by' });
```

---

## 2. `evaluations`

One row per scoring attempt on a tender. A tender can have more than one `evaluations` row over time (see `use-cases.md` UC-B11 - re-evaluation after rejection creates a new row rather than mutating the old one), so `tender_id` is not unique.

| Column | Type | Constraints |
|---|---|---|
| `id` | `DataTypes.INTEGER` | PK, autoincrement |
| `tender_id` | `DataTypes.INTEGER` | FK -> `tenders.id`, NOT NULL |
| `price_score` | `DataTypes.DECIMAL(5, 2)` | NULL until scored |
| `quality_score` | `DataTypes.DECIMAL(5, 2)` | NULL until scored |
| `pqm_score` | `DataTypes.DECIMAL(5, 2)` | NULL until scored |
| `ai_extracted_inputs` | `DataTypes.JSONB` | NULL until AI extraction runs |
| `status` | `DataTypes.ENUM('processing', 'incomplete', 'scored', 'approved', 'rejected')` | NOT NULL, default `'processing'` |
| `evaluated_by` | `DataTypes.INTEGER` | FK -> `users.id`, NOT NULL |
| `evaluation_date` | `DataTypes.DATE` | NULL until `status: 'scored'` |
| `created_at` | `DataTypes.DATE` | NOT NULL, default `NOW` |
| `updated_at` | `DataTypes.DATE` | NOT NULL, default `NOW` |

```js
const Evaluation = sequelize.define('Evaluation', {
  tender_id: { type: DataTypes.INTEGER, allowNull: false },
  price_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  quality_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  pqm_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  ai_extracted_inputs: { type: DataTypes.JSONB, allowNull: true },
  status: {
    type: DataTypes.ENUM('processing', 'incomplete', 'scored', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'processing',
  },
  evaluated_by: { type: DataTypes.INTEGER, allowNull: false },
  evaluation_date: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'evaluations',
  underscored: true,
});

Evaluation.belongsTo(Tender, { foreignKey: 'tender_id' });
Tender.hasMany(Evaluation, { foreignKey: 'tender_id' });

Evaluation.belongsTo(User, { as: 'evaluator', foreignKey: 'evaluated_by' });
User.hasMany(Evaluation, { as: 'evaluationsDone', foreignKey: 'evaluated_by' });

Evaluation.hasMany(RiskAssessment, { foreignKey: 'evaluation_id', onDelete: 'CASCADE' });
Evaluation.hasMany(Approval, { foreignKey: 'evaluation_id', onDelete: 'CASCADE' });
```

---

## 3. `risk_assessments`

AI-drafted risk items for a scored evaluation, gated behind human review before being treated as official (`problem-statement.md` flags this as high-risk/judgment-heavy content).

| Column | Type | Constraints |
|---|---|---|
| `id` | `DataTypes.INTEGER` | PK, autoincrement |
| `evaluation_id` | `DataTypes.INTEGER` | FK -> `evaluations.id`, NOT NULL |
| `risk_description` | `DataTypes.TEXT` | NOT NULL |
| `mitigation_plan` | `DataTypes.TEXT` | NULL (may be blank until reviewed) |
| `risk_level` | `DataTypes.ENUM('low', 'medium', 'high')` | NOT NULL |
| `ai_generated` | `DataTypes.BOOLEAN` | NOT NULL, default `true` |
| `review_status` | `DataTypes.ENUM('pending_review', 'reviewed', 'rejected')` | NOT NULL, default `'pending_review'` |
| `reviewed_by` | `DataTypes.INTEGER` | FK -> `users.id`, NULL until reviewed |
| `created_at` | `DataTypes.DATE` | NOT NULL, default `NOW` |
| `updated_at` | `DataTypes.DATE` | NOT NULL, default `NOW` |

```js
const RiskAssessment = sequelize.define('RiskAssessment', {
  evaluation_id: { type: DataTypes.INTEGER, allowNull: false },
  risk_description: { type: DataTypes.TEXT, allowNull: false },
  mitigation_plan: { type: DataTypes.TEXT, allowNull: true },
  risk_level: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false },
  ai_generated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  review_status: {
    type: DataTypes.ENUM('pending_review', 'reviewed', 'rejected'),
    allowNull: false,
    defaultValue: 'pending_review',
  },
  reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'risk_assessments',
  underscored: true,
});

RiskAssessment.belongsTo(Evaluation, { foreignKey: 'evaluation_id' });

RiskAssessment.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewed_by' });
User.hasMany(RiskAssessment, { as: 'riskAssessmentsReviewed', foreignKey: 'reviewed_by' });
```

---

## 4. `approvals`

Append-only decision log against an evaluation. Never updated in place - a re-evaluation (UC-B11) gets its own `evaluations` row and its own fresh `approvals` history, so past decisions are never overwritten.

| Column | Type | Constraints |
|---|---|---|
| `id` | `DataTypes.INTEGER` | PK, autoincrement |
| `evaluation_id` | `DataTypes.INTEGER` | FK -> `evaluations.id`, NOT NULL |
| `approver_id` | `DataTypes.INTEGER` | FK -> `users.id`, NOT NULL |
| `decision` | `DataTypes.ENUM('approved', 'rejected')` | NOT NULL |
| `remarks` | `DataTypes.TEXT` | NOT NULL if `decision: 'rejected'` (app-level validation), NULL otherwise |
| `decided_at` | `DataTypes.DATE` | NOT NULL, default `NOW` |

```js
const Approval = sequelize.define('Approval', {
  evaluation_id: { type: DataTypes.INTEGER, allowNull: false },
  approver_id: { type: DataTypes.INTEGER, allowNull: false },
  decision: { type: DataTypes.ENUM('approved', 'rejected'), allowNull: false },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isRequiredForRejection(value) {
        if (this.decision === 'rejected' && !value) {
          throw new Error('remarks is required when decision is "rejected"');
        }
      },
    },
  },
  decided_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'approvals',
  underscored: true,
  updatedAt: false, // append-only log, no updated_at needed
});

Approval.belongsTo(Evaluation, { foreignKey: 'evaluation_id' });

Approval.belongsTo(User, { as: 'approver', foreignKey: 'approver_id' });
User.hasMany(Approval, { as: 'approvalsDecided', foreignKey: 'approver_id' });
```

---

## Trigger Sequencing Note (Scope B ↔ Scope D)

`POST /api/evaluations/:id/reprocess` (see `design/jerrold/api-documentation.md`) and UC-B11 are **evaluator-initiated, manually-clicked actions** - re-processing a rejected evaluation is never triggered automatically by Sulaiman's Scope D resolving a clarification. This is intentional: Scope D's deviation detection also starts from Scope B's PQM scoring completing, so an automatic trigger in both directions would create a circular build dependency (see `design/feature-dependencies.md`, "Circular Dependency"). Build and test `reprocess` against a manual "Re-process Evaluation" button first; only wire an automatic listener on Scope D's `resolved` status (if the team decides to add one later) once both scopes are independently stable.

## Cascade Notes

- Deleting an `evaluations` row cascades to its `risk_assessments` and `approvals` (`onDelete: 'CASCADE'`) - but in practice evaluations are never hard-deleted (only superseded by a new row per UC-B11), so this is a safety net rather than an expected code path.
- Deleting a `tenders` row (Scope A) would cascade into `evaluations` if Zheng Hong's model sets `onDelete: 'CASCADE'` on that association - confirm this with him, since UC-A4 shows tenders are soft-deleted (`status: 'withdrawn'`) rather than hard-deleted once evaluation has started, which avoids the issue in practice.
