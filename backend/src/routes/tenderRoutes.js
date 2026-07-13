const express = require('express');
const router = express.Router();

const tenderController = require('../controllers/tenderController');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const { authenticate, authorise } = require('../middlewares/auth');
const {
  createTenderSchema,
  listTendersSchema,
  tenderIdParamsSchema,
  updateTenderSchema,
  uploadDocumentSchema,
  listDocumentsSchema,
  replaceDocumentSchema,
  eligibilityCheckIdParamsSchema,
  eligibilityOverrideSchema,
  bcaGradeParamsSchema,
  bcaGradeLimitUpdateSchema,
  eligibilityThresholdUpdateSchema
} = require('../validators/tenderValidator');

// Zheng Hong (Scope A): Tender CRUD, document upload, eligibility endpoints.
// Mounted at '/' (not '/tenders') in routes/index.js since eligibility-checks
// and config are sibling top-level resources, not nested under /tenders.

// --- Tender CRUD ---
router.post('/tenders', authenticate, authorise('ma_staff'), validate(createTenderSchema), tenderController.createTender);
router.get('/tenders', authenticate, validate(listTendersSchema), tenderController.listTenders);
router.get('/tenders/:id', authenticate, validate(tenderIdParamsSchema), tenderController.getTender);
router.patch('/tenders/:id', authenticate, authorise('ma_staff'), validate(updateTenderSchema), tenderController.updateTender);
router.delete('/tenders/:id', authenticate, authorise('ma_staff'), validate(tenderIdParamsSchema), tenderController.deleteTender);

// --- Tender Documents ---
router.post(
  '/tenders/:id/documents',
  authenticate,
  authorise('ma_staff'),
  upload.single('file'),
  validate(uploadDocumentSchema),
  tenderController.uploadDocument
);
router.get('/tenders/:id/documents', authenticate, validate(listDocumentsSchema), tenderController.listDocuments);
router.put(
  '/tenders/:id/documents/:documentId',
  authenticate,
  authorise('ma_staff'),
  upload.single('file'),
  validate(replaceDocumentSchema),
  tenderController.replaceDocument
);

// --- Tender Image ---
router.post(
  '/tenders/:id/image',
  authenticate,
  authorise('ma_staff'),
  upload.single('file'),
  validate(tenderIdParamsSchema),
  tenderController.uploadTenderImage
);

// --- Eligibility ---
router.post(
  '/tenders/:id/eligibility-check',
  authenticate,
  authorise('ma_staff'),
  validate(tenderIdParamsSchema),
  tenderController.triggerEligibilityCheck
);
router.get(
  '/tenders/:id/eligibility-checks',
  authenticate,
  validate(tenderIdParamsSchema),
  tenderController.listEligibilityChecks
);
router.patch(
  '/eligibility-checks/:id',
  authenticate,
  authorise('ma_staff', 'evaluator'),
  validate(eligibilityOverrideSchema),
  tenderController.overrideEligibilityCheck
);

// --- Eligibility Reference Data ---
router.get('/config/bca-grade-limits', authenticate, tenderController.listBcaGradeLimits);
router.put(
  '/config/bca-grade-limits/:grade',
  authenticate,
  authorise('ma_staff'),
  validate(bcaGradeLimitUpdateSchema),
  tenderController.updateBcaGradeLimit
);
router.get('/config/eligibility-thresholds', authenticate, tenderController.listEligibilityThresholds);
router.put(
  '/config/eligibility-thresholds/:criterionKey',
  authenticate,
  authorise('ma_staff'),
  validate(eligibilityThresholdUpdateSchema),
  tenderController.updateEligibilityThreshold
);

module.exports = router;
