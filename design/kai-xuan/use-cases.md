# Use Cases: Strategic Rankings Dashboard (Kai Xuan)

## UC-KX-01: View Strategic KPI Dashboard
**Actor**: Evaluator / MA Staff
**Trigger**: User navigates to the Dashboard page.
**Main Flow**:
1. User clicks "Dashboard" in the navigation.
2. System requests KPI summary data from `GET /api/dashboard/kpis`.
3. System requests the tender ranking list from `GET /api/dashboard/rankings`.
4. Dashboard renders high-level KPI cards (e.g., Total Active Tenders, Average PQM Score, High-Risk Tenders).
5. Dashboard renders the Tender Ranking List sorted by PQM score.
**Alternate Flow**:
- If data fetch fails, the system displays an error state in the dashboard widgets with a retry button.

## UC-KX-02: Filter Tender Rankings (Multi-Level Filtering)
**Actor**: Evaluator / MA Staff
**Trigger**: User interacts with the filter sidebar/toolbar on the Dashboard.
**Main Flow**:
1. User selects a category (e.g., "Cleaning Services"), a status (e.g., "Evaluating"), or a date range.
2. System updates the query parameters and fetches filtered data from `GET /api/dashboard/rankings?category=X&status=Y`.
3. System re-renders the Ranking List and KPI cards to reflect the filtered dataset.
**Alternate Flow**:
- If no tenders match the criteria, the system displays an "Empty State - No matching tenders found" graphic.

## UC-KX-03: Submit and Archive Scoring List
**Actor**: MA Staff (Supervisor/Admin)
**Trigger**: User clicks "Submit & Archive" on a finalized tender ranking.
**Main Flow**:
1. User reviews the calculated PQM rankings for a specific tender exercise.
2. User clicks "Submit & Archive" to lock the results.
3. System prompts for confirmation to prevent accidental archiving.
4. User confirms.
5. System calls `POST /api/dashboard/archive` with the ranking snapshot data.
6. System saves the snapshot into the `scoring_archives` table.
7. System displays a success toast and updates the dashboard view.
**Alternate Flow**:
- If the tender is already archived, the backend rejects the request with a `409 Conflict` and the frontend alerts the user.
