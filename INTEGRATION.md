# Integration Guide: Strategic Rankings Dashboard

This document outlines how the Strategic Rankings Dashboard (Kai Xuan's scope) integrates with the shared Tender Process Automation application. It serves as a guide for teammates (Zheng Hong, Jerrold) to connect their modules.

## 1. Exposed APIs
The dashboard exposes the following endpoints via the `/api/dashboard` prefix:

- `GET /api/dashboard/kpis`: Fetches aggregated statistics (Total Tenders, Average PQM, High Risk).
- `GET /api/dashboard/rankings`: Fetches paginated, sorted, and filtered evaluation rankings.
- `POST /api/dashboard/archive`: Takes a point-in-time snapshot of the rankings and stores it in the database.

## 2. Expected Database Models
The dashboard relies on the following database states. 
*Note: The Dashboard only creates and owns the `ScoringArchive` model. It expects teammates to provide the `Tender` and `Evaluation` models.*

### Shared Entity: Tender (Zheng Hong)
Expected fields needed for dashboard logic:
- `id` (Primary Key, String/UUID)
- `title` (String)
- `category` (String)
- `status` (String - e.g., 'Evaluating', 'Awarded')
- `createdAt` (Date)

### Shared Entity: Evaluation/Ranking (Jerrold)
Expected fields needed for dashboard logic:
- `vendorId` (String/UUID)
- `vendorName` (String)
- `pqmScore` (Number)
- `riskLevel` (String - 'Low', 'Medium', 'High')

## 3. Repository Interfaces
To prevent merge conflicts, the Dashboard uses a **Repository Interface Pattern**. 
Currently, it imports from `backend/src/repositories/MockTenderRepository.js` and `MockEvaluationRepository.js`.

### How to integrate your database repositories:
1. Complete your real Sequelize repositories (e.g., `DatabaseTenderRepository`).
2. Open `backend/src/repositories/TenderRepository.js` and swap the export:
   ```javascript
   // Change this:
   // const MockTenderRepository = require('./MockTenderRepository');
   // module.exports = new MockTenderRepository();

   // To this:
   const DatabaseTenderRepository = require('./DatabaseTenderRepository');
   module.exports = new DatabaseTenderRepository();
   ```
3. Ensure your real repository implements these exact methods:
   - `TenderRepository.findAll(filters)`: Returns an array of Tenders based on optional filters (status, category, dateFrom, dateTo).
   - `TenderRepository.findById(id)`: Returns a single Tender.
   - `EvaluationRepository.getRankingsForTender(tenderId)`: Returns an array of scored/ranked vendors for a specific tender.
   - `EvaluationRepository.getAllRankings()`: Returns a flat list of all rankings across all active tenders for the main dashboard table.

## 4. Authentication Context
The dashboard archive endpoint currently uses a mock User UUID (`11111111-1111-1111-1111-111111111111`).
Once the Auth Middleware is complete, please:
1. Attach `validateAuth` (or equivalent) to `backend/src/routes/dashboardRoutes.js`.
2. Update `backend/src/controllers/dashboardController.js` to extract the real user ID: `const userId = req.user.id;`.

## 5. Required Environment Variables
Ensure the following variables are defined in your local `backend/.env` file:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tender_db
```
*Note: During tests, Jest overrides NODE_ENV to 'test' which triggers an in-memory SQLite database automatically.*
