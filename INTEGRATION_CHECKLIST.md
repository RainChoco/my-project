# Phase 4: Integration Checklist

This checklist defines the exact steps required to complete Phase 4 (Integration & E2E Testing) for the Strategic Rankings Dashboard module once Zheng Hong, Jerrold, Calista, and Sulaiman have merged their respective modules.

## Backend
- [ ] **Replace `MockTenderRepository`**: Swap out the mock class in `dashboardService.js` with the real DB implementation.
- [ ] **Replace `MockEvaluationRepository`**: Swap out the mock class in `dashboardService.js` with the real DB implementation.
- [ ] **Verify `TenderRepository` Interface**: Ensure Zheng Hong's models return `id`, `vendorName`, `riskCategory`, `status`, `category`, and `submissionDate` (as per `INTERFACE_CONTRACT.md`).
- [ ] **Verify `EvaluationRepository` Interface**: Ensure Jerrold's models return `tenderId` and `pqmScore` (as per `INTERFACE_CONTRACT.md`).
- [ ] **Verify Archive Endpoint**: Ensure the `ScoringArchive` model is registered with the shared Sequelize instance and the archive transaction succeeds against the real Postgres database.

## Frontend
- [ ] **Remove `mockData` Fallback**: Remove `mockKPIs` and `mockRankings` from `DashboardPage.jsx` and delete `utils/mockData.js`.
- [ ] **Connect React Query to Production APIs**: Verify `dashboardApi.js` URL points to the correct shared backend URL (or uses standard relative paths).
- [ ] **Mount `DashboardPage`**: Wire the exported `DashboardPage` component into the shared React Router (`frontend/src/routes/index.js`).
- [ ] **Verify `ProtectedRoute`**: Ensure the dashboard route is wrapped with the shared authentication provider.
- [ ] **Verify Role Permissions**: Confirm that only users with the appropriate roles (e.g., 'Admin', 'Management') can access the dashboard.

## Testing
- [ ] **Unit Tests**: Ensure all existing Jest tests still pass after swapping out the mock repositories.
- [ ] **Integration Tests**: Write backend API integration tests that hit the real database endpoints.
- [ ] **E2E Tests**: Run full Cypress/Playwright flows for filtering rankings and archiving a tender.
- [ ] **Accessibility**: Run axe-core or equivalent to verify the dashboard table remains fully accessible via keyboard navigation.
- [ ] **Responsive Testing**: Confirm the grid layout scales appropriately on mobile devices.

## Deployment
- [ ] **Environment Variables**: Ensure backend DB URIs and frontend API URLs are set correctly in the production environment.
- [ ] **Database Migrations**: Generate and run the migration script to create the `scoring_archives` table.
- [ ] **Production Build**: Run `npm run build` locally and in CI to verify the Vite chunk limits.
- [ ] **Smoke Tests**: Perform manual smoke tests of the dashboard on the deployed staging environment.
