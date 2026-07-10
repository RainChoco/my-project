# Backend Test Cases: Strategic Rankings Dashboard (Kai Xuan)

## GET /api/dashboard/kpis
- **Test 1**: Should fetch aggregated KPIs successfully without filters.
  - **Expected Outcome**: Returns HTTP 200 with totalTenders, averagePQM, highRiskTenders, and recentSubmissions.
- **Test 2**: Should apply filters (e.g. status='Evaluating') to the KPIs.
  - **Expected Outcome**: Returns HTTP 200 with aggregated KPIs calculated only for tenders matching the filter.

## GET /api/dashboard/rankings
- **Test 3**: Should fetch rankings successfully without filters.
  - **Expected Outcome**: Returns HTTP 200 with an array of rankings and default pagination metadata.
- **Test 4**: Should respect pagination parameters (page, pageSize).
  - **Expected Outcome**: Returns HTTP 200 with correct paginated subset of rankings and correct pagination metadata.
- **Test 5**: Should sort rankings correctly based on sortBy and sortOrder.
  - **Expected Outcome**: Returns HTTP 200 with rankings sorted accordingly (e.g., lowest PQM score first).

## POST /api/dashboard/archive
- **Test 6**: Should successfully archive a finalized scoring list for an existing tender.
  - **Expected Outcome**: Returns HTTP 201 with archiveId and version.
- **Test 7**: Should return 404 if the tenderReferenceId does not exist.
  - **Expected Outcome**: Returns HTTP 404 with error message "Tender not found".
- **Test 8**: Should auto-increment the archive_version when archiving the same tender multiple times.
  - **Expected Outcome**: Returns HTTP 201 with an incremented version number (e.g., version 2).
