const request = require('supertest');
const express = require('express');
const boardPaperRoutes = require('../../src/routes/boardPaperRoutes');
const proposalRoutes = require('../../src/routes/proposalRoutes');
const { sequelize, User, Tender, BoardPaper, Proposal } = require('../../src/models');
const authService = require('../../src/services/authService');

const app = express();
app.use(express.json());
app.use('/api/board-papers', boardPaperRoutes);
app.use('/api/proposals', proposalRoutes);

let reportPreparerToken;
let managementToken;
let maStaffToken;
let unauthorisedToken; // valid login, role not permitted for this scope

let tenderOneId; // eligible tender used for the main board paper flow

describe('Calista - Scope C: Board Papers & Proposal Generation', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const reportPreparer = await User.create({
      full_name: 'Calista Report Preparer', email: 'calista.preparer@test.local', password_hash: 'x', role: 'report_preparer'
    });
    const management = await User.create({
      full_name: 'Calista Management', email: 'calista.management@test.local', password_hash: 'x', role: 'management'
    });
    const maStaff = await User.create({
      full_name: 'Calista MA Staff', email: 'calista.mastaff@test.local', password_hash: 'x', role: 'ma_staff'
    });
    const evaluator = await User.create({
      full_name: 'Calista Evaluator', email: 'calista.evaluator@test.local', password_hash: 'x', role: 'evaluator'
    });

    reportPreparerToken = authService.signToken(reportPreparer);
    managementToken = authService.signToken(management);
    maStaffToken = authService.signToken(maStaff);
    unauthorisedToken = authService.signToken(evaluator);

    const tenderOne = await Tender.create({
      tender_ref_no: 'TC-CALISTA-001',
      vendor_name: 'Calista Eligible Vendor',
      submission_date: '2026-01-01',
      main_offer_price: 500000,
      eligibility_status: 'eligible',
      created_by: maStaff.id
    });
    tenderOneId = tenderOne.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Authentication & role gating', () => {
    it('rejects an unauthenticated board paper generation request (401)', async () => {
      const res = await request(app)
        .post('/api/board-papers/generate')
        .send({ tenderId: tenderOneId, title: 'Unauthed Board Paper', purpose: 'Approval Required' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects a board paper request from a role outside report_preparer/management/ma_staff (403)', async () => {
      const res = await request(app)
        .post('/api/board-papers/generate')
        .set('Authorization', `Bearer ${unauthorisedToken}`)
        .send({ tenderId: tenderOneId, title: 'Evaluator Board Paper', purpose: 'Approval Required' });
      expect(res.statusCode).toBe(403);
    });

    it('rejects an unauthenticated proposal generation request (401)', async () => {
      const res = await request(app)
        .post('/api/proposals/generate')
        .send({});
      expect(res.statusCode).toBe(401);
    });

    it('rejects a proposal request from a role outside report_preparer/management/ma_staff (403)', async () => {
      const res = await request(app)
        .post('/api/proposals/generate')
        .set('Authorization', `Bearer ${unauthorisedToken}`)
        .send({});
      expect(res.statusCode).toBe(403);
    });

    it('rejects a board paper list request with an invalid token (401)', async () => {
      const res = await request(app)
        .get('/api/board-papers')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Proposal generation with no board paper on file yet', () => {
    it('returns 400 when no boardPaperId is supplied and no board paper exists', async () => {
      const res = await request(app)
        .post('/api/proposals/generate')
        .set('Authorization', `Bearer ${reportPreparerToken}`)
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Unable to create proposal because no board paper is available.');
    });
  });

  describe('Board Paper generation (AI narrative, no OPENAI_API_KEY -> deterministic fallback)', () => {
    it('rejects generation without a tenderId (400)', async () => {
      const res = await request(app)
        .post('/api/board-papers/generate')
        .set('Authorization', `Bearer ${reportPreparerToken}`)
        .send({ title: 'No Tender Board Paper', purpose: 'Approval Required' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Tender is required.');
    });

    it('returns 404 when the referenced tender does not exist', async () => {
      const res = await request(app)
        .post('/api/board-papers/generate')
        .set('Authorization', `Bearer ${reportPreparerToken}`)
        .send({ tenderId: 999999, title: 'Ghost Tender Board Paper', purpose: 'Approval Required' });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Tender not found');
    });

    let generatedBoardPaperId;

    it('generates a board paper from a real tender with a deterministic AI narrative (report_preparer)', async () => {
      const res = await request(app)
        .post('/api/board-papers/generate')
        .set('Authorization', `Bearer ${reportPreparerToken}`)
        .send({
          tenderId: tenderOneId,
          title: 'Calista Eligible Vendor Board Paper',
          purpose: 'Approval Required',
          preparedBy: 'Calista Report Preparer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Board Paper generated successfully.');

      const report = res.body.report;
      generatedBoardPaperId = report.id;

      // Structural fields
      expect(report.tenderId).toBe(tenderOneId);
      expect(report.title).toBe('Calista Eligible Vendor Board Paper');
      expect(report.purpose).toBe('Approval Required');
      expect(report.status).toBe('Generated');
      expect(report.generatedBy).toBe('EM Services AI Platform');

      // Confidence is a 0-100 integer computed from the real tender data.
      expect(Number.isInteger(report.confidence)).toBe(true);
      expect(report.confidence).toBeGreaterThanOrEqual(0);
      expect(report.confidence).toBeLessThanOrEqual(100);
      expect(report.score).toBe(`${report.confidence} / 100`);

      // Deterministic narrative fallback (no OPENAI_API_KEY set in test env) -
      // built from the real tender's ref no / vendor name / confidence score,
      // never invented text, so these must be traceable to the actual tender.
      expect(report.aiSummary).toContain('TC-CALISTA-001');
      expect(report.aiSummary).toContain('Calista Eligible Vendor');
      expect(report.aiSummary).toContain(`${report.confidence}%`);
      expect(['Low', 'Medium', 'High']).toContain(report.aiRiskLevel);

      // Risk level bracket must be internally consistent with the confidence score.
      if (report.confidence >= 75) expect(report.aiRiskLevel).toBe('Low');
      else if (report.confidence >= 50) expect(report.aiRiskLevel).toBe('Medium');
      else expect(report.aiRiskLevel).toBe('High');

      expect(report.aiRecommendation).toContain('Calista Eligible Vendor');
      expect(report.finalRecommendation).toBe(report.aiRecommendation);
    });

    it('ma_staff can also generate a board paper (role widened beyond report_preparer)', async () => {
      const res = await request(app)
        .post('/api/board-papers/generate')
        .set('Authorization', `Bearer ${maStaffToken}`)
        .send({ tenderId: tenderOneId, title: 'MA Staff Board Paper', purpose: 'Information Only' });
      expect(res.statusCode).toBe(201);
      expect(res.body.report.purpose).toBe('Information Only');

      // Clean up so it doesn't interfere with the "list" count assertions below.
      await BoardPaper.destroy({ where: { id: res.body.report.id } });
    });

    it('management can also generate a board paper (role widened beyond report_preparer)', async () => {
      const res = await request(app)
        .post('/api/board-papers/generate')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ tenderId: tenderOneId, title: 'Management Board Paper', purpose: 'Recommendation' });
      expect(res.statusCode).toBe(201);

      await BoardPaper.destroy({ where: { id: res.body.report.id } });
    });

    describe('Listing and retrieving generated board papers', () => {
      it('lists all board papers, most recent first', async () => {
        const res = await request(app)
          .get('/api/board-papers')
          .set('Authorization', `Bearer ${maStaffToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((bp) => bp.id === generatedBoardPaperId)).toBe(true);
      });

      it('retrieves a single board paper by id', async () => {
        const res = await request(app)
          .get(`/api/board-papers/${generatedBoardPaperId}`)
          .set('Authorization', `Bearer ${reportPreparerToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(generatedBoardPaperId);
        expect(res.body.title).toBe('Calista Eligible Vendor Board Paper');
      });

      it('returns 404 for a board paper that does not exist', async () => {
        const res = await request(app)
          .get('/api/board-papers/999999')
          .set('Authorization', `Bearer ${reportPreparerToken}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Board Paper not found.');
      });
    });

    describe('Updating a generated board paper', () => {
      it('updates editable fields on the board paper', async () => {
        const res = await request(app)
          .put(`/api/board-papers/${generatedBoardPaperId}`)
          .set('Authorization', `Bearer ${reportPreparerToken}`)
          .send({ title: 'Calista Eligible Vendor Board Paper (Revised)', status: 'Approved' });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Board Paper updated successfully.');
        expect(res.body.report.title).toBe('Calista Eligible Vendor Board Paper (Revised)');
        expect(res.body.report.status).toBe('Approved');

        const detail = await request(app)
          .get(`/api/board-papers/${generatedBoardPaperId}`)
          .set('Authorization', `Bearer ${maStaffToken}`);
        expect(detail.body.title).toBe('Calista Eligible Vendor Board Paper (Revised)');
        expect(detail.body.status).toBe('Approved');
      });

      it('returns 404 when updating a board paper that does not exist', async () => {
        const res = await request(app)
          .put('/api/board-papers/999999')
          .set('Authorization', `Bearer ${reportPreparerToken}`)
          .send({ title: 'Ghost Update' });
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Board Paper not found.');
      });
    });

    describe('Board paper PDF export placeholder', () => {
      it('returns the not-yet-implemented placeholder message for an existing board paper', async () => {
        const res = await request(app)
          .get(`/api/board-papers/pdf/${generatedBoardPaperId}`)
          .set('Authorization', `Bearer ${reportPreparerToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('PDF generation coming soon.');
      });

      it('returns 404 for a nonexistent board paper', async () => {
        const res = await request(app)
          .get('/api/board-papers/pdf/999999')
          .set('Authorization', `Bearer ${reportPreparerToken}`);
        expect(res.statusCode).toBe(404);
      });
    });

    describe('Generating a proposal from the board paper', () => {
      let generatedProposalId;

      it('generates a proposal from an explicit boardPaperId', async () => {
        const res = await request(app)
          .post('/api/proposals/generate')
          .set('Authorization', `Bearer ${reportPreparerToken}`)
          .send({ boardPaperId: generatedBoardPaperId });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Proposal generated successfully.');

        const proposal = res.body.proposal;
        generatedProposalId = proposal.id;

        expect(proposal.boardPaperId).toBe(generatedBoardPaperId);
        // Title/type are derived from the board paper when not supplied explicitly:
        // "<title minus trailing 'Board Paper'> Proposal" / "<purpose> for Award".
        // The board paper was renamed to "...Board Paper (Revised)" in the update
        // test above, so " Board Paper" is no longer a trailing suffix and is left in place.
        expect(proposal.proposalTitle).toBe('Calista Eligible Vendor Board Paper (Revised) Proposal');
        expect(proposal.proposalType).toBe('Approval Required for Award');
        expect(proposal.status).toBe('Generated');

        // Content is assembled from the real tender/board paper data - not invented.
        expect(proposal.sections.content).toContain('Executive Summary');
        expect(proposal.sections.content).toContain('Calista Eligible Vendor');
        expect(proposal.sections.content).toContain('Calista Eligible Vendor Board Paper (Revised)');
      });

      it('honours an explicit proposalTitle/proposalType override', async () => {
        const res = await request(app)
          .post('/api/proposals/generate')
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            boardPaperId: generatedBoardPaperId,
            proposalTitle: 'Custom Proposal Title',
            proposalType: 'Custom Type',
            language: 'English'
          });
        expect(res.statusCode).toBe(201);
        expect(res.body.proposal.proposalTitle).toBe('Custom Proposal Title');
        expect(res.body.proposal.proposalType).toBe('Custom Type');

        await Proposal.destroy({ where: { id: res.body.proposal.id } });
      });

      describe('Listing and retrieving generated proposals', () => {
        it('lists all proposals, most recently generated first', async () => {
          const res = await request(app)
            .get('/api/proposals')
            .set('Authorization', `Bearer ${maStaffToken}`);
          expect(res.statusCode).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.some((p) => p.id === generatedProposalId)).toBe(true);
        });

        it('retrieves a single proposal by id', async () => {
          const res = await request(app)
            .get(`/api/proposals/${generatedProposalId}`)
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(res.statusCode).toBe(200);
          expect(res.body.id).toBe(generatedProposalId);
        });

        it('returns 404 for a proposal that does not exist', async () => {
          const res = await request(app)
            .get('/api/proposals/999999')
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(res.statusCode).toBe(404);
          expect(res.body.message).toBe('Proposal not found.');
        });
      });

      describe('Updating a generated proposal', () => {
        it('updates editable fields on the proposal', async () => {
          const res = await request(app)
            .put(`/api/proposals/${generatedProposalId}`)
            .set('Authorization', `Bearer ${reportPreparerToken}`)
            .send({ status: 'Approved', proposalTitle: 'Calista Proposal (Final)' });
          expect(res.statusCode).toBe(200);
          expect(res.body.message).toBe('Proposal updated successfully.');
          expect(res.body.proposal.status).toBe('Approved');
          expect(res.body.proposal.proposalTitle).toBe('Calista Proposal (Final)');
        });

        it('returns 404 when updating a proposal that does not exist', async () => {
          const res = await request(app)
            .put('/api/proposals/999999')
            .set('Authorization', `Bearer ${reportPreparerToken}`)
            .send({ status: 'Approved' });
          expect(res.statusCode).toBe(404);
        });
      });

      describe('Proposal PDF/DOCX export placeholders', () => {
        it('returns the PDF placeholder for an existing proposal', async () => {
          const res = await request(app)
            .get(`/api/proposals/pdf/${generatedProposalId}`)
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(res.statusCode).toBe(200);
          expect(res.body.message).toBe('PDF generation will be connected later.');
        });

        it('returns the DOCX placeholder for an existing proposal', async () => {
          const res = await request(app)
            .get(`/api/proposals/docx/${generatedProposalId}`)
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(res.statusCode).toBe(200);
          expect(res.body.message).toBe('DOCX generation will be connected later.');
        });

        it('returns 404 for a nonexistent proposal on both export routes', async () => {
          const pdfRes = await request(app)
            .get('/api/proposals/pdf/999999')
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(pdfRes.statusCode).toBe(404);

          const docxRes = await request(app)
            .get('/api/proposals/docx/999999')
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(docxRes.statusCode).toBe(404);
        });
      });

      describe('Deleting a proposal', () => {
        it('deletes the proposal and it is no longer retrievable', async () => {
          const delRes = await request(app)
            .delete(`/api/proposals/${generatedProposalId}`)
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(delRes.statusCode).toBe(200);
          expect(delRes.body.message).toBe('Proposal deleted successfully.');

          const getRes = await request(app)
            .get(`/api/proposals/${generatedProposalId}`)
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(getRes.statusCode).toBe(404);
        });

        it('returns 404 when deleting a proposal that does not exist', async () => {
          const res = await request(app)
            .delete('/api/proposals/999999')
            .set('Authorization', `Bearer ${reportPreparerToken}`);
          expect(res.statusCode).toBe(404);
        });
      });
    });

    describe('Deleting a board paper', () => {
      it('deletes the board paper and it is no longer retrievable', async () => {
        const delRes = await request(app)
          .delete(`/api/board-papers/${generatedBoardPaperId}`)
          .set('Authorization', `Bearer ${reportPreparerToken}`);
        expect(delRes.statusCode).toBe(200);
        expect(delRes.body.message).toBe('Board Paper deleted successfully.');

        const getRes = await request(app)
          .get(`/api/board-papers/${generatedBoardPaperId}`)
          .set('Authorization', `Bearer ${reportPreparerToken}`);
        expect(getRes.statusCode).toBe(404);
      });

      it('returns 404 when deleting a board paper that does not exist', async () => {
        const res = await request(app)
          .delete('/api/board-papers/999999')
          .set('Authorization', `Bearer ${reportPreparerToken}`);
        expect(res.statusCode).toBe(404);
      });
    });
  });

  describe('Proposal generation falls back to the latest board paper when boardPaperId is omitted', () => {
    let fallbackBoardPaperId;

    beforeAll(async () => {
      // Isolate this scenario: remove every other board paper so "latest" is
      // unambiguous, then create exactly one fresh board paper to fall back to.
      await BoardPaper.destroy({ where: {} });

      const fallbackTender = await Tender.create({
        tender_ref_no: 'TC-CALISTA-FALLBACK',
        vendor_name: 'Fallback Vendor',
        submission_date: '2026-01-01',
        main_offer_price: 250000,
        eligibility_status: 'eligible',
        created_by: 1
      });

      const genRes = await request(app)
        .post('/api/board-papers/generate')
        .set('Authorization', `Bearer ${reportPreparerToken}`)
        .send({ tenderId: fallbackTender.id, title: 'Fallback Vendor Board Paper', purpose: 'Approval Required' });
      fallbackBoardPaperId = genRes.body.report.id;
    });

    it('uses the most recently generated board paper when no boardPaperId is supplied', async () => {
      const res = await request(app)
        .post('/api/proposals/generate')
        .set('Authorization', `Bearer ${reportPreparerToken}`)
        .send({});
      expect(res.statusCode).toBe(201);
      expect(res.body.proposal.boardPaperId).toBe(fallbackBoardPaperId);
      expect(res.body.proposal.proposalTitle).toBe('Fallback Vendor Proposal');
    });
  });
});
