# Interface & Data Contracts

This document outlines the expected data shapes and repository interfaces the Dashboard relies on. Teammates must ensure their implementations satisfy these contracts for Phase 4 integration.

## 1. Repository Interfaces (Backend)

The dashboard abstracts database calls through two primary interfaces located in `backend/src/repositories/`.

### `TenderRepository` (Owned by Zheng Hong)
The dashboard requires an implementation that returns a list of active tenders with vendor names and risk categories.

**Expected Output Shape & Constraints:**
```typescript
{
  id: string;             // REQUIRED: e.g., 'TND-2026-001'
  vendorName: string;     // REQUIRED
  riskCategory: string;   // REQUIRED: Enum ('Low', 'Medium', 'High')
  status: string;         // REQUIRED: Enum ('Evaluating', 'Awarded', 'Rejected')
  category: string;       // OPTIONAL: e.g., 'Cleaning'
  submissionDate: string; // REQUIRED: ISO 8601 Date String
}
```

### `EvaluationRepository` (Owned by Jerrold)
The dashboard requires an implementation that returns the calculated PQM score for a given tender.

**Expected Output Shape & Constraints:**
```typescript
{
  tenderId: string;       // REQUIRED: Foreign key matching Tender.id
  pqmScore: number;       // REQUIRED: Float between 0.0 and 100.0
  evaluatorId: string;    // OPTIONAL: UUID of the reviewer
}
```

## 2. API Responses (Frontend consumption)

The frontend `DashboardPage` expects the following JSON structures from the backend. The API version is `v1`.

### `GET /api/v1/dashboard/kpis`
Returns aggregated Key Performance Indicators.

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "totalTenders": 42,
    "averagePQM": 85.4,
    "highRiskTenders": 3,
    "recentSubmissions": 12
  }
}
```

### `GET /api/v1/dashboard/rankings`
Returns the paginated and sorted list of vendor rankings.

**Pagination Contract (Defaults):**
- `page`: default `1`
- `pageSize`: default `10`
- `maxPageSize`: limit `100`

**Success Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "tenderId": "TND-2026-001",
      "vendorName": "CleanTech Pte Ltd",
      "pqmScore": 92.5,
      "riskLevel": "Low",
      "rank": 1,
      "status": "Evaluating"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalRecords": 42,
    "totalPages": 5
  }
}
```

## 3. Error Responses (All Endpoints)

All dashboard endpoints strictly follow this standard error format.

### Client Errors
**400 Bad Request** (Validation Failure)
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": ["pageSize must be less than or equal to 100"]
}
```

**401 Unauthorized** (Missing or invalid JWT)
```json
{
  "status": "error",
  "message": "Authentication token missing or invalid"
}
```

**403 Forbidden** (Valid JWT, but insufficient role)
```json
{
  "status": "error",
  "message": "Insufficient permissions to access dashboard"
}
```

**404 Not Found** (Resource does not exist)
```json
{
  "status": "error",
  "message": "Tender reference ID not found"
}
```

**409 Conflict** (State transition failure, e.g., already archived)
```json
{
  "status": "error",
  "message": "Rankings for this tender have already been archived"
}
```

### Server Errors
**500 Internal Server Error**
```json
{
  "status": "error",
  "message": "An unexpected error occurred during score calculation"
}
```

## 4. Database Table (Dashboard Owned)
The only table created and owned by the Dashboard module is `scoring_archives`.
- `id` (UUID, PK)
- `tender_reference_id` (String, Indexed, Required)
- `snapshot_data` (JSONB, Required)
- `archive_reason` (String, Nullable)
- `archived_by` (String, Required)
- `created_at` (Timestamp, Auto-generated)
