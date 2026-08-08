const request = require('supertest');
const express = require('express');
const evaluationCriteriaRoutes = require('../../src/routes/evaluationCriteriaRoutes');
const tenderEvaluationRoutes = require('../../src/routes/tenderEvaluationRoutes');
const evaluationRoutes = require('../../src/routes/evaluationRoutes');
const { sequelize, User, Tender, EvaluationCriteria, Evaluation, EvaluationCriterionScore } = require('../../src/models');
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

    it('accepts capability and experience categories (widened from price/quality only)', async () => {
      // Free up headroom the same way the permanent-delete test below does,
      // so this doesn't disturb the exact-100% invariant later tests depend on.
      await request(app)
        .delete(`/api/evaluation-criteria/${qualityCriterionId}`)
        .set('Authorization', `Bearer ${maStaffToken}`);

      const capabilityRes = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Resource Availability', category: 'capability', weight_percentage: 1 });
      expect(capabilityRes.statusCode).toBe(201);
      expect(capabilityRes.body.category).toBe('capability');

      const experienceRes = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Relevant Experience', category: 'experience', weight_percentage: 1 });
      expect(experienceRes.statusCode).toBe(201);
      expect(experienceRes.body.category).toBe('experience');

      // Clean up - both unused, so hard delete removes them without disturbing
      // the 100% active total the rest of the suite needs.
      await request(app)
        .delete(`/api/evaluation-criteria/${capabilityRes.body.id}/permanent`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      await request(app)
        .delete(`/api/evaluation-criteria/${experienceRes.body.id}/permanent`)
        .set('Authorization', `Bearer ${maStaffToken}`);

      const reactivateRes = await request(app)
        .post(`/api/evaluation-criteria/${qualityCriterionId}/reactivate`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(reactivateRes.statusCode).toBe(200);

      const list = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(list.body.active_weight_total).toBe(100);
    });

    it('rejects a duplicate criterion name, case-insensitive and trimmed', async () => {
      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: '  price competitiveness  ', category: 'price', weight_percentage: 5 });
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('duplicate_criterion_name');
      expect(res.body.existing_criterion.id).toBe(priceCriterionId);
    });

    it('permanently deletes an unused criterion and recalculates the active weight total', async () => {
      // Free up headroom under the 100% cap by deactivating quality first.
      const deactivateRes = await request(app)
        .delete(`/api/evaluation-criteria/${qualityCriterionId}`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(deactivateRes.statusCode).toBe(200);

      const createRes = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Temp Unused Criterion', category: 'other', weight_percentage: 5 });
      expect(createRes.statusCode).toBe(201);
      const tempId = createRes.body.id;

      const listBefore = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`);
      const tempRow = listBefore.body.data.find((c) => c.id === tempId);
      expect(tempRow.is_used).toBe(false);
      expect(listBefore.body.active_weight_total).toBe(65); // price 60% + temp 5%

      const deleteRes = await request(app)
        .delete(`/api/evaluation-criteria/${tempId}/permanent`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.id).toBe(tempId);

      const listAfter = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(listAfter.body.data.some((c) => c.id === tempId)).toBe(false);
      expect(listAfter.body.active_weight_total).toBe(60); // deleted criterion's 5% no longer counted

      // Restore the exact-100% invariant the rest of the suite depends on.
      const reactivateRes = await request(app)
        .post(`/api/evaluation-criteria/${qualityCriterionId}/reactivate`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(reactivateRes.statusCode).toBe(200);
      expect(reactivateRes.body.is_active).toBe(true);

      const finalList = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(finalList.body.active_weight_total).toBe(100);
    });

    it('duplicate lookup prioritises the active record over older inactive ones with the same name', async () => {
      // Simulates the reported bug: legacy data has two inactive rows for a
      // name created before an active one existed, so a naive first-match
      // lookup would surface a stale inactive row instead of the active one.
      const legacyInactive1 = await EvaluationCriteria.create({
        criteria_name: 'Legacy Duplicate Criterion', category: 'other', weight_percentage: 1, created_by: 1, is_active: false
      });
      const legacyInactive2 = await EvaluationCriteria.create({
        criteria_name: 'legacy duplicate criterion', category: 'other', weight_percentage: 1, created_by: 1, is_active: false
      });
      const legacyActive = await EvaluationCriteria.create({
        criteria_name: ' Legacy Duplicate Criterion ', category: 'other', weight_percentage: 1, created_by: 1, is_active: true
      });

      const res = await request(app)
        .post('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ criteria_name: 'Legacy Duplicate Criterion', category: 'other', weight_percentage: 1 });
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('duplicate_criterion_name');
      expect(res.body.existing_criterion.id).toBe(legacyActive.id);
      expect(res.body.existing_criterion.is_active).toBe(true);
      expect(res.body.message).toBe("An active criterion named 'Legacy Duplicate Criterion' already exists.");

      // Cleanup - none of these three are used by an evaluation, so hard
      // delete removes them cleanly without disturbing the suite's invariants.
      await request(app).delete(`/api/evaluation-criteria/${legacyActive.id}/permanent`).set('Authorization', `Bearer ${maStaffToken}`);
      await request(app).delete(`/api/evaluation-criteria/${legacyInactive1.id}/permanent`).set('Authorization', `Bearer ${maStaffToken}`);
      await request(app).delete(`/api/evaluation-criteria/${legacyInactive2.id}/permanent`).set('Authorization', `Bearer ${maStaffToken}`);
    });

    it('flags criteria that share a normalized name as duplicates', async () => {
      // Simulates a legacy duplicate created before duplicate-name prevention
      // existed (e.g. direct DB insert / an older client) - bypasses the
      // service layer's own duplicate check on purpose.
      const legacyDuplicate = await EvaluationCriteria.create({
        criteria_name: 'Price Competitiveness',
        category: 'price',
        weight_percentage: 1,
        created_by: 1,
        is_active: false
      });

      const list = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      const original = list.body.data.find((c) => c.id === priceCriterionId);
      const duplicateRow = list.body.data.find((c) => c.id === legacyDuplicate.id);
      expect(original.is_duplicate_name).toBe(true);
      expect(duplicateRow.is_duplicate_name).toBe(true);

      // Clean up - inactive and unused, so hard delete removes it cleanly
      // without disturbing the 100% active total the rest of the suite needs.
      const delRes = await request(app)
        .delete(`/api/evaluation-criteria/${legacyDuplicate.id}/permanent`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(delRes.statusCode).toBe(200);
    });

    it('duplicate cleanup preview and execution keep the active record, delete unused duplicates, and preserve historically-used ones', async () => {
      const activeRow = await EvaluationCriteria.create({
        criteria_name: 'Cleanup Test Criterion', category: 'other', weight_percentage: 1, created_by: 1, is_active: true
      });
      const unusedInactive1 = await EvaluationCriteria.create({
        criteria_name: 'cleanup test criterion', category: 'other', weight_percentage: 1, created_by: 1, is_active: false
      });
      const unusedInactive2 = await EvaluationCriteria.create({
        criteria_name: ' Cleanup Test Criterion ', category: 'other', weight_percentage: 1, created_by: 1, is_active: false
      });
      const usedInactive = await EvaluationCriteria.create({
        criteria_name: 'CLEANUP TEST CRITERION', category: 'other', weight_percentage: 1, created_by: 1, is_active: false
      });
      // evaluation_id has a real FK constraint in sqlite, so a genuine
      // Evaluation row is needed - pointed at tender 2 (not tender 1) so it
      // never collides with the "one active evaluation per tender" rule the
      // Manual Criterion Scoring tests below rely on for tender 1.
      const dummyEvaluation = await Evaluation.create({ tender_id: 2, evaluated_by: 1, status: 'rejected' });
      await EvaluationCriterionScore.create({
        evaluation_id: dummyEvaluation.id,
        evaluation_criteria_id: usedInactive.id,
        criteria_name_snapshot: 'Cleanup Test Criterion',
        category_snapshot: 'other',
        weight_percentage_snapshot: 1
      });

      const preview = await request(app)
        .get('/api/evaluation-criteria/duplicates/preview')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(preview.statusCode).toBe(200);
      const group = preview.body.groups.find((g) => g.normalized_name === 'cleanup test criterion');
      expect(group.keep.id).toBe(activeRow.id);
      expect(group.reactivate_candidate_id).toBeNull();
      expect(group.delete.map((d) => d.id).sort()).toEqual([unusedInactive1.id, unusedInactive2.id].sort());
      expect(group.preserved.map((p) => p.id)).toEqual([usedInactive.id]);

      const cleanup = await request(app)
        .post('/api/evaluation-criteria/duplicates/cleanup')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(cleanup.statusCode).toBe(200);
      const deletedIds = cleanup.body.deleted.map((d) => d.id);
      expect(deletedIds).toEqual(expect.arrayContaining([unusedInactive1.id, unusedInactive2.id]));

      const listAfter = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`);
      const remainingIds = listAfter.body.data.map((c) => c.id);
      expect(remainingIds).toContain(activeRow.id);
      expect(remainingIds).toContain(usedInactive.id);
      expect(remainingIds).not.toContain(unusedInactive1.id);
      expect(remainingIds).not.toContain(unusedInactive2.id);

      // Cleanup this test's own fixtures that the plan correctly preserved
      // (active + historically-used rows aren't touched by the cleanup itself).
      // activeRow is unused, so it can go straight to permanent delete; the
      // historically-used row must stay, matching what real usage would require.
      await request(app).delete(`/api/evaluation-criteria/${activeRow.id}/permanent`).set('Authorization', `Bearer ${maStaffToken}`);
    });

    it('duplicate cleanup picks the newest inactive record as the reactivation candidate when no active record exists', async () => {
      const older = await EvaluationCriteria.create({
        criteria_name: 'No Active Duplicate', category: 'other', weight_percentage: 1, created_by: 1, is_active: false
      });
      const newer = await EvaluationCriteria.create({
        criteria_name: 'no active duplicate', category: 'other', weight_percentage: 1, created_by: 1, is_active: false
      });

      const preview = await request(app)
        .get('/api/evaluation-criteria/duplicates/preview')
        .set('Authorization', `Bearer ${maStaffToken}`);
      const group = preview.body.groups.find((g) => g.normalized_name === 'no active duplicate');
      expect(group.keep.id).toBe(newer.id);
      expect(group.reactivate_candidate_id).toBe(newer.id);
      expect(group.delete.map((d) => d.id)).toEqual([older.id]);

      const cleanupRes = await request(app)
        .post('/api/evaluation-criteria/duplicates/cleanup')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(cleanupRes.body.deleted.map((d) => d.id)).toEqual(expect.arrayContaining([older.id]));

      // Cleanup never reactivates - "newer" stays inactive until explicitly
      // reactivated, matching the "when requested" rule. Remove it directly
      // since it's unused and this test is done with it.
      const listAfter = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${maStaffToken}`);
      const survivingRow = listAfter.body.data.find((c) => c.id === newer.id);
      expect(survivingRow.is_active).toBe(false);
      await request(app).delete(`/api/evaluation-criteria/${newer.id}/permanent`)
        .set('Authorization', `Bearer ${maStaffToken}`);
    });
  });

  describe('Evaluation creation authorization', () => {
    let roleCheckTenderId;

    beforeAll(async () => {
      const roleCheckTender = await Tender.create({
        tender_ref_no: 'TC-TEST-003',
        vendor_name: 'Role Check Vendor',
        submission_date: '2026-01-01',
        main_offer_price: 1000000,
        eligibility_status: 'eligible',
        created_by: 1
      });
      roleCheckTenderId = roleCheckTender.id;
    });

    it('ma_staff can create an evaluation', async () => {
      const res = await request(app)
        .post(`/api/tenders/${roleCheckTenderId}/evaluations`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({});
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('processing');

      // Only proving ma_staff can create one here - remove it so the next
      // test in this block isn't blocked by an evaluation already in progress.
      await Evaluation.destroy({ where: { id: res.body.id } });
    });

    it('evaluator can still create an evaluation (existing access is preserved)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${roleCheckTenderId}/evaluations`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({});
      expect(res.statusCode).toBe(201);
      await Evaluation.destroy({ where: { id: res.body.id } });
    });

    it('management cannot create an evaluation (403)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${roleCheckTenderId}/evaluations`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({});
      expect(res.statusCode).toBe(403);
    });

    it('an unauthenticated request is rejected', async () => {
      const res = await request(app)
        .post(`/api/tenders/${roleCheckTenderId}/evaluations`)
        .send({});
      expect(res.statusCode).toBe(401);
    });

    it('ma_staff can save draft scores and submit the evaluation it created', async () => {
      const createRes = await request(app)
        .post(`/api/tenders/${roleCheckTenderId}/evaluations`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({});
      expect(createRes.statusCode).toBe(201);
      const roleCheckEvaluationId = createRes.body.id;

      const detail = await request(app)
        .get(`/api/evaluations/${roleCheckEvaluationId}`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      const scorePayload = detail.body.criterion_scores.map((c) => ({
        evaluation_criteria_id: c.evaluation_criteria_id,
        staff_score: 80,
        remarks: 'Scored by ma_staff'
      }));

      const scoreRes = await request(app)
        .patch(`/api/evaluations/${roleCheckEvaluationId}/scores`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ scores: scorePayload });
      expect(scoreRes.statusCode).toBe(200);

      const submitRes = await request(app)
        .post(`/api/evaluations/${roleCheckEvaluationId}/submit`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(submitRes.statusCode).toBe(200);
      expect(submitRes.body.status).toBe('scored');
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

      // authorise('management') on POST /evaluations/:id/approvals runs before
      // the controller's own business rules, so a non-management user is
      // blocked with a 403 even on an evaluation that's already been decided
      // (i.e. the role check takes precedence over the "no duplicate decisions"
      // business rule, not the other way around).
      it('blocks a non-management user from logging a decision, even on an already-decided evaluation (403)', async () => {
        const res = await request(app)
          .post(`/api/evaluations/${evaluationId}/approvals`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send({ decision: 'approved' });
        expect(res.statusCode).toBe(403);
      });

      // Same role check, proven again on a fresh, still-'scored' evaluation -
      // confirms the block isn't just a side effect of the evaluation above
      // already being decided.
      it('blocks a non-management user from logging a decision on a still-pending evaluation (403)', async () => {
        const tempTender = await Tender.create({
          tender_ref_no: 'TC-TEST-004',
          vendor_name: 'Role Relaxation Test Vendor',
          submission_date: '2026-01-01',
          main_offer_price: 1000000,
          eligibility_status: 'eligible',
          created_by: 1
        });
        const createRes = await request(app)
          .post(`/api/tenders/${tempTender.id}/evaluations`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send({});
        const tempEvaluationId = createRes.body.id;
        await request(app)
          .patch(`/api/evaluations/${tempEvaluationId}/scores`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send({
            scores: [
              { evaluation_criteria_id: priceCriterionId, staff_score: 70 },
              { evaluation_criteria_id: qualityCriterionId, staff_score: 70 }
            ]
          });
        await request(app)
          .post(`/api/evaluations/${tempEvaluationId}/submit`)
          .set('Authorization', `Bearer ${evaluatorToken}`);

        const res = await request(app)
          .post(`/api/evaluations/${tempEvaluationId}/approvals`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send({ decision: 'approved', remarks: 'Attempted by a non-management test user' });
        expect(res.statusCode).toBe(403);
      });

      it('lists the approval decision history, including the manager\'s name', async () => {
        const res = await request(app)
          .get(`/api/evaluations/${evaluationId}/approvals`)
          .set('Authorization', `Bearer ${managementToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].approver_name).toBe('Kai Xuan');
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

  describe('Criterion deletion once used by an evaluation', () => {
    it('blocks permanently deleting a criterion referenced by evaluation_criterion_scores', async () => {
      const listRes = await request(app)
        .get('/api/evaluation-criteria')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      const priceRow = listRes.body.data.find((c) => c.id === priceCriterionId);
      expect(priceRow.is_used).toBe(true);

      const res = await request(app)
        .delete(`/api/evaluation-criteria/${priceCriterionId}/permanent`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('criterion_in_use');
      expect(res.body.message).toBe(
        'This criterion has been used in an evaluation and cannot be permanently deleted. Deactivate it instead to preserve evaluation history.'
      );

      // Deactivating the same, already-used criterion must still work - it's
      // the sanctioned path for retiring criteria that have historical usage.
      const deactivateRes = await request(app)
        .delete(`/api/evaluation-criteria/${priceCriterionId}`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(deactivateRes.statusCode).toBe(200);
      expect(deactivateRes.body.is_active).toBe(false);
    });
  });
});
