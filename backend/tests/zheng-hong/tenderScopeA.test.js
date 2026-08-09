const request = require('supertest');
const express = require('express');

// Cloudinary makes a real network call - mocked so document-upload tests run offline
// and deterministically. Path must match tenderController.js's own require exactly
// so jest's module registry substitutes the same resolved module.
jest.mock('../../src/services/cloudinaryService', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({
    public_id: 'town-council-tender/TC-TEST-001/main_offer',
    secure_url: 'https://res.cloudinary.com/demo/raw/upload/main_offer.pdf',
    resource_type: 'raw',
    format: 'pdf'
  })
}));

const tenderRoutes = require('../../src/routes/tenderRoutes');
const { sequelize, User, Contract, Tender, TenderDocument, EligibilityCheck, BcaGradeLimit, EligibilityThreshold } = require('../../src/models');
const authService = require('../../src/services/authService');
const cloudinaryService = require('../../src/services/cloudinaryService');

const app = express();
app.use(express.json());
app.use('/api', tenderRoutes);

let maStaffToken;
let evaluatorToken;
let managementToken;
let openContractId;
let closedContractId;

async function createContract(overrides = {}) {
  return Contract.create({
    id: overrides.id,
    name: overrides.name ?? 'Test Contract',
    category: overrides.category ?? 'Cleaning',
    budgetLimit: overrides.budgetLimit ?? 1000000,
    openingDate: overrides.openingDate ?? '2026-01-01',
    closingDate: overrides.closingDate ?? '2026-12-31',
    status: overrides.status ?? 'Open'
  });
}

