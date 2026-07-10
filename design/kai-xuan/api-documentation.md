# API Documentation: Strategic Rankings Dashboard (Kai Xuan)

## GET /api/dashboard/kpis
**Description**: Fetches aggregated Key Performance Indicators for the dashboard.
**Method**: GET
**Query Parameters**: 
- `status` (optional)
- `category` (optional)
- `dateFrom` (optional)
- `dateTo` (optional)

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
- `dateFrom` (optional)
- `dateTo` (optional)
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10)
- `sortBy` (optional, default: "pqmScore")
- `sortOrder` (optional, default: "desc")

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
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalRecords": 45,
    "totalPages": 5
  }
}
```

## POST /api/dashboard/archive
**Description**: Archives a finalized scoring list for a tender exercise. The backend will compute the snapshot server-side based on the current evaluation data, rather than accepting client-submitted rankings.
**Method**: POST
**Request Body**:
```json
{
  "tenderReferenceId": "TND-2026-001",
  "archiveReason": "Final Board Approval"
}
```

**Expected Response (201 Created)**:
```json
{
  "status": "success",
  "message": "Scoring list archived successfully",
  "data": {
    "archiveId": "ARC-10293",
    "version": 1
  }
}
```
