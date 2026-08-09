// Sulaiman - Scope D: Alternate Proposal Communication / Clarifications.
// Style matches backend/tests/jerrold/evaluationScopeB.test.js: supertest against a
// bare express app with only clarificationRoutes.js mounted, sequelize.sync({force:true})
// against the real models (NODE_ENV=test -> sqlite::memory:, see config/database.js),
// users created directly via the User model, JWT tokens via authService.signToken.
//
// clarificationAiService.js's generateDeviationRationale/generateDraftMessage are async
// but call the real OpenAI API only when process.env.OPENAI_API_KEY is set. It isn't set
// here, so both fall back to their deterministic template logic - safe to assert against
// directly with no mocking needed.
//
// cloudinaryService.uploadBuffer IS mocked, since addAttachment would otherwise try a
// real network call to Cloudinary with no credentials configured in this environment.
jest.mock('../../src/services/cloudinaryService');

const request = require('supertest');
const express = require('express');
const clarificationRoutes = require('../../src/routes/clarificationRoutes');
const { sequelize, User, Tender, ClarificationLog, ClarificationMessage, JobAdjustmentRequest } = require('../../src/models');
const authService = require('../../src/services/authService');
const cloudinaryService = require('../../src/services/cloudinaryService');

const app = express();
app.use(express.json());
app.use('/api', clarificationRoutes);

let maStaffToken;
let vendorLiaisonToken;
let evaluatorToken;