describe('Zheng Hong - Tender Submission & Eligibility (Scope A)', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const maStaff = await User.create({
      full_name: 'Zheng Hong', email: 'zheng.hong.a@test.local', password_hash: 'x', role: 'ma_staff'
    });
    const evaluator = await User.create({
      full_name: 'Jerrold', email: 'jerrold.a@test.local', password_hash: 'x', role: 'evaluator'
    });
    const management = await User.create({
      full_name: 'Kai Xuan', email: 'kai.xuan.a@test.local', password_hash: 'x', role: 'management'
    });

    maStaffToken = authService.signToken(maStaff);
    evaluatorToken = authService.signToken(evaluator);
    managementToken = authService.signToken(management);

    const openContract = await createContract({ id: 'CTR-A-OPEN', status: 'Open' });
    openContractId = openContract.id;
    const closedContract = await createContract({ id: 'CTR-A-CLOSED', status: 'Closed' });
    closedContractId = closedContract.id;

    // Reference data the eligibility check depends on.
    await EligibilityThreshold.create({ criterion_key: 'min_paid_up_capital', threshold_value: 500000 });
    await BcaGradeLimit.create({ grade: 'L1', max_tender_value: 1500000, effective_from: '2020-01-01' });
    await BcaGradeLimit.create({ grade: 'L4', max_tender_value: null, effective_from: '2020-01-01' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Tender CRUD', () => {
    let tenderId;

    it('rejects an unauthenticated create request (401)', async () => {
      const res = await request(app).post('/api/tenders').send({});
      expect(res.statusCode).toBe(401);
    });

    it('blocks non ma_staff roles from creating a tender (403)', async () => {
      const res = await request(app)
        .post('/api/tenders')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          contractId: openContractId,
          tender_ref_no: 'TC-A-001',
          vendor_name: 'Acme Facilities',
          submission_date: '2026-01-05',
          main_offer_price: 800000
        });
      expect(res.statusCode).toBe(403);
    });

    it('rejects a create request missing required fields (400)', async () => {
      const res = await request(app)
        .post('/api/tenders')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ contractId: openContractId });
      expect(res.statusCode).toBe(400);
      expect(res.body.type).toBe('ValidationError');
    });

    it('rejects creating a tender against a contract that does not exist (400)', async () => {
      const res = await request(app)
        .post('/api/tenders')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({
          contractId: 'CTR-DOES-NOT-EXIST',
          tender_ref_no: 'TC-A-002',
          vendor_name: 'Acme Facilities',
          submission_date: '2026-01-05',
          main_offer_price: 800000
        });
      expect(res.statusCode).toBe(400);
    });

    it('rejects creating a tender against a Closed contract (422)', async () => {
      const res = await request(app)
        .post('/api/tenders')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({
          contractId: closedContractId,
          tender_ref_no: 'TC-A-003',
          vendor_name: 'Acme Facilities',
          submission_date: '2026-01-05',
          main_offer_price: 800000
        });
      expect(res.statusCode).toBe(422);
    });

    it('ma_staff can create a tender against an open contract', async () => {
      const res = await request(app)
        .post('/api/tenders')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({
          contractId: openContractId,
          tender_ref_no: 'TC-A-001',
          vendor_name: 'Acme Facilities',
          submission_date: '2026-01-05',
          main_offer_price: 800000,
          vendor_uen: '201234567A',
          bizsafe_level: 'Level 2'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('draft'); // model default when omitted
      expect(res.body.eligibility_status).toBe('pending'); // model default when omitted
      expect(res.body.vendor_uen).toBe('201234567A');
      tenderId = res.body.id;
    });

    it('rejects a duplicate tender_ref_no (409)', async () => {
      const res = await request(app)
        .post('/api/tenders')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({
          contractId: openContractId,
          tender_ref_no: 'TC-A-001',
          vendor_name: 'Duplicate Vendor',
          submission_date: '2026-01-06',
          main_offer_price: 900000
        });
      expect(res.statusCode).toBe(409);
    });

    it('gets a single tender by id, including its linked contract', async () => {
      const res = await request(app)
        .get(`/api/tenders/${tenderId}`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.tender_ref_no).toBe('TC-A-001');
      expect(res.body.contract.id).toBe(openContractId);
    });

    it('404s when getting a tender that does not exist', async () => {
      const res = await request(app)
        .get('/api/tenders/999999')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('lists tenders and supports filtering by vendor_name (case-insensitive, partial)', async () => {
      const res = await request(app)
        .get('/api/tenders')
        .query({ vendor_name: 'acme' })
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((t) => t.tender_ref_no === 'TC-A-001')).toBe(true);
      expect(res.body.pagination.page).toBe(1);
    });

    it('lists tenders filtered by contractId', async () => {
      const res = await request(app)
        .get('/api/tenders')
        .query({ contractId: openContractId })
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((t) => t.contractId === openContractId)).toBe(true);
    });

    it('blocks non ma_staff roles from updating a tender (403)', async () => {
      const res = await request(app)
        .patch(`/api/tenders/${tenderId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ vendor_name: 'Blocked Update' });
      expect(res.statusCode).toBe(403);
    });

    it('ma_staff can update editable fields on a draft tender', async () => {
      const res = await request(app)
        .patch(`/api/tenders/${tenderId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ paid_up_capital: 600000, bca_fm01_license_no: 'FM01-12345', bca_fm01_grade: 'L1', non_debarment_declared: true });
      expect(res.statusCode).toBe(200);
      expect(Number(res.body.paid_up_capital)).toBe(600000);
      expect(res.body.bca_fm01_license_no).toBe('FM01-12345');
      expect(res.body.bca_fm01_grade).toBe('L1');
      expect(res.body.non_debarment_declared).toBe(true);
    });

    it('404s when updating a tender that does not exist', async () => {
      const res = await request(app)
        .patch('/api/tenders/999999')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ vendor_name: 'Nobody' });
      expect(res.statusCode).toBe(404);
    });

    it('blocks edits once the tender is locked (under_evaluation / approved / rejected / withdrawn)', async () => {
      const locked = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-LOCKED-1',
        vendor_name: 'Locked Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 500000,
        status: 'under_evaluation',
        created_by: 1
      });

      const res = await request(app)
        .patch(`/api/tenders/${locked.id}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ vendor_name: 'Should not apply' });
      expect(res.statusCode).toBe(409);
    });

    it('blocks non ma_staff roles from deleting a tender (403)', async () => {
      const res = await request(app)
        .delete(`/api/tenders/${tenderId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('blocks deleting a tender locked by its status (409)', async () => {
      const locked = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-LOCKED-2',
        vendor_name: 'Locked Vendor 2',
        submission_date: '2026-01-05',
        main_offer_price: 500000,
        status: 'approved',
        created_by: 1
      });

      const res = await request(app)
        .delete(`/api/tenders/${locked.id}`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('404s when deleting a tender that does not exist', async () => {
      const res = await request(app)
        .delete('/api/tenders/999999')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('ma_staff can delete a non-locked tender', async () => {
      const disposable = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-DISPOSABLE',
        vendor_name: 'Disposable Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 500000,
        status: 'draft',
        created_by: 1
      });

      const res = await request(app)
        .delete(`/api/tenders/${disposable.id}`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(204);

      const check = await Tender.findByPk(disposable.id);
      expect(check).toBeNull();
    });
  });

  describe('Tender Documents', () => {
    let docTenderId;

    beforeAll(async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-DOCS',
        vendor_name: 'Document Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 700000,
        status: 'draft',
        created_by: 1
      });
      docTenderId = tender.id;
    });

    it('404s uploading a document to a tender that does not exist', async () => {
      const res = await request(app)
        .post('/api/tenders/999999/documents')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .field('file_type', 'main_offer')
        .attach('file', Buffer.from('dummy pdf content'), 'offer.pdf');
      expect(res.statusCode).toBe(404);
    });

    it('rejects an upload with no file attached (400)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${docTenderId}/documents`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .field('file_type', 'main_offer');
      expect(res.statusCode).toBe(400);
    });

    it('rejects an upload with an invalid file_type (400 - validation)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${docTenderId}/documents`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .field('file_type', 'not_a_real_type')
        .attach('file', Buffer.from('dummy pdf content'), 'offer.pdf');
      expect(res.statusCode).toBe(400);
      expect(res.body.type).toBe('ValidationError');
    });

    it('blocks non ma_staff roles from uploading documents (403)', async () => {
      const res = await request(app)
        .post(`/api/tenders/${docTenderId}/documents`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .field('file_type', 'main_offer')
        .attach('file', Buffer.from('dummy pdf content'), 'offer.pdf');
      expect(res.statusCode).toBe(403);
    });

    let uploadedDocumentId;

    it('ma_staff can upload a main_offer document', async () => {
      const res = await request(app)
        .post(`/api/tenders/${docTenderId}/documents`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .field('file_type', 'main_offer')
        .attach('file', Buffer.from('dummy pdf content'), 'offer.pdf');
      expect(res.statusCode).toBe(201);
      expect(res.body.file_type).toBe('main_offer');
      expect(res.body.version).toBe(1);
      expect(res.body.is_latest).toBe(true);
      expect(cloudinaryService.uploadBuffer).toHaveBeenCalled();
      uploadedDocumentId = res.body.id;
    });

    it('returns a friendly fallback message (never the raw Cloudinary error) and creates no document record when the upload service is unconfigured', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const notConfiguredError = new Error('Cloudinary is not configured (missing CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)');
      notConfiguredError.code = 'CLOUDINARY_NOT_CONFIGURED';
      cloudinaryService.uploadBuffer.mockRejectedValueOnce(notConfiguredError);

      const before = await TenderDocument.count({ where: { tender_id: docTenderId } });

      const res = await request(app)
        .post(`/api/tenders/${docTenderId}/documents`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .field('file_type', 'alternative_offer')
        .attach('file', Buffer.from('dummy pdf content'), 'offer.pdf');

      expect(res.statusCode).toBe(502);
      expect(res.body.message).toBe('Document upload service currently unavailable');
      expect(res.body.message).not.toMatch(/cloudinary/i);

      const after = await TenderDocument.count({ where: { tender_id: docTenderId } });
      expect(after).toBe(before); // no phantom document row for a file that was never actually stored

      const loggedNotConfigured = consoleErrorSpy.mock.calls.some(([line]) => /not configured/i.test(line));
      expect(loggedNotConfigured).toBe(true);
      consoleErrorSpy.mockRestore();
    });

    it('returns the same friendly fallback message for a generic Cloudinary-side failure (not just "not configured")', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      cloudinaryService.uploadBuffer.mockRejectedValueOnce(new Error('Network timeout contacting Cloudinary'));

      const res = await request(app)
        .post(`/api/tenders/${docTenderId}/documents`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .field('file_type', 'alternative_offer')
        .attach('file', Buffer.from('dummy pdf content'), 'offer.pdf');

      expect(res.statusCode).toBe(502);
      expect(res.body.message).toBe('Document upload service currently unavailable');
      consoleErrorSpy.mockRestore();
    });

    it('lists documents for a tender', async () => {
      const res = await request(app)
        .get(`/api/tenders/${docTenderId}/documents`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(uploadedDocumentId);
    });

    it('replaces a document, bumping the version and marking the prior one not latest', async () => {
      const res = await request(app)
        .put(`/api/tenders/${docTenderId}/documents/${uploadedDocumentId}`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('a newer version'), 'offer-v2.pdf');
      expect(res.statusCode).toBe(201);
      expect(res.body.version).toBe(2);
      expect(res.body.is_latest).toBe(true);

      const previous = await TenderDocument.findByPk(uploadedDocumentId);
      expect(previous.is_latest).toBe(false);

      const listRes = await request(app)
        .get(`/api/tenders/${docTenderId}/documents`)
        .query({ latest_only: 'true' })
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].version).toBe(2);
    });

    it('404s replacing a document that does not exist on the tender', async () => {
      const res = await request(app)
        .put(`/api/tenders/${docTenderId}/documents/999999`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('irrelevant'), 'irrelevant.pdf');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Tender Image / Document Package Upload', () => {
    let imgTenderId;

    beforeAll(async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-IMAGE',
        vendor_name: 'Image Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 650000,
        status: 'draft',
        created_by: 1
      });
      imgTenderId = tender.id;
    });

    it('ma_staff can upload an image as the tender document package', async () => {
      const res = await request(app)
        .post(`/api/tenders/${imgTenderId}/image`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('dummy png bytes'), { filename: 'cover.png', contentType: 'image/png' });
      expect(res.statusCode).toBe(200);
      expect(cloudinaryService.uploadBuffer).toHaveBeenCalled();
    });

    it('returns the friendly fallback message and leaves the tender record untouched when the upload service is unconfigured', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const notConfiguredError = new Error('Cloudinary is not configured (missing CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)');
      notConfiguredError.code = 'CLOUDINARY_NOT_CONFIGURED';
      cloudinaryService.uploadBuffer.mockRejectedValueOnce(notConfiguredError);

      const before = await Tender.findByPk(imgTenderId);
      const previousImageUrl = before.image_url;

      const res = await request(app)
        .post(`/api/tenders/${imgTenderId}/image`)
        .set('Authorization', `Bearer ${maStaffToken}`)
        .attach('file', Buffer.from('dummy pdf package'), { filename: 'package.pdf', contentType: 'application/pdf' });

      expect(res.statusCode).toBe(502);
      expect(res.body.message).toBe('Document upload service currently unavailable');
      expect(res.body.message).not.toMatch(/cloudinary/i);

      const after = await Tender.findByPk(imgTenderId);
      expect(after.image_url).toBe(previousImageUrl); // untouched - no partial/corrupted state

      const loggedNotConfigured = consoleErrorSpy.mock.calls.some(([line]) => /not configured/i.test(line));
      expect(loggedNotConfigured).toBe(true);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Eligibility Check', () => {
    it('409s triggering an eligibility check before any documents are uploaded', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-NODOCS',
        vendor_name: 'No Docs Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 700000,
        status: 'submitted',
        created_by: 1
      });

      const res = await request(app)
        .post(`/api/tenders/${tender.id}/eligibility-check`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(409);
    });

    it('blocks non ma_staff roles from triggering an eligibility check (403)', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-ROLECHECK',
        vendor_name: 'Role Check Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 700000,
        status: 'submitted',
        created_by: 1
      });

      const res = await request(app)
        .post(`/api/tenders/${tender.id}/eligibility-check`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('marks a tender eligible when every deterministic check passes', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-ELIGIBLE',
        vendor_name: 'Eligible Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 1000000, // under L1's 1,500,000 ceiling
        paid_up_capital: 600000, // above the 500,000 threshold
        bca_fm01_license_no: 'FM01-99999',
        bca_fm01_grade: 'L1',
        non_debarment_declared: true,
        status: 'submitted',
        created_by: 1
      });
      await TenderDocument.create({
        tender_id: tender.id,
        file_type: 'main_offer',
        original_filename: 'offer.pdf',
        cloudinary_public_id: 'x',
        file_url: 'https://example.com/x.pdf',
        file_size_bytes: 10,
        uploaded_by: 1
      });

      const res = await request(app)
        .post(`/api/tenders/${tender.id}/eligibility-check`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.eligibility_status).toBe('eligible');
      expect(res.body.checks_created).toBe(4);
      expect(res.body.ai_eligibility_summary).toBe('All eligibility criteria met.');

      const checksRes = await request(app)
        .get(`/api/tenders/${tender.id}/eligibility-checks`)
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(checksRes.body.data.length).toBe(4);
      expect(checksRes.body.data.every((c) => c.passed)).toBe(true);

      const tenderAfter = await Tender.findByPk(tender.id);
      expect(tenderAfter.eligibility_status).toBe('eligible');
    });

    it('flags a tender when paid-up capital is below the minimum threshold', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-LOWCAPITAL',
        vendor_name: 'Low Capital Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 1000000,
        paid_up_capital: 100000, // below the 500,000 threshold
        bca_fm01_license_no: 'FM01-11111',
        bca_fm01_grade: 'L1',
        non_debarment_declared: true,
        status: 'submitted',
        created_by: 1
      });
      await TenderDocument.create({
        tender_id: tender.id,
        file_type: 'main_offer',
        original_filename: 'offer.pdf',
        cloudinary_public_id: 'x',
        file_url: 'https://example.com/x.pdf',
        file_size_bytes: 10,
        uploaded_by: 1
      });

      const res = await request(app)
        .post(`/api/tenders/${tender.id}/eligibility-check`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.eligibility_status).toBe('flagged');
      expect(res.body.ai_eligibility_summary).toMatch(/paid-up capital/i);

      const capitalCheck = await EligibilityCheck.findOne({ where: { tender_id: tender.id, criterion: 'min_paid_up_capital' } });
      expect(capitalCheck.passed).toBe(false);
    });

    it('flags a tender whose main offer price exceeds its BCA grade tender value ceiling', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-OVERCEILING',
        vendor_name: 'Over Ceiling Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 2000000, // above L1's 1,500,000 ceiling
        paid_up_capital: 600000,
        bca_fm01_license_no: 'FM01-22222',
        bca_fm01_grade: 'L1',
        non_debarment_declared: true,
        status: 'submitted',
        created_by: 1
      });
      await TenderDocument.create({
        tender_id: tender.id,
        file_type: 'main_offer',
        original_filename: 'offer.pdf',
        cloudinary_public_id: 'x',
        file_url: 'https://example.com/x.pdf',
        file_size_bytes: 10,
        uploaded_by: 1
      });

      const res = await request(app)
        .post(`/api/tenders/${tender.id}/eligibility-check`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.body.eligibility_status).toBe('flagged');

      const limitCheck = await EligibilityCheck.findOne({ where: { tender_id: tender.id, criterion: 'bca_fm01_tender_limit' } });
      expect(limitCheck.passed).toBe(false);
    });

    it('does not cap the tender value when the BCA grade has no ceiling (L4 -> null max_tender_value)', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-UNLIMITEDGRADE',
        vendor_name: 'Unlimited Grade Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 50000000,
        paid_up_capital: 600000,
        bca_fm01_license_no: 'FM01-33333',
        bca_fm01_grade: 'L4',
        non_debarment_declared: true,
        status: 'submitted',
        created_by: 1
      });
      await TenderDocument.create({
        tender_id: tender.id,
        file_type: 'main_offer',
        original_filename: 'offer.pdf',
        cloudinary_public_id: 'x',
        file_url: 'https://example.com/x.pdf',
        file_size_bytes: 10,
        uploaded_by: 1
      });

      const res = await request(app)
        .post(`/api/tenders/${tender.id}/eligibility-check`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.body.eligibility_status).toBe('eligible');

      const limitCheck = await EligibilityCheck.findOne({ where: { tender_id: tender.id, criterion: 'bca_fm01_tender_limit' } });
      expect(limitCheck.passed).toBe(true);
    });

    it('rejects a tender outright when non-debarment is not declared, even if other checks pass', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-DEBARRED',
        vendor_name: 'Debarred Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 1000000,
        paid_up_capital: 600000,
        bca_fm01_license_no: 'FM01-44444',
        bca_fm01_grade: 'L1',
        non_debarment_declared: false,
        status: 'submitted',
        created_by: 1
      });
      await TenderDocument.create({
        tender_id: tender.id,
        file_type: 'main_offer',
        original_filename: 'offer.pdf',
        cloudinary_public_id: 'x',
        file_url: 'https://example.com/x.pdf',
        file_size_bytes: 10,
        uploaded_by: 1
      });

      const res = await request(app)
        .post(`/api/tenders/${tender.id}/eligibility-check`)
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.eligibility_status).toBe('rejected');

      const tenderAfter = await Tender.findByPk(tender.id);
      expect(tenderAfter.eligibility_status).toBe('rejected');
    });

    it('re-running the check clears prior checks rather than accumulating duplicates', async () => {
      const tender = await Tender.create({
        contractId: openContractId,
        tender_ref_no: 'TC-A-RERUN',
        vendor_name: 'Rerun Vendor',
        submission_date: '2026-01-05',
        main_offer_price: 1000000,
        paid_up_capital: 100000,
        non_debarment_declared: true,
        status: 'submitted',
        created_by: 1
      });
      await TenderDocument.create({
        tender_id: tender.id,
        file_type: 'main_offer',
        original_filename: 'offer.pdf',
        cloudinary_public_id: 'x',
        file_url: 'https://example.com/x.pdf',
        file_size_bytes: 10,
        uploaded_by: 1
      });

      await request(app).post(`/api/tenders/${tender.id}/eligibility-check`).set('Authorization', `Bearer ${maStaffToken}`);
      await request(app).post(`/api/tenders/${tender.id}/eligibility-check`).set('Authorization', `Bearer ${maStaffToken}`);

      const checks = await EligibilityCheck.findAll({ where: { tender_id: tender.id } });
      expect(checks.length).toBe(3); // no bca_fm01_grade set, so the tender-limit check is skipped
    });

    it('404s triggering an eligibility check for a tender that does not exist', async () => {
      const res = await request(app)
        .post('/api/tenders/999999/eligibility-check')
        .set('Authorization', `Bearer ${maStaffToken}`);
      expect(res.statusCode).toBe(404);
    });

    describe('Manual override (UC-A7)', () => {
      let overrideTenderId;
      let capitalCheckId;

      beforeAll(async () => {
        const tender = await Tender.create({
          contractId: openContractId,
          tender_ref_no: 'TC-A-OVERRIDE',
          vendor_name: 'Override Vendor',
          submission_date: '2026-01-05',
          main_offer_price: 1000000,
          paid_up_capital: 100000, // fails on its own
          bca_fm01_license_no: 'FM01-55555', // so only the capital check fails
          non_debarment_declared: true,
          status: 'submitted',
          created_by: 1
        });
        overrideTenderId = tender.id;
        await TenderDocument.create({
          tender_id: tender.id,
          file_type: 'main_offer',
          original_filename: 'offer.pdf',
          cloudinary_public_id: 'x',
          file_url: 'https://example.com/x.pdf',
          file_size_bytes: 10,
          uploaded_by: 1
        });
        await request(app).post(`/api/tenders/${tender.id}/eligibility-check`).set('Authorization', `Bearer ${maStaffToken}`);
        const check = await EligibilityCheck.findOne({ where: { tender_id: tender.id, criterion: 'min_paid_up_capital' } });
        capitalCheckId = check.id;
      });

      it('rejects an override missing notes (400)', async () => {
        const res = await request(app)
          .patch(`/api/eligibility-checks/${capitalCheckId}`)
          .set('Authorization', `Bearer ${maStaffToken}`)
          .send({ passed: true });
        expect(res.statusCode).toBe(400);
      });

      it('blocks roles outside ma_staff/evaluator from overriding (403)', async () => {
        const res = await request(app)
          .patch(`/api/eligibility-checks/${capitalCheckId}`)
          .set('Authorization', `Bearer ${managementToken}`)
          .send({ passed: true, notes: 'Verified manually against bank statement' });
        expect(res.statusCode).toBe(403);
      });

      it('ma_staff can manually override a failed check, and eligibility status recomputes', async () => {
        const res = await request(app)
          .patch(`/api/eligibility-checks/${capitalCheckId}`)
          .set('Authorization', `Bearer ${maStaffToken}`)
          .send({ passed: true, notes: 'Verified manually against bank statement' });
        expect(res.statusCode).toBe(200);
        expect(res.body.passed).toBe(true);
        expect(res.body.source).toBe('manual_override');

        const tenderAfter = await Tender.findByPk(overrideTenderId);
        expect(tenderAfter.eligibility_status).toBe('eligible');
      });

      it('404s overriding a check that does not exist', async () => {
        const res = await request(app)
          .patch('/api/eligibility-checks/999999')
          .set('Authorization', `Bearer ${maStaffToken}`)
          .send({ passed: true, notes: 'irrelevant' });
        expect(res.statusCode).toBe(404);
      });
    });
  });

  describe('Eligibility Reference Data (Config)', () => {
    it('lists the current BCA grade limits', async () => {
      const res = await request(app)
        .get('/api/config/bca-grade-limits')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      const l1 = res.body.data.find((l) => l.grade === 'L1');
      expect(Number(l1.max_tender_value)).toBe(1500000);
    });

    it('blocks non ma_staff roles from updating a BCA grade limit (403)', async () => {
      const res = await request(app)
        .put('/api/config/bca-grade-limits/L2')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ max_tender_value: 6000000, effective_from: '2026-01-01' });
      expect(res.statusCode).toBe(403);
    });

    it('ma_staff can set a new BCA grade limit', async () => {
      const res = await request(app)
        .put('/api/config/bca-grade-limits/L2')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ max_tender_value: 6000000, effective_from: '2026-01-01' });
      expect(res.statusCode).toBe(200);
      expect(Number(res.body.max_tender_value)).toBe(6000000);

      const listRes = await request(app)
        .get('/api/config/bca-grade-limits')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      const l2 = listRes.body.data.find((l) => l.grade === 'L2');
      expect(Number(l2.max_tender_value)).toBe(6000000);
    });

    it('rejects an invalid grade in the URL (400 - validation)', async () => {
      const res = await request(app)
        .put('/api/config/bca-grade-limits/L9')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ max_tender_value: 1000, effective_from: '2026-01-01' });
      expect(res.statusCode).toBe(400);
    });

    it('lists eligibility thresholds', async () => {
      const res = await request(app)
        .get('/api/config/eligibility-thresholds')
        .set('Authorization', `Bearer ${evaluatorToken}`);
      expect(res.statusCode).toBe(200);
      const capital = res.body.data.find((t) => t.criterion_key === 'min_paid_up_capital');
      expect(Number(capital.threshold_value)).toBe(500000);
    });

    it('blocks non ma_staff roles from updating a threshold (403)', async () => {
      const res = await request(app)
        .put('/api/config/eligibility-thresholds/min_paid_up_capital')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ threshold_value: 750000 });
      expect(res.statusCode).toBe(403);
    });

    it('ma_staff can update an existing threshold', async () => {
      const res = await request(app)
        .put('/api/config/eligibility-thresholds/min_paid_up_capital')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ threshold_value: 750000 });
      expect(res.statusCode).toBe(200);
      expect(Number(res.body.threshold_value)).toBe(750000);

      // Restore for isolation from any other tests relying on the original value.
      await request(app)
        .put('/api/config/eligibility-thresholds/min_paid_up_capital')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ threshold_value: 500000 });
    });

    it('404s updating a threshold with an unknown criterion_key', async () => {
      const res = await request(app)
        .put('/api/config/eligibility-thresholds/not_a_real_criterion')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ threshold_value: 100 });
      expect(res.statusCode).toBe(404);
    });
  });
});
