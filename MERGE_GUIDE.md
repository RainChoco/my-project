# Dashboard Integration & Merge Guide

This guide is for teammates (Zheng Hong, Jerrold, Calista, Sulaiman) to safely integrate the **Strategic Rankings Dashboard** into the main application during Phase 4.

## 1. Safest Merge Order
To avoid conflicts and missing dependencies, please follow this merge sequence:
1. **Zheng Hong** (Tender CRUD & Ingestion) - Establishes the `Tender` table.
2. **Jerrold** (Evaluation & Approval) - Establishes the `Evaluation` table and `pqmScore`.
3. **Kai Xuan** (Dashboard) - Consumes the tables above via interfaces.
4. **Calista / Sulaiman** (Generators & Comms) - Consumes dashboard data or triggers from dashboard actions.

## 2. Wiring the Backend
Currently, the dashboard API routes are isolated. Once the shared Express router is ready, mount the dashboard routes:
```javascript
// In backend/src/routes/index.js
const dashboardRoutes = require('./dashboardRoutes');
router.use('/dashboard', authenticateJWT, requireRole(['Admin', 'Management']), dashboardRoutes);
```

## 3. Wiring the Frontend
The dashboard is cleanly exported from its feature folder. Mount it in your global router:
```javascript
// In frontend/src/routes/index.js
import { DashboardPage } from '../features/dashboard';

<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['Admin', 'Management']}>
    <DashboardPage />
  </ProtectedRoute>
} />
```

## 4. Replacing Mock Repositories
The backend currently uses `MockTenderRepository` and `MockEvaluationRepository` inside `dashboardService.js`.
Once Zheng Hong and Jerrold push their Sequelize models, update the repository interfaces to map directly to their models (see `INTERFACE_CONTRACT.md`).

## 5. Potential Conflicts
- `frontend/package.json`: You may need to resolve dependencies if multiple teammates installed Vite/React packages separately.
- `backend/src/models/index.js`: The `ScoringArchive` model will need to be added to the shared Sequelize instance and synced.
