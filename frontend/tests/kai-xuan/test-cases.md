# Test Cases - Kai Xuan (Frontend)

## ContractListPage.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-KX-001 | Render Contract List Successfully | Renders `ContractListPage` with `useAuth` mocked as an admin user and `fetchContracts` mocked to resolve a single contract ("Contract 1"). | The page displays the "Contract Opportunities" heading and the "Contract 1" text. |
| FE-KX-002 | Filter Contracts by Search Term | Renders `ContractListPage`, then types "Nonexistent" into the search input while only "Contract 1" is loaded. | "Contract 1" is no longer present in the document after the search filter is applied. |

## StrategicRankingsDashboard.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-KX-003 | Render Empty State When No Contract Selected | Renders `DashboardPage` with `useDashboardFilters` returning an empty `contractId`, so no KPI or ranking data is fetched. | Displays the "Strategic Rankings Dashboard" heading and the "Select a contract above to view rankings" message. |
| FE-KX-004 | Fetch and Display KPIs When Contract Selected | Sets the filter `contractId` to "CTR-1" and mocks `fetchKPIs` (totalTenders 10, averagePQM 85.5, highRiskTenders 2, recentSubmissions 5) and `fetchRankings` to return one ranking row. | Displays the "Total Supplier Submissions" and "Average PQM Score" labels along with their values "10" and "85.5" rendered on screen. |
| FE-KX-005 | Trigger Archive Mutation on Confirm | With a contract selected and KPIs/rankings mocked, clicks the "Archive Final Rankings" button (enabled) and then confirms via the "Confirm Archive" dialog button. | The `archiveRankings` mock is called with `contractId` "CTR-1" and a string reason argument. |
