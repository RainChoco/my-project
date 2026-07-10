# API Documentation: Strategic Rankings Dashboard (Kai Xuan)

## GET /api/dashboard/kpis
**Description**: Fetches aggregated Key Performance Indicators for the dashboard.
**Method**: GET
**Query Parameters**: 
- `status` (optional)
- `category` (optional)

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "totalTenders": 15,
    "averagePQM": 82.5,
    "highRiskTenders": 2,
    "recentSubmissions": 5
  }
}
```

## GET /api/dashboard/rankings
**Description**: Fetches the list of tenders sorted by calculated PQM score.
**Method**: GET
**Query Parameters**:
- `status` (optional)
- `category` (optional)
- `limit` (optional)

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "data": [
    {
      "tenderId": "TND-2026-001",
      "title": "Town Council Cleaning Services",
      "vendor": "CleanTech Pte Ltd",
      "pqmScore": 89.2,
      "rank": 1,
      "status": "Evaluating"
    }
  ]
}
```

## POST /api/dashboard/archive
**Description**: Archives a finalized scoring list for a tender exercise.
**Method**: POST
**Request Body**:
```json
{
  "tenderReferenceId": "TND-2026-001",
  "rankingData": [
    { "vendorId": "V-001", "rank": 1, "pqmScore": 89.2 },
    { "vendorId": "V-002", "rank": 2, "pqmScore": 75.0 }
  ],
  "archivedBy": "admin-user-id"
}
```

**Expected Response (201 Created)**:
```json
{
  "status": "success",
  "message": "Scoring list archived successfully",
  "data": {
    "archiveId": "ARC-10293"
  }
}
```
