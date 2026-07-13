const express = require('express');
const router = express.Router();

const clarificationController = require('../controllers/clarificationController');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const { authenticate, authorise } = require('../middlewares/auth');
const {
  detectDeviationSchema,
  listClarificationLogsSchema,
  clarificationLogIdParamsSchema,
  draftMessageSchema,
  editMessageSchema,
  approveMessageSchema,
  sendClarificationSchema,
  recordResponseSchema,
  addAttachmentSchema,
  createJobAdjustmentRequestSchema,
  listJobAdjustmentRequestsSchema,
  updateJobAdjustmentRequestSchema,
  jobAdjustmentIdParamsSchema,
  resendSchema,
  escalateSchema,
  resolveSchema
} = require('../validators/clarificationValidator');

// Sulaiman (Scope D): Clarification log, dispatch, and job adjustment request endpoints.
// Mounted at '/' (like tenderRoutes) since these paths aren't all nested under one
// shared prefix - see design/sulaiman/api-documentation.md for the full contract.

// --- Pricing Deviation Detection ---
router.post(
  '/tenders/:tenderId/clarification-logs/detect-deviation',
  authenticate,
  authorise('ma_staff'),
  validate(detectDeviationSchema),
  clarificationController.detectDeviation
);

// --- Clarification Logs ---
router.get('/clarification-logs', authenticate, validate(listClarificationLogsSchema), clarificationController.listClarificationLogs);
router.get('/clarification-logs/:id', authenticate, validate(clarificationLogIdParamsSchema), clarificationController.getClarificationLog);

// --- Draft, Review & Dispatch ---
router.post(
  '/clarification-logs/:id/draft-message',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(draftMessageSchema),
  clarificationController.draftMessage
);
router.patch(
  '/clarification-messages/:messageId',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(editMessageSchema),
  clarificationController.editMessage
);
router.post(
  '/clarification-messages/:messageId/approve',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(approveMessageSchema),
  clarificationController.approveMessage
);
router.post(
  '/clarification-logs/:id/send',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(sendClarificationSchema),
  clarificationController.sendClarification
);

// --- Vendor Responses & Attachments ---
router.post(
  '/clarification-logs/:id/responses',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(recordResponseSchema),
  clarificationController.recordResponse
);
router.post(
  '/clarification-messages/:messageId/attachments',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  upload.single('file'),
  validate(addAttachmentSchema),
  clarificationController.addAttachment
);

// --- Job Adjustment Requests ---
router.post(
  '/clarification-logs/:id/job-adjustment-requests',
  authenticate,
  authorise('vendor_liaison'),
  validate(createJobAdjustmentRequestSchema),
  clarificationController.createJobAdjustmentRequest
);
router.get(
  '/job-adjustment-requests',
  authenticate,
  validate(listJobAdjustmentRequestsSchema),
  clarificationController.listJobAdjustmentRequests
);
router.patch(
  '/job-adjustment-requests/:id',
  authenticate,
  authorise('ma_staff'),
  validate(updateJobAdjustmentRequestSchema),
  clarificationController.updateJobAdjustmentRequest
);
router.post(
  '/job-adjustment-requests/:id/follow-up-notification',
  authenticate,
  authorise('vendor_liaison'),
  validate(jobAdjustmentIdParamsSchema),
  clarificationController.createFollowUpNotification
);

// --- Resend, Escalate & Resolve ---
router.post(
  '/clarification-logs/:id/resend',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(resendSchema),
  clarificationController.resendClarification
);
router.post(
  '/clarification-logs/:id/escalate',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(escalateSchema),
  clarificationController.escalateClarification
);
router.post(
  '/clarification-logs/:id/resolve',
  authenticate,
  authorise('ma_staff', 'vendor_liaison'),
  validate(resolveSchema),
  clarificationController.resolveClarification
);

module.exports = router;
