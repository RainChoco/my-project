const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../../src/routes/dashboardRoutes');
const { Tender, Evaluation, Contract, User, sequelize } = require('../../src/models');
const { signToken } = require('../../src/services/authService');

// ── Test app: mount dashboard routes (with their built-in authenticate on /archive) ──
const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

// ── Test data ─────────────────────────────────────────────────────────────────
let testContractId;
let testTenderId;
let testAuthToken; // JWT for archive requests

describe('Dashboard Controller Tests', () => {
  beforeAll(async () => {
    // Use in-memory SQLite for tests (set by NODE_ENV=test via database.js)
    await sequelize.sync({ force: true });

    // Seed: User
    await User.create({
      id: 1,
      full_name: 'Test Admin',
      email: 'admin@test.com',
      password_hash: 'hashed',
      role: 'Admin'
    });
    // Generate a real JWT so archive requests can pass the authenticate middleware
    testAuthToken = signToken({ id: 1, full_name: 'Test Admin', email: 'admin@test.com', role: 'Admin' });

    // Seed: Contract
    const contract = await Contract.create({
      id: 'CTR-TEST-001',
      name: 'Test Contract',
      category: 'Cleaning',
      budgetLimit: 100000,
      openingDate: new Date('2026-01-01'),
      closingDate: new Date('2026-12-31'),
      status: 'Open'
    });
    testContractId = contract.id;

    // Seed: Tenders
    const t1 = await Tender.create({
      tender_ref_no: 'TC-2026-001',
      vendor_name: 'CleanSweep',
      submission_date: new Date('2026-05-10'),
      main_offer_price: 85000,
      status: 'approved',
      contractId: testContractId,
      created_by: 1
    });
    const t2 = await Tender.create({
      tender_ref_no: 'TC-2026-002',
      vendor_name: 'Elevate SG',
      submission_date: new Date('2026-05-11'),
      main_offer_price: 90000,
      status: 'approved',
      contractId: testContractId,
      created_by: 1
    });
    const t3 = await Tender.create({
      tender_ref_no: 'TC-2026-003',
      vendor_name: 'GreenThumbs',
      submission_date: new Date('2026-05-12'),
      main_offer_price: 80000,
      status: 'submitted',
      contractId: testContractId,
      created_by: 1
    });
    testTenderId = t1.id;

    // Seed: Evaluations
    await Evaluation.create({ tender_id: t1.id, pqm_score: 92.5, price_score: 90.0, quality_score: 95.0, risk_level: 'low',    evaluated_by: 1 });
    await Evaluation.create({ tender_id: t2.id, pqm_score: 88.0, price_score: 85.0, quality_score: 91.0, risk_level: 'medium', evaluated_by: 1 });
    await Evaluation.create({ tender_id: t3.id, pqm_score: 95.1, price_score: 95.0, quality_score: 95.2, risk_level: 'low',    evaluated_by: 1 });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── KPIs ────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/kpis', () => {
    it('Should fetch aggregated KPIs successfully without filters', async () => {
      const res = await request(app).get('/api/dashboard/kpis');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('totalTenders');
      expect(res.body.data).toHaveProperty('averagePQM');
      expect(res.body.data.totalTenders).toBe(3);
    });

    it('Should apply contractId filter to the KPIs', async () => {
      const res = await request(app).get(`/api/dashboard/kpis?contractId=${testContractId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalTenders).toBe(3); // all 3 belong to this contract
    });

    it('Should return 0 tenders for an unknown contractId', async () => {
      const res = await request(app).get('/api/dashboard/kpis?contractId=CTR-NONEXISTENT');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalTenders).toBe(0);
    });
  });

  // ── Rankings ────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/rankings', () => {
    it('Should fetch rankings successfully with default pagination', async () => {
      const res = await request(app).get('/api/dashboard/rankings');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.data.length).toBe(3);
    });

    it('Should sort rankings correctly by pqmScore ascending', async () => {
      const res = await request(app).get('/api/dashboard/rankings?sortBy=pqmScore&sortOrder=asc');
      expect(res.statusCode).toBe(200);
      // Ascending: Elevate SG (88.0), CleanSweep (92.5), GreenThumbs (95.1)
      expect(res.body.data[0].pqmScore).toBeCloseTo(88.0);
      expect(res.body.data[2].pqmScore).toBeCloseTo(95.1);
    });

    it('Should filter rankings by contractId', async () => {
      const res = await request(app).get(`/api/dashboard/rankings?contractId=${testContractId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(3);
    });
  });

  // ── Archive ─────────────────────────────────────────────────────────────────
  describe('POST /api/dashboard/archive', () => {
    it('Should successfully archive a finalized scoring list', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({
          contractId: testContractId,
          archiveReason: 'Final Board Approval'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.version).toBe(1);
    });

    it('Should auto-increment the archive_version on second archive', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({
          contractId: testContractId,
          archiveReason: 'Second Approval'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.version).toBe(2);
    });

    it('Should return 400 if the contractId has no evaluation data', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({
          contractId: 'CTR-NO-EVALUATIONS'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/No evaluation rankings found/);
    });

    it('Should return 400 if neither contractId nor tenderReferenceId is provided', async () => {
      const res = await request(app)
        .post('/api/dashboard/archive')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ archiveReason: 'Test' });
      expect(res.statusCode).toBe(400);
    });
  });
});
