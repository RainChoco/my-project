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

describe('Jerrold - Evaluation Criteria / Manual Criterion Scoring / Approval', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const maStaff = await User.create({
      full_name: 'Zheng Hong', email: 'zheng.hong@test.local', password_hash: 'x', role: 'ma_staff'
    });
    const evaluator = await User.create({
      full_name: 'Jerrold', email: 'jerrold@test.local', password_hash: 'x', role: 'evaluator'
    });
    const management = await User.create({
      full_name: 'Kai Xuan', email: 'kai.xuan@test.local', password_hash: 'x', role: 'management'
    });

    maStaffToken = authService.signToken(maStaff);
    evaluatorToken = authService.signToken(evaluator);
    managementToken = authService.signToken(management);

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

  let priceCriterionId;
  let qualityCriterionId;
  let evaluationId;

  describe('Evaluation Criteria', () => {
    it('ma_staff can create a criterion', async () => {
      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60 });
      expect(res.statusCode).toBe(201);
      expect(res.body.category).toBe('price');
      expect(res.body.is_active).toBe(true);
      priceCriterionId = res.body.id;
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
      qualityCriterionId = res.body.id;
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
        .put(`/api/evaluation-criteria/${priceCriterionId}`)
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

  describe('Manual Criterion Scoring', () => {
    it('404s when the tender does not exist', async () => {
      const res = await request(app)
        .post('/api/tenders/999/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({});
      expect(res.statusCode).toBe(404);
    });

    it('blocks creating an evaluation for an ineligible (rejected) tender with 409', async () => {
      const res = await request(app)
        .post('/api/tenders/2/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({});
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('tender_ineligible');
    });

    it('creates an evaluation from an eligible tender with a fresh unscored criterion snapshot', async () => {
      const res = await request(app)
        .post('/api/tenders/1/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({});
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('processing');
      evaluationId = res.body.id;

      const detail = await request(app)
        .get(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(detail.body.criterion_scores.length).toBe(2);
      expect(detail.body.criterion_scores.every((c) => c.staff_score === null)).toBe(true);
      expect(detail.body.tender_ref_no).toBe('TC-TEST-001');
      expect(detail.body.vendor_name).toBe('Eligible Test Vendor');
    });

    it('lists evaluation attempts for the tender', async () => {
      const res = await request(app)
        .get('/api/tenders/1/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('saves a partial draft score for one criterion', async () => {
      const res = await request(app)
        .patch(`/api/evaluations/${evaluationId}/scores`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ scores: [{ evaluation_criteria_id: priceCriterionId, staff_score: 80, remarks: 'Competitive pricing' }] });
      expect(res.statusCode).toBe(200);
      const priceRow = res.body.criterion_scores.find((c) => c.evaluation_criteria_id === priceCriterionId);
      expect(Number(priceRow.staff_score)).toBe(80);
      expect(Number(priceRow.weighted_score)).toBe(48);
      const qualityRow = res.body.criterion_scores.find((c) => c.evaluation_criteria_id === qualityCriterionId);
      expect(qualityRow.staff_score).toBeNull();
    });

    it('blocks submission while a criterion is still unscored (422)', async () => {
      const res = await request(app)
        .post(`/api/evaluations/${evaluationId}/submit`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(422);
      expect(res.body.missing_criteria.some((c) => c.evaluation_criteria_id === qualityCriterionId)).toBe(true);
    });

    it('rejects an out-of-range staff score with 400', async () => {
      const res = await request(app)
        .patch(`/api/evaluations/${evaluationId}/scores`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ scores: [{ evaluation_criteria_id: qualityCriterionId, staff_score: 150 }] });
      expect(res.statusCode).toBe(400);
    });

    it('computes the backend-weighted PQM score once every criterion is scored', async () => {
      await request(app)
        .patch(`/api/evaluations/${evaluationId}/scores`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ scores: [{ evaluation_criteria_id: qualityCriterionId, staff_score: 90, remarks: 'Strong track record' }] });

      const res = await request(app)
        .post(`/api/evaluations/${evaluationId}/submit`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('scored');
      // price: 80/100 * 60 = 48, quality: 90/100 * 40 = 36, pqm: 84
      expect(Number(res.body.price_score)).toBe(48);
      expect(Number(res.body.quality_score)).toBe(36);
      expect(Number(res.body.pqm_score)).toBe(84);
    });

    it('blocks editing scores once the evaluation is scored (409)', async () => {
      const res = await request(app)
        .patch(`/api/evaluations/${evaluationId}/scores`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ scores: [{ evaluation_criteria_id: priceCriterionId, staff_score: 50 }] });
      expect(res.statusCode).toBe(409);
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
        .send({});
      secondEvaluationId = openRes.body.id;

      await request(app)
        .patch(`/api/evaluations/${secondEvaluationId}/scores`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: [
            { evaluation_criteria_id: priceCriterionId, staff_score: 70 },
            { evaluation_criteria_id: qualityCriterionId, staff_score: 70 }
          ]
        });

      await request(app)
        .post(`/api/evaluations/${secondEvaluationId}/submit`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
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
        .send({ decision: 'revision_requested', remarks: 'Please clarify the remarks on quality' });
      expect(res.statusCode).toBe(201);
      expect(res.body.decision).toBe('revision_requested');

      const detail = await request(app)
        .get(`/api/evaluations/${secondEvaluationId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(detail.body.status).toBe('scored');
    });

    it('rejects the evaluation with remarks', async () => {
      const res = await request(app)
        .post(`/api/evaluations/${secondEvaluationId}/approvals`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ decision: 'rejected', remarks: 'Pricing needs clarification' });
      expect(res.statusCode).toBe(201);

      const detail = await request(app)
        .get(`/api/evaluations/${secondEvaluationId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(detail.body.status).toBe('rejected');
    });

    it('blocks logging a decision on an evaluation that is not yet scored', async () => {
      const openRes = await request(app)
        .post('/api/tenders/1/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({});

      const res = await request(app)
        .post(`/api/evaluations/${openRes.body.id}/approvals`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ decision: 'approved' });
      expect(res.statusCode).toBe(409);
    });

    describe('Re-evaluation (UC-B11)', () => {
      it('only a rejected evaluation can be reprocessed', async () => {
        const res = await request(app)
          .post(`/api/evaluations/${secondEvaluationId}/reprocess`)
          .set('Authorization', `Bearer ${evaluatorToken}`);
        // secondEvaluationId is now 'rejected' from the prior test - this should succeed.
        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('processing');
        expect(res.body.tender_id).toBe(1);

        const detail = await request(app)
          .get(`/api/evaluations/${res.body.id}`)
          .set('Authorization', `Bearer ${evaluatorToken}`);
        expect(detail.body.criterion_scores.length).toBe(2);
        expect(detail.body.criterion_scores.every((c) => c.staff_score === null)).toBe(true);

        const priorDetail = await request(app)
          .get(`/api/evaluations/${secondEvaluationId}`)
          .set('Authorization', `Bearer ${evaluatorToken}`);
        expect(priorDetail.body.status).toBe('rejected');
      });

      it('blocks reprocessing a scored (not-yet-decided) evaluation', async () => {
        const res = await request(app)
          .post(`/api/evaluations/${evaluationId}/reprocess`)
          .set('Authorization', `Bearer ${evaluatorToken}`);
        expect(res.statusCode).toBe(409);
      });
    });
  });

  describe('Comparison listing', () => {
    it('lists only evaluations that have gone through backend scoring', async () => {
      const res = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((e) => ['scored', 'approved', 'rejected'].includes(e.status))).toBe(true);
      expect(res.body.data.some((e) => e.tender_ref_no === 'TC-TEST-001')).toBe(true);
    });
  });
});
