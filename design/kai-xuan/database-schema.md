# Database Schema - Kai Xuan (Scope E: Dashboard, Strategic Rankings, Contract Opportunity CRUD)

Covers only the tables owned by this scope, taken directly from the Sequelize model definitions in `backend/src/models/Contract.js` and `backend/src/models/scoringArchive.js`, and their registration/associations in `backend/src/models/index.js`. External foreign keys this scope depends on (or that depend on it) are called out at the bottom - those tables are owned by teammates and are not redefined here.

## Gap Review: Does the Previous Version of This Doc Handle This?

The previous version of this document covered only `scoring_archives` and treated `Tenders`/`Vendors`/`Evaluations` as the only other relevant tables (all owned elsewhere). That undercounted this scope's own schema footprint in two ways:

1. **`Contracts` was missing entirely**, even though Contract Opportunity CRUD is one of this scope's three named responsibilities (`ContractController.js`, `ContractService.js`, `ContractRepository.js`, `Contract.js` model) and is the actual parent entity that Zheng Hong's `Tender` model hangs off (`Contract.hasMany(Tender, { foreignKey: 'contractId' })` in `backend/src/models/index.js`). Documenting only `scoring_archives` left the single largest table this scope owns (30 columns) undocumented.
2. There is **no dedicated `tender_rankings` or `kpi_metrics` table**, despite `design/zheng-hong/database-schema.md` listing those as tables it expects this scope to own. Rankings and KPIs are computed on the fly in `dashboardService.js` from `evaluationRepository` reads - nothing about them is persisted beyond the point-in-time snapshots written into `scoring_archives.ranking_snapshot` when a user explicitly archives. That's noted here so the team's shared `er-diagram.md` isn't drawn assuming tables that don't exist in the actual implementation.

---

## Table: `Contracts`

**Description:** A Contract Opportunity - the parent entity a Town Council publishes for tender, which vendors then submit `Tender` rows against (Zheng Hong's scope). Owns the full commercial/legal contract-terms detail captured on `ContractFormPage.jsx`. Model options: `{ timestamps: true, tableName: 'Contracts' }` (camelCase columns, **not** `underscored`, unlike most other scopes' tables).

