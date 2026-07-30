# Frontend Test Cases: Strategic Rankings Dashboard (Kai Xuan)

## Component: DashboardPage

- **Test 1**: Should render the EmptyState when no contract is selected.
  - **Expected Outcome**: The header and contract selector render, but the main dashboard charts/rankings show "Please select a Contract Opportunity above".

- **Test 2**: Should fetch and display KPIs when a contract is selected.
  - **Expected Outcome**: Renders the 4 KPI cards (Total Tenders, Average PQM Score, High Risk Suppliers, Recent Submissions) properly populated with mocked API data.

- **Test 3**: Should display ranking table and pagination.
  - **Expected Outcome**: The supplier rankings table renders correctly and passes the correct props to the pagination component.

- **Test 4**: Should trigger the archive mutation when archive final rankings is confirmed.
  - **Expected Outcome**: Clicking archive opens the dialog, submitting it calls the archive mutation, displays a toast, and updates button state.
