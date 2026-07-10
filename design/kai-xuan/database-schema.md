# Database Schema: Strategic Rankings Dashboard (Kai Xuan)

> **Note on Shared Entities**: The Dashboard relies on reading data from `Tenders`, `Vendors`, and `Evaluations` tables. Since those tables are owned by other teammates (Zheng Hong, Jerrold), this module accesses them via read-only repository interfaces rather than defining them directly.

## Table: `scoring_archives`
**Description**: Stores point-in-time snapshots of finalized tender rankings. This ensures historical data remains immutable even if vendor profiles or criteria weights change later.

| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the archive record |
| `tender_reference_id` | VARCHAR(50) | NOT NULL, INDEX | Reference to the tender exercise being archived |
| `archive_version` | INTEGER | NOT NULL DEFAULT 1 | Tracks version in case of multiple archives |
| `archive_reason` | VARCHAR(255) | | Optional reason for archival |
| `ranking_snapshot` | JSONB | NOT NULL | JSON array containing the sorted vendor rankings and final PQM scores |
| `archived_by` | INTEGER | NOT NULL, FK → `users.id` | Reference to the User ID who approved/archived the list |
| `archived_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of when the archive was created |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Standard tracking field |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Standard tracking field |

**Constraints**:
- `UNIQUE(tender_reference_id, archive_version)` - Ensures versions for a tender are distinct.
- `archived_by` FK → `users.id`: changed from `UUID` to `INTEGER` to match the core `users` table's PK type (`id`, `INTEGER`, autoincrement, per `design/er-diagram.md`) - a `UUID` column cannot FK against an `INTEGER` primary key. See `design/feature-dependencies.md` (Shared Core Items #3). Note: `scoring_archives.id` itself is left as `UUID` here since it is this table's own PK, not a reference to another team's table - no other scope FKs against it, so it doesn't need to match the `INTEGER` convention for cross-table joins to work.
