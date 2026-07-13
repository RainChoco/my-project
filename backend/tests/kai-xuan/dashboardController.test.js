
const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../../src/routes/dashboardRoutes');
const tenderRepository = require('../../src/repositories/TenderRepository');
const evaluationRepository = require('../../src/repositories/EvaluationRepository');
const { ScoringArchive, sequelize } = require('../../src/models');
const authService = require('../../src/services/authService');

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

// POST /archive now requires authentication (see backend/src/middlewares/auth.js).
const authToken = authService.signToken({ id: 3, full_name: 'Kai Xuan', email: 'kai.xuan@townms.gov.sg', role: 'management' });

describe('Dashboard Controller Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Use in-memory DB for tests
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/dashboard/kpis', () => {
    it('Should fetch aggregated KPIs successfully without filters', async () => {
      const res = await request(app).get('/api/dashboard/kpis');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('totalTenders');
      expect(res.body.data).toHaveProperty('averagePQM');
    });

    it('Should apply filters to the KPIs', async () => {
      const res = await request(app).get('/api/dashboard/kpis?status=Awarded');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalTenders).toBe(1); // 1 mocked awarded tender
    });
  });

  describe('GET /api/dashboard/rankings', () => {
    it('Should fetch rankings successfully with default pagination', async () => {
      const res = await request(app).get('/api/dashboard/rankings');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('page', 1);
    });

    it('Should sort rankings correctly', async () => {
      const res = await request(app).get('/api/dashboard/rankings?sortBy=pqmScore&sortOrder=asc');
      expect(res.statusCode).toBe(200);
      // CleanSweep (92.5), Elevate SG (88.0), GreenThumbs (95.1) -> Elevate SG should be first
      expect(res.body.data[0].pqmScore).toBe(88.0);
    });
  });

  describe('POST /api/dashboard/archive', () => {
    it('Should successfully archive a finalized scoring list', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderReferenceId: 'TND-2026-001',
          archiveReason: 'Final Board Approval'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.version).toBe(1);
    });

    it('Should auto-increment the archive_version', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderReferenceId: 'TND-2026-001',
          archiveReason: 'Second Approval'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.version).toBe(2);
    });

    it('Should return 404 if the tenderReferenceId does not exist', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderReferenceId: 'INVALID-ID'
        });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Tender not found');
    });

    it('Should return 401 when no Authorization header is provided', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .send({
          tenderReferenceId: 'TND-2026-001'
        });
      expect(res.statusCode).toBe(401);
    });
  });
});
