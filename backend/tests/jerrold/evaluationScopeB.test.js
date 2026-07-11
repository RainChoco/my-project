const request = require('supertest');
const express = require('express');
const evaluationCriteriaRoutes = require('../../src/routes/evaluationCriteriaRoutes');
const tenderEvaluationRoutes = require('../../src/routes/tenderEvaluationRoutes');
const evaluationRoutes = require('../../src/routes/evaluationRoutes');
const { sequelize, User, Tender } = require('../../src/models');
const authService = require('../../src/services/authService');

const app = express();
app.use(express.json());
app.use('/api/evaluation-criteria', evaluationCriteriaRoutes);
app.use('/api/tenders/:tenderId/evaluations', tenderEvaluationRoutes);
app.use('/api/evaluations', evaluationRoutes);

let maStaffToken;
let evaluatorToken;
let managementToken;

describe('Jerrold - Evaluation Criteria / Processing Tender Form / Approval', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const maStaff = await User.create({
      full_name: 'Alice Tan', email: 'alice.tan@test.local', password_hash: 'x', role: 'ma_staff'
    });
    const evaluator = await User.create({
      full_name: 'Ben Ong', email: 'ben.ong@test.local', password_hash: 'x', role: 'evaluator'
    });
    const management = await User.create({
      full_name: 'Cheryl Lim', email: 'cheryl.lim@test.local', password_hash: 'x', role: 'management'
    });

    maStaffToken = authService.signToken(maStaff);
    evaluatorToken = authService.signToken(evaluator);
    managementToken = authService.signToken(management);

    // Zheng Hong's Tender model (Scope A) is merged into the repo now, so this test
    // uses the real model instead of the raw-SQL stand-in table it previously needed -
    // evaluationService only reads `id`/`eligibility_status` off it, but the real
    // model requires these other fields too.
    await Tender.create({
      id: 1,
      tender_ref_no: 'TC-TEST-001',
      vendor_name: 'Eligible Test Vendor',
      submission_date: '2026-01-01',
      main_offer_price: 1000000,
      eligibility_status: 'eligible',
      created_by: maStaff.id
    });
    await Tender.create({
      id: 2,
      tender_ref_no: 'TC-TEST-002',
      vendor_name: 'Rejected Test Vendor',
      submission_date: '2026-01-01',
      main_offer_price: 1000000,
      eligibility_status: 'rejected',
      created_by: maStaff.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Evaluation Criteria', () => {
    it('ma_staff can create a criterion', async () => {
      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60 });
      expect(res.statusCode).toBe(201);
      expect(res.body.category).toBe('price');
      expect(res.body.is_active).toBe(true);
    });

    it('evaluator cannot create a criterion (403)', async () => {
      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ criteria_name: 'Quality', category: 'quality', weight_percentage: 40 });
      expect(res.statusCode).toBe(403);
    });

    it('rejects a weight that would push the active total over 100%', async () => {
      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Overflow', category: 'quality', weight_percentage: 50 });
      expect(res.statusCode).toBe(409);
      expect(res.body.current_active_total).toBe(60);
    });

    it('ma_staff can add the remaining 40% to reach exactly 100%', async () => {
      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Technical Quality', category: 'quality', weight_percentage: 40 });
      expect(res.statusCode).toBe(201);
    });

    it('lists criteria with the active weight total', async () => {
      const res = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.active_weight_total).toBe(100);
    });

    it('rejects an edit that breaks the exact-100% rule', async () => {
      const res = await request(app)
        .put('/api/evaluation-criteria/1')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ weight_percentage: 55 });
      expect(res.statusCode).toBe(409);
    });

    it('rejects invalid category with 400', async () => {
      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Bad', category: 'nonsense', weight_percentage: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body.type).toBe('ValidationError');
    });
  });

  describe('Processing Tender Form', () => {
    it('404s when the tender does not exist', async () => {
      const res = await request(app)
        .post('/api/tenders/999/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ document_ids: [1, 2] });
      expect(res.statusCode).toBe(404);
    });

    it('blocks processing an ineligible (rejected) tender with 409', async () => {
      const res = await request(app)
        .post('/api/tenders/2/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ document_ids: [1, 2] });
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('tender_ineligible');
    });

    let evaluationId;

    it('opens the Processing Tender Form for an eligible tender', async () => {
      const res = await request(app)
        .post('/api/tenders/1/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ document_ids: [1, 2] });
      expect(res.statusCode).toBe(202);
      expect(res.body.status).toBe('processing');
      evaluationId = res.body.id;
    });

    it('lists evaluation attempts for the tender', async () => {
      const res = await request(app)
        .get('/api/tenders/1/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('flags missing required inputs as incomplete (422)', async () => {
      const res = await request(app)
        .patch(`/api/evaluations/${evaluationId}/confirm-inputs`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ ai_extracted_inputs: { main_offer_price: 1000000 } });
      expect(res.statusCode).toBe(422);
      expect(res.body.status).toBe('incomplete');
      expect(res.body.missing_fields).toContain('technical_proposal_score_raw');
    });

    it('computes a deterministic PQM score once all required inputs are confirmed', async () => {
      const res = await request(app)
        .patch(`/api/evaluations/${evaluationId}/confirm-inputs`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ ai_extracted_inputs: { technical_proposal_score_raw: 90 } });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('scored');
      expect(res.body.pqm_score).not.toBeNull();
    });

    it('rejects a request body carrying pqm_score directly (not part of the schema)', async () => {
      const res = await request(app)
        .get(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.criteria_used.length).toBe(2);
    });

    describe('Approval Process', () => {
      it('management approves a scored evaluation', async () => {
        const res = await request(app)
          .post(`/api/evaluations/${evaluationId}/approvals`)
          .set('Authorization', `Bearer ${managementToken}`)
          .send({ decision: 'approved', remarks: 'Looks good' });
        expect(res.statusCode).toBe(201);
        expect(res.body.decision).toBe('approved');
      });

      it('evaluator cannot log an approval decision (403)', async () => {
        const res = await request(app)
          .post(`/api/evaluations/${evaluationId}/approvals`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send({ decision: 'approved' });
        expect(res.statusCode).toBe(403);
      });

      it('lists the approval decision history', async () => {
        const res = await request(app)
          .get(`/api/evaluations/${evaluationId}/approvals`)
          .set('Authorization', `Bearer ${managementToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
      });
    });
  });

  describe('Approval validation rules', () => {
    let secondEvaluationId;

    beforeAll(async () => {
      const openRes = await request(app)
        .post('/api/tenders/1/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ document_ids: [1] });
      secondEvaluationId = openRes.body.id;

      await request(app)
        .patch(`/api/evaluations/${secondEvaluationId}/confirm-inputs`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ ai_extracted_inputs: { main_offer_price: 500000, technical_proposal_score_raw: 70 } });
    });

    it('requires remarks when rejecting', async () => {
      const res = await request(app)
        .post(`/api/evaluations/${secondEvaluationId}/approvals`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ decision: 'rejected' });
      expect(res.statusCode).toBe(400);
    });

    it('requires remarks when requesting revision', async () => {
      const res = await request(app)
        .post(`/api/evaluations/${secondEvaluationId}/approvals`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ decision: 'revision_requested' });
      expect(res.statusCode).toBe(400);
    });

    it('accepts revision_requested with remarks and keeps the evaluation scored', async () => {
      const res = await request(app)
        .post(`/api/evaluations/${secondEvaluationId}/approvals`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ decision: 'revision_requested', remarks: 'Please clarify the alternative offer' });
      expect(res.statusCode).toBe(201);
      expect(res.body.decision).toBe('revision_requested');

      const detail = await request(app)
        .get(`/api/evaluations/${secondEvaluationId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(detail.body.status).toBe('scored');
    });

    it('blocks logging a decision on an evaluation that is not yet scored', async () => {
      const openRes = await request(app)
        .post('/api/tenders/1/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ document_ids: [1] });

      const res = await request(app)
        .post(`/api/evaluations/${openRes.body.id}/approvals`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ decision: 'approved' });
      expect(res.statusCode).toBe(409);
    });
  });
});
