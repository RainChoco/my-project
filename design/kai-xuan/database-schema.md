# Database Schema: Strategic Rankings Dashboard (Kai Xuan)

> **Note on Shared Entities**: The Dashboard relies on reading data from `Tenders`, `Vendors`, and `Evaluations` tables. Since those tables are owned by other teammates (Zheng Hong, Jerrold), this module accesses them via read-only repository interfaces rather than defining them directly.

## Table: `scoring_archives`
**Description**: Stores point-in-time snapshots of finalized tender rankings. This ensures historical data remains immutable even if vendor profiles or criteria weights change later.

| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the archive record |
| `tender_reference_id` | VARCHAR(50) | NOT NULL, INDEX | Reference to the tender exercise being archived |
| `ranking_snapshot` | JSONB | NOT NULL | JSON array containing the sorted vendor rankings and final PQM scores |
| `archived_by` | UUID | NOT NULL | Reference to the User ID who approved/archived the list |
| `archived_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of when the archive was created |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Standard tracking field |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Standard tracking field |

**Constraints**:
- `UNIQUE(tender_reference_id)` - A tender exercise can only have one finalized archived ranking list.