describe('Sulaiman - Scope D: Alternate Proposal Communication / Clarifications', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const maStaff = await User.create({
      full_name: 'Sulaiman MA', email: 'sulaiman.ma@test.local', password_hash: 'x', role: 'ma_staff'
    });
    const vendorLiaison = await User.create({
      full_name: 'Sulaiman VL', email: 'sulaiman.vl@test.local', password_hash: 'x', role: 'vendor_liaison'
    });
    const evaluator = await User.create({
      full_name: 'Sulaiman Eval', email: 'sulaiman.eval@test.local', password_hash: 'x', role: 'evaluator'
    });

    maStaffToken = authService.signToken(maStaff);
    vendorLiaisonToken = authService.signToken(vendorLiaison);
    evaluatorToken = authService.signToken(evaluator);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    cloudinaryService.uploadBuffer.mockReset();
  });

  // Helper to create a bare tender row for these tests.
  const createTender = async (overrides = {}) => {
    return Tender.create({
      tender_ref_no: overrides.tender_ref_no,
      vendor_name: overrides.vendor_name ?? 'Vendor Pte Ltd',
      submission_date: '2026-01-01',
      main_offer_price: overrides.main_offer_price ?? 100000,
      alternative_offer_price: overrides.alternative_offer_price,
      eligibility_status: 'eligible',
      created_by: 1,
      ...overrides
    });
  };

  let tenderFlagged, tenderNoAction, tenderNoAlt, tenderNoVendorName, tenderResendEscalate;

  beforeAll(async () => {
    tenderFlagged = await createTender({ tender_ref_no: 'TC-D-001', vendor_name: 'Vendor Flagged Pte Ltd', main_offer_price: 100000, alternative_offer_price: 94000 });
    tenderNoAction = await createTender({ tender_ref_no: 'TC-D-002', vendor_name: 'Vendor NoAction Pte Ltd', main_offer_price: 100000, alternative_offer_price: 97000 });
    tenderNoAlt = await createTender({ tender_ref_no: 'TC-D-003', vendor_name: 'Vendor NoAlt Pte Ltd', main_offer_price: 100000, alternative_offer_price: null });
    tenderNoVendorName = await createTender({ tender_ref_no: 'TC-D-004', vendor_name: '', main_offer_price: 100000, alternative_offer_price: 90000 });
    tenderResendEscalate = await createTender({ tender_ref_no: 'TC-D-005', vendor_name: 'Vendor Resend Pte Ltd', main_offer_price: 100000, alternative_offer_price: 93000 });
  });

  // ---------------------------------------------------------------------
  // UC-D1: Pricing Deviation Detection
  // ---------------------------------------------------------------------
  describe('UC-D1: Pricing Deviation Detection', () => {
    it('404s when the tender does not exist', async () => {
      const res = await request(app)
        .post('/api/tenders/999999/clarification-logs/detect-deviation')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('409s when the tender has no alternative_offer_price', async () => {
      const res = await request(app)
        .post(`/api/tenders/${tenderNoAlt.id}/clarification-logs/detect-deviation`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('blocks a non ma_staff user (403)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${tenderFlagged.id}/clarification-logs/detect-deviation`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('blocks an unauthenticated request (401)', async () => {
      const res = await request(app).post(`/api/tenders/${tenderFlagged.id}/clarification-logs/detect-deviation`);
      expect(res.statusCode).toBe(401);
    });

    let flaggedLogId;

    it('flags a deviation that exceeds tolerance and generates a deterministic AI rationale', async () => {
      const res = await request(app)
        .post(`/api/tenders/${tenderFlagged.id}/clarification-logs/detect-deviation`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('flagged');
      expect(res.body.log_type).toBe('pricing_deviation');
      expect(Number(res.body.deviation_percentage)).toBe(6);
      expect(res.body.ai_rationale).toBe(
        'Alternative offer is 6% below the main offer, exceeding the 4% tolerance threshold.'
      );
      flaggedLogId = res.body.id;
    });

    it('blocks a second active pricing_deviation log for the same tender (409)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${tenderFlagged.id}/clarification-logs/detect-deviation`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    let noActionLogId;

    it('logs a deviation within tolerance as no_action_required (200, not 201)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${tenderNoAction.id}/clarification-logs/detect-deviation`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('no_action_required');
      expect(Number(res.body.deviation_percentage)).toBe(3);
      expect(res.body.ai_rationale).toBe(
        'Alternative offer is 3% below the main offer, within the 4% tolerance threshold - no vendor follow-up required.'
      );
      noActionLogId = res.body.id;
    });

    afterAll(() => {
      global.__scopeD = { ...(global.__scopeD || {}), flaggedLogId, noActionLogId };
    });
  });

  // ---------------------------------------------------------------------
  // UC-D6: Listing & viewing clarification logs
  // ---------------------------------------------------------------------
  describe('UC-D6: Listing & viewing clarification logs', () => {
    it('lists logs with a pagination envelope', async () => {
      const res = await request(app)
        .get('/api/clarification-logs')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('filters by tender_id', async () => {
      const res = await request(app)
        .get(`/api/clarification-logs?tender_id=${tenderFlagged.id}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((l) => l.tender_id === tenderFlagged.id)).toBe(true);
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/clarification-logs?status=no_action_required')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((l) => l.status === 'no_action_required')).toBe(true);
      expect(res.body.data.some((l) => l.id === global.__scopeD.noActionLogId)).toBe(true);
    });

    it('rejects an invalid status filter with 400', async () => {
      const res = await request(app)
        .get('/api/clarification-logs?status=not_a_real_status')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(400);
    });

    it('404s for a nonexistent log', async () => {
      const res = await request(app)
        .get('/api/clarification-logs/999999')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('returns full detail with empty messages/job_adjustment_requests arrays for a fresh log', async () => {
      const res = await request(app)
        .get(`/api/clarification-logs/${global.__scopeD.noActionLogId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.messages).toEqual([]);
      expect(res.body.job_adjustment_requests).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------
  // UC-D2: Draft, review, approve & send
  // ---------------------------------------------------------------------
  describe('UC-D2: Draft, review, approve & send', () => {
    it('blocks a non ma_staff/vendor_liaison user from drafting (403)', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/draft-message`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('409s when the log status is not flagged', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.noActionLogId}/draft-message`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    let draftMessageId;

    it('drafts a deterministic AI message and moves the log to draft_ready', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/draft-message`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(201);
      expect(res.body.message_type).toBe('draft');
      expect(res.body.ai_generated).toBe(true);
      expect(res.body.subject).toBe('Clarification Request - TC-D-001 Pricing Deviation');
      expect(res.body.body).toContain('Vendor Flagged Pte Ltd');
      expect(res.body.body).toContain('6%');
      expect(res.body.body).toContain('Kindly confirm or justify this deviation within 5 business days.');
      draftMessageId = res.body.id;

      const logRes = await request(app)
        .get(`/api/clarification-logs/${global.__scopeD.flaggedLogId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(logRes.body.status).toBe('draft_ready');
    });

    it('409s drafting again now the log is no longer flagged', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/draft-message`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('edits the draft body/subject', async () => {
      const res = await request(app)
        .patch(`/api/clarification-messages/${draftMessageId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ subject: 'Edited subject', body: 'Edited body text.' });
      expect(res.statusCode).toBe(200);
      expect(res.body.subject).toBe('Edited subject');
      expect(res.body.body).toBe('Edited body text.');
    });

    it('rejects an edit with an empty body (400)', async () => {
      const res = await request(app)
        .patch(`/api/clarification-messages/${draftMessageId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ body: '' });
      expect(res.statusCode).toBe(400);
    });

    it('404s editing a nonexistent message', async () => {
      const res = await request(app)
        .patch('/api/clarification-messages/999999')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ body: 'Anything' });
      expect(res.statusCode).toBe(404);
    });

    it('409s approving a vendor_response message (only drafts are approvable)', async () => {
      // Direct-model fixture: a message_type that can never legitimately reach
      // approveMessage's endpoint the "normal" way (there's no send-a-response-for-
      // approval flow), used purely to exercise the message_type guard.
      const fixtureLog = await ClarificationLog.create({ tender_id: tenderFlagged.id, log_type: 'pricing_deviation', status: 'sent' });
      const fixtureMessage = await ClarificationMessage.create({
        clarification_log_id: fixtureLog.id, message_type: 'vendor_response', body: 'A vendor reply', created_by: 1
      });
      const res = await request(app)
        .post(`/api/clarification-messages/${fixtureMessage.id}/approve`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('approves the draft and moves the log to approved', async () => {
      const res = await request(app)
        .post(`/api/clarification-messages/${draftMessageId}/approve`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.approved_by).not.toBeNull();
      expect(res.body.approved_at).not.toBeNull();

      const logRes = await request(app)
        .get(`/api/clarification-logs/${global.__scopeD.flaggedLogId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(logRes.body.status).toBe('approved');
    });

    it('409s approving the same draft again (log no longer draft_ready)', async () => {
      const res = await request(app)
        .post(`/api/clarification-messages/${draftMessageId}/approve`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('409s sending when the log is not approved', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.noActionLogId}/send`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ dispatch_channel: 'email' });
      expect(res.statusCode).toBe(409);
    });

    it('400s sending without a dispatch_channel', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/send`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({});
      expect(res.statusCode).toBe(400);
    });

    it('400s sending with an invalid dispatch_channel', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/send`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ dispatch_channel: 'carrier_pigeon' });
      expect(res.statusCode).toBe(400);
    });

    it('sends the approved message and sets follow_up_due_at ~5 days out', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/send`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ dispatch_channel: 'email' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message_type).toBe('sent');
      expect(res.body.body).toBe('Edited body text.');
      expect(res.body.dispatch_channel).toBe('email');

      const logRes = await request(app)
        .get(`/api/clarification-logs/${global.__scopeD.flaggedLogId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(logRes.body.status).toBe('sent');
      expect(logRes.body.follow_up_due_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ---------------------------------------------------------------------
  // UC-D2 edge case: vendor has no contact info on file
  // ---------------------------------------------------------------------
  describe('UC-D2 edge case: vendor missing contact info', () => {
    let noVendorLogId;
    let noVendorDraftId;

    it('runs detection, drafts and approves normally', async () => {
      const detectRes = await request(app)
        .post(`/api/tenders/${tenderNoVendorName.id}/clarification-logs/detect-deviation`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(detectRes.statusCode).toBe(201);
      noVendorLogId = detectRes.body.id;

      const draftRes = await request(app)
        .post(`/api/clarification-logs/${noVendorLogId}/draft-message`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(draftRes.statusCode).toBe(201);
      noVendorDraftId = draftRes.body.id;

      const approveRes = await request(app)
        .post(`/api/clarification-messages/${noVendorDraftId}/approve`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(approveRes.statusCode).toBe(200);
    });

    it('409s sending because the vendor has no contact information on file', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${noVendorLogId}/send`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ dispatch_channel: 'email' });
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/no contact information/);
    });

    afterAll(() => {
      global.__scopeD = { ...global.__scopeD, noVendorLogId, noVendorDraftId };
    });
  });

  // ---------------------------------------------------------------------
  // UC-D5: Vendor responses & attachments
  // ---------------------------------------------------------------------
  describe('UC-D5: Vendor responses & attachments', () => {
    it('409s recording a response unless the log is sent', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.noActionLogId}/responses`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ body: 'Vendor reply', response_notes: 'Notes' });
      expect(res.statusCode).toBe(409);
    });

    it('400s recording a response without response_notes', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/responses`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({ body: 'Vendor reply' });
      expect(res.statusCode).toBe(400);
    });

    let vendorResponseMessageId;

    it('records a vendor response and moves the log to responded', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/responses`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({ subject: 'Re: Clarification', body: 'We confirm the deviation is due to a bulk discount.', response_notes: 'Justification accepted pending review' });
      expect(res.statusCode).toBe(201);
      expect(res.body.message_type).toBe('vendor_response');
      vendorResponseMessageId = res.body.id;

      const logRes = await request(app)
        .get(`/api/clarification-logs/${global.__scopeD.flaggedLogId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(logRes.body.status).toBe('responded');
      expect(logRes.body.response_notes).toBe('Justification accepted pending review');
    });

    it('400s an attachment upload with no file attached', async () => {
      const res = await request(app)
        .post(`/api/clarification-messages/${vendorResponseMessageId}/attachments`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(400);
    });

    it('404s attaching to a nonexistent message', async () => {
      const res = await request(app)
        .post('/api/clarification-messages/999999/attachments')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('hello'), 'note.txt');
      expect(res.statusCode).toBe(404);
    });

    it('409s attaching a file to a non vendor_response message', async () => {
      const res = await request(app)
        .post(`/api/clarification-messages/${global.__scopeD.noVendorDraftId}/attachments`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('hello'), 'note.txt');
      expect(res.statusCode).toBe(409);
    });

    it('502s when the Cloudinary upload fails', async () => {
      cloudinaryService.uploadBuffer.mockRejectedValueOnce(new Error('network down'));
      const res = await request(app)
        .post(`/api/clarification-messages/${vendorResponseMessageId}/attachments`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('hello'), 'note.txt');
      expect(res.statusCode).toBe(502);
    });

    it('uploads an attachment to the vendor response message', async () => {
      cloudinaryService.uploadBuffer.mockResolvedValueOnce({
        public_id: 'town-council-tender/clarifications/test-file',
        secure_url: 'https://res.cloudinary.com/demo/raw/upload/test-file.pdf',
        resource_type: 'raw',
        format: 'pdf'
      });
      const res = await request(app)
        .post(`/api/clarification-messages/${vendorResponseMessageId}/attachments`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('revised quotation'), 'quotation.pdf');
      expect(res.statusCode).toBe(201);
      expect(res.body.original_filename).toBe('quotation.pdf');
      expect(res.body.file_url).toBe('https://res.cloudinary.com/demo/raw/upload/test-file.pdf');
      expect(cloudinaryService.uploadBuffer).toHaveBeenCalled();
    });

    afterAll(() => {
      global.__scopeD = { ...global.__scopeD, vendorResponseMessageId };
    });
  });

  // ---------------------------------------------------------------------
  // UC-D7: Job adjustment requests
  // ---------------------------------------------------------------------
  describe('UC-D7: Job adjustment requests', () => {
    it('blocks a non vendor_liaison user from creating a JAR (403)', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/job-adjustment-requests`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ source_message_id: global.__scopeD.vendorResponseMessageId, description: 'Extend timeline', justification: 'Vendor needs more time' });
      expect(res.statusCode).toBe(403);
    });

    it('404s when source_message_id does not belong to this log', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/job-adjustment-requests`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({ source_message_id: global.__scopeD.noVendorDraftId, description: 'Extend timeline', justification: 'Vendor needs more time' });
      expect(res.statusCode).toBe(404);
    });

    it('409s creating a JAR when the log is not in responded status', async () => {
      // tenderNoVendorName's log is still 'approved' (never successfully sent), but has
      // a real message on it, so this exercises the status check rather than the
      // source_message_id lookup.
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.noVendorLogId}/job-adjustment-requests`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({ source_message_id: global.__scopeD.noVendorDraftId, description: 'Extend timeline', justification: 'Vendor needs more time' });
      expect(res.statusCode).toBe(409);
    });

    let materialJarId;
    let autoApprovedJarId;

    it('creates a material JAR that is pending_approval', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/job-adjustment-requests`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({
          source_message_id: global.__scopeD.vendorResponseMessageId,
          description: 'Extend contract timeline by 2 weeks',
          justification: 'Vendor needs more time to source materials',
          is_material: true
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.is_material).toBe(true);
      expect(res.body.approval_status).toBe('pending_approval');
      materialJarId = res.body.id;
    });

    it('creates a non-material JAR that is auto-approved', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/job-adjustment-requests`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({
          source_message_id: global.__scopeD.vendorResponseMessageId,
          description: 'Minor wording clarification',
          justification: 'Non-material change to a clause',
          is_material: false
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.is_material).toBe(false);
      expect(res.body.approval_status).toBe('approved');
      autoApprovedJarId = res.body.id;
    });

    it('lists JARs filtered by tender_id and is_material', async () => {
      const res = await request(app)
        .get(`/api/job-adjustment-requests?tender_id=${tenderFlagged.id}&is_material=true`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(materialJarId);
    });

    it('lists JARs filtered by approval_status', async () => {
      const res = await request(app)
        .get('/api/job-adjustment-requests?approval_status=approved')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((r) => r.id === autoApprovedJarId)).toBe(true);
    });

    it('blocks a non ma_staff user from reviewing a JAR (403)', async () => {
      const res = await request(app)
        .patch(`/api/job-adjustment-requests/${materialJarId}`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({ approval_status: 'approved' });
      expect(res.statusCode).toBe(403);
    });

    it('404s reviewing a nonexistent JAR', async () => {
      const res = await request(app)
        .patch('/api/job-adjustment-requests/999999')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ approval_status: 'approved' });
      expect(res.statusCode).toBe(404);
    });

    it('400s reviewing a JAR with an invalid approval_status', async () => {
      const res = await request(app)
        .patch(`/api/job-adjustment-requests/${materialJarId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ approval_status: 'pending_approval' });
      expect(res.statusCode).toBe(400);
    });

    it('approves a pending JAR', async () => {
      const res = await request(app)
        .patch(`/api/job-adjustment-requests/${materialJarId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ approval_status: 'approved' });
      expect(res.statusCode).toBe(200);
      expect(res.body.approval_status).toBe('approved');
      expect(res.body.approved_by).not.toBeNull();
      expect(res.body.approved_at).not.toBeNull();
    });

    it('409s reviewing an already-decided JAR', async () => {
      const res = await request(app)
        .patch(`/api/job-adjustment-requests/${materialJarId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ approval_status: 'rejected' });
      expect(res.statusCode).toBe(409);
    });

    let rejectedJarId;

    it('rejects a separate pending JAR', async () => {
      const createRes = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/job-adjustment-requests`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({
          source_message_id: global.__scopeD.vendorResponseMessageId,
          description: 'Change payment terms',
          justification: 'Vendor requested net-60 instead of net-30',
          is_material: true
        });
      rejectedJarId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/job-adjustment-requests/${rejectedJarId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ approval_status: 'rejected' });
      expect(res.statusCode).toBe(200);
      expect(res.body.approval_status).toBe('rejected');
      expect(res.body.approved_by).toBeNull();
    });

    it('blocks a non vendor_liaison user from creating a follow-up notification (403)', async () => {
      const res = await request(app)
        .post(`/api/job-adjustment-requests/${materialJarId}/follow-up-notification`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('404s creating a follow-up notification for a nonexistent JAR', async () => {
      const res = await request(app)
        .post('/api/job-adjustment-requests/999999/follow-up-notification')
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('409s creating a follow-up notification for a JAR that is not approved', async () => {
      const res = await request(app)
        .post(`/api/job-adjustment-requests/${rejectedJarId}/follow-up-notification`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(409);
    });

    let followUpLogId;

    it('creates the follow-up notification log for an approved JAR', async () => {
      const res = await request(app)
        .post(`/api/job-adjustment-requests/${materialJarId}/follow-up-notification`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(201);
      expect(res.body.log_type).toBe('job_adjustment_notification');
      expect(res.body.status).toBe('draft_ready');
      followUpLogId = res.body.id;
    });

    it('409s creating a second follow-up notification for the same JAR', async () => {
      const res = await request(app)
        .post(`/api/job-adjustment-requests/${materialJarId}/follow-up-notification`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('drafts the confirmation message on the job_adjustment_notification log', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${followUpLogId}/draft-message`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(201);
      expect(res.body.subject).toBe(`Confirmation of Adjusted Terms - ${tenderFlagged.tender_ref_no}`);
      expect(res.body.body).toContain('Vendor Flagged Pte Ltd');
      expect(res.body.body).toContain('written confirmation of the revised terms');
    });

    it('409s drafting a second message on the same job_adjustment_notification log', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${followUpLogId}/draft-message`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`);
      expect(res.statusCode).toBe(409);
    });
  });

  // ---------------------------------------------------------------------
  // UC-D8/UC-D9: Resend, escalate & resolve
  // ---------------------------------------------------------------------
  describe('UC-D8/UC-D9: Resend, escalate & resolve', () => {
    let sentLogId;

    it('sets up a log in sent status via detect -> draft -> approve -> send', async () => {
      const detectRes = await request(app)
        .post(`/api/tenders/${tenderResendEscalate.id}/clarification-logs/detect-deviation`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      sentLogId = detectRes.body.id;

      const draftRes = await request(app)
        .post(`/api/clarification-logs/${sentLogId}/draft-message`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      await request(app)
        .post(`/api/clarification-messages/${draftRes.body.id}/approve`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      const sendRes = await request(app)
        .post(`/api/clarification-logs/${sentLogId}/send`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ dispatch_channel: 'manual' });
      expect(sendRes.statusCode).toBe(200);
    });

    it('409s resending unless the log is sent', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.noActionLogId}/resend`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('blocks a non ma_staff/vendor_liaison user from resending (403)', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${sentLogId}/resend`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('resends a reminder and resets follow_up_due_at', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${sentLogId}/resend`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(201);
      expect(res.body.message_type).toBe('reminder');
      expect(res.body.dispatch_channel).toBe('manual');

      const logRes = await request(app)
        .get(`/api/clarification-logs/${sentLogId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(logRes.body.follow_up_due_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('409s escalating a log that is not in sent status', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/escalate`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('escalates a sent log to MA procurement staff', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${sentLogId}/escalate`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('escalated');
      expect(res.body.escalated_by).not.toBeNull();
      expect(res.body.escalated_at).not.toBeNull();
    });

    it('409s resolving a log that is not responded or escalated', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.noActionLogId}/resolve`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ outcome_notes: 'N/A' });
      expect(res.statusCode).toBe(409);
    });

    it('400s resolving without outcome_notes', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${sentLogId}/resolve`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({});
      expect(res.statusCode).toBe(400);
    });

    it('resolves an escalated log', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${sentLogId}/resolve`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ outcome_notes: 'Vendor confirmed pricing after escalation; no adjustment needed.' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('resolved');
      expect(res.body.outcome_notes).toBe('Vendor confirmed pricing after escalation; no adjustment needed.');
      expect(res.body.resolved_by).not.toBeNull();
      expect(res.body.resolved_at).not.toBeNull();
    });

    it('resolves a responded (not escalated) log too', async () => {
      const res = await request(app)
        .post(`/api/clarification-logs/${global.__scopeD.flaggedLogId}/resolve`)
        .set('Authorization', `Bearer ${vendorLiaisonToken}`)
        .send({ outcome_notes: 'Job adjustment request approved and follow-up notification sent.' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('resolved');
    });
  });
});