| Field | Sequelize Type | Constraints |
|---|---|---|
| `id` | `DataTypes.STRING` | **Primary Key** - not auto-increment; application-generated as `CTR-XXXXXXXX` (8 uppercase hex chars from a UUID fragment) in `ContractService.createContract` |
| `name` | `DataTypes.STRING` | `allowNull: false` - contract title |
| `category` | `DataTypes.STRING` | `allowNull: false` - one of 10 service-type values enforced at the validator layer (not a DB `ENUM`): `Cleaning`, `Conservancy`, `Maintenance`, `Landscaping`, `Horticulture`, `Lift Maintenance`, `Mechanical & Electrical (M&E) Works`, `Pest Control`, `Repair & Redecoration (R&R)`, `Upgrading Works` |
| `description` | `DataTypes.TEXT` | optional |
| `budgetLimit` | `DataTypes.DECIMAL(10,2)` | `allowNull: false` |
| `openingDate` | `DataTypes.DATE` | `allowNull: false` |
| `closingDate` | `DataTypes.DATE` | `allowNull: false` - validator enforces `closingDate > openingDate` at both create and update |
| `status` | `DataTypes.STRING` | `defaultValue: 'Draft'` - not a DB `ENUM`; validator whitelists 11 values covering both the tender-opportunity lifecycle (`Draft`, `Open`, `Evaluating`, `Awarded`, `Closed`, `Archived`, `Cancelled`) and an already-awarded contract's own execution lifecycle (`Active`, `Pending Award`, `Under Evaluation`, `Completed`) |
| `isDeleted` | `DataTypes.BOOLEAN` | `defaultValue: false` - soft-delete flag; every read (`findAll`, `findById`) filters `isDeleted: false`, and `DELETE /api/v1/contracts/:id` sets this to `true` instead of removing the row |
| **Contract Terms & Legal Framework (all optional):** | | |
| `securityDepositAmount` | `DataTypes.DECIMAL(12,2)` | |
| `bankGuaranteeTerms` | `DataTypes.TEXT` | |
| `publicLiabilityInsuranceMin` | `DataTypes.DECIMAL(12,2)` | |
| `publicLiabilityInsuranceMax` | `DataTypes.DECIMAL(12,2)` | validator requires `>= publicLiabilityInsuranceMin` when both are present |
| `monthlyManagementFeeRate` | `DataTypes.DECIMAL(10,2)` | |
| `contractStartDate` | `DataTypes.DATE` | |
| `contractEndDate` | `DataTypes.DATE` | validator requires `> contractStartDate` when both are present |
| `optionToExtend` | `DataTypes.BOOLEAN` | `defaultValue: false` |
| `defectsLiabilityPeriodMonths` | `DataTypes.INTEGER` | |
| `terminationNoticePeriodDays` | `DataTypes.INTEGER` | |
| **Contract Identification & Scope (all optional):** | | |
| `contractRefNo` | `DataTypes.STRING` | e.g. `PRPGTC/RR/22/001` - not marked `unique` at the DB level (unlike Zheng Hong's `tenders.tender_ref_no`) |
| `townCouncilName` | `DataTypes.STRING` | |
| `estateZoneScope` | `DataTypes.TEXT` | |
| **Duration & Extension detail (all optional):** | | |
| `contractDurationMonths` | `DataTypes.INTEGER` | |
| `extensionTerms` | `DataTypes.STRING` | e.g. `'+1 Year'`, `'+2 Years'`, `'None'` - free string at the DB layer, whitelisted only in the frontend's `EXTENSION_TERMS_OPTIONS` |
| **Commercial & Payment Terms (all optional):** | | |
| `awardedContractSum` | `DataTypes.DECIMAL(14,2)` | wider precision than the other money fields - intended to hold the final awarded sum, which can exceed the original `budgetLimit`'s precision needs |
| `paymentMilestones` | `DataTypes.TEXT` | |
| `liquidatedDamagesRate` | `DataTypes.DECIMAL(10,2)` | SGD/day rate |
| **Insurance, Security Deposit & Legal Framework (all optional):** | | |
| `performanceGuaranteePercent` | `DataTypes.DECIMAL(5,2)` | validator enforces `0-100` |
| `wicaInsuranceCap` | `DataTypes.DECIMAL(12,2)` | |
| `minBizsafeLevel` | `DataTypes.STRING` | one of `None`, `Level 1`, `Level 2`, `Level 3`, `STAR` at the validator layer (shared enum with Zheng Hong's `tenders.bizsafe_level`, re-exported from `frontend/src/features/tenders/constants`) |
| `governingLawFramework` | `DataTypes.TEXT` | frontend defaults this to `"Singapore Town Councils Act & Standard Public Sector Conditions of Contract (PSSCOC)"`, but it is not DB-enforced |
| `createdAt` / `updatedAt` | `DataTypes.DATE` | Sequelize-managed timestamps (camelCase, per `timestamps: true` with no `underscored` option) |

**Constraints:**
- `id` is the primary key but is **not** DB-enforced `unique` beyond the PK itself - collision-avoidance is entirely at the application layer (`uuidv4().replace(/-/g, '').slice(0, 8)`), not a DB-level retry/constraint.
- No DB-level `CHECK`/`ENUM` constraints on `category`, `status`, or `minBizsafeLevel` - all three are plain `STRING` columns; the fixed value sets are enforced only by `contractValidator.js` (Yup) on the way in. A row could still end up with an out-of-set value via direct DB access or a seed script.

## Table: `scoring_archives`

**Description:** Immutable, versioned snapshots of a contract's finalized PQM ranking list, written only when a user explicitly archives (`POST /api/dashboard/archive`). Historical snapshots are never overwritten - a re-archive inserts a new row with an incremented `archive_version` rather than mutating the existing one. Model options: `{ tableName: 'scoring_archives', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }`.

| Field | Sequelize Type | Constraints |
|---|---|---|
| `id` | `DataTypes.UUID` | **Primary Key**, `defaultValue: DataTypes.UUIDV4` |
| `tender_reference_id` | `DataTypes.STRING(50)` | `allowNull: false` - **despite the name, this column holds the `Contracts.id` value** (e.g. `CTR-3F2A9B10`), not a `tenders.id`. The column was never renamed after the archive flow was repointed from individual tenders to contract opportunities (`dashboardService.archiveScoringList(contractId, ...)` writes `contractId` straight into `tender_reference_id`); the request body's legacy `tenderReferenceId` field name is a holdover from the same original design. |
| `archive_version` | `DataTypes.INTEGER` | `allowNull: false`, `defaultValue: 1` - incremented per `tender_reference_id` on each re-archive (`previousArchive.archive_version + 1`, computed inside a row-locked transaction) |
| `archive_reason` | `DataTypes.STRING(255)` | `allowNull: true` - free-text, optional |
| `ranking_snapshot` | `DataTypes.JSON` | `allowNull: false` - full array of ranking rows at archive time (same shape as a `GET /api/dashboard/rankings` `data[]` entry, unpaginated/unfiltered) |
| `archived_by` | `DataTypes.INTEGER` | `allowNull: false` - **FK → `users.id`** (external; see below). Comment in the model notes this was previously typed `UUID` and had to be changed to `INTEGER` to match `users.id`'s actual type. |
| `archived_at` | `DataTypes.DATE` | `defaultValue: DataTypes.NOW` |
| `created_at` / `updated_at` | `DataTypes.DATE` | Sequelize-managed timestamps (snake_case, per the explicit `createdAt`/`updatedAt` column mapping) |

**Indexes:**
- `UNIQUE (tender_reference_id, archive_version)` - guarantees version numbers for a given contract are gap-free and non-colliding under concurrent archive requests; enforced together with a `SELECT ... FOR UPDATE` row lock (`t.LOCK.UPDATE`) on the previous-highest-version row inside the archiving transaction, so two simultaneous archive calls for the same contract can't both compute the same `nextVersion`.

**Associations:** none defined in `backend/src/models/index.js` - `scoring_archives` is not wired up with a Sequelize `belongsTo`/`hasMany` to either `Contract` or `User`; the relationship to both is by convention (matching `tender_reference_id`/`archived_by` values) rather than an enforced/`include`-able association.

---

## Sequelize Associations Involving This Scope's Tables

```js
// backend/src/models/index.js
// --- Kai Xuan: Contract -> Tender (Contract Opportunity is the parent of Tenders) ---
Contract.hasMany(Tender, { foreignKey: 'contractId', as: 'tenders' });
Tender.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
```

`scoring_archives` has no Sequelize associations at all (see above) - it is read/written purely through direct `ScoringArchive.findOne`/`.create` calls in `dashboardService.js`, keyed by the plain string values `tender_reference_id` and `archived_by`.

## External Foreign Key References

| Column (this scope) | References | Owner | Notes |
|---|---|---|---|
| `scoring_archives.archived_by` | `users.id` (`DataTypes.INTEGER`, PK) | Shared / Auth infra (group) | Set from `req.user.id` (the JWT's `sub` claim) in `dashboardController.archiveRankings` |

| Column (teammate's table) | References this scope's table | Owner | Notes |
|---|---|---|---|
| `tenders.contractId` | `Contracts.id` (`DataTypes.STRING`, PK) | Zheng Hong (Scope A) | Every tender submission belongs to exactly one Contract Opportunity; `tenderController.createTender` rejects (`400`) if the referenced contract doesn't exist, and rejects (`422`) submissions against a contract whose `status` is `Archived`/`Closed`/`Cancelled` |

## Note for the Team

`Contracts.id` is a `STRING` PK (`CTR-XXXXXXXX`), not the `INTEGER` autoincrement convention used by most other tables in this system (`tenders.id`, `evaluations.id`, etc.) - any teammate FK'ing against it (currently just `tenders.contractId`) needs a `STRING` column, not `INTEGER`. This mirrors the same "match the referenced table's actual PK type" issue already called out in `design/zheng-hong/database-schema.md` for `scoring_archives.archived_by` vs. `users.id`.

`scoring_archives.tender_reference_id`'s name-vs-contents mismatch (see table description above) should be raised with the team before the shared `design/er-diagram.md` is drawn - either rename the column to `contract_id` to match reality, or document the rename explicitly on the shared diagram so it isn't drawn as a `tenders.id` FK, which it never has been since the contract-opportunity model was introduced.
