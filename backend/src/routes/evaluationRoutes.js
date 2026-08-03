const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const approvalController = require('../controllers/approvalController');
const validate = require('../middlewares/validate');
const { authenticate, authorise } = require('../middlewares/auth');
const {
  idParamSchema,
  saveScoresSchema,
  submitSchema,
  reprocessSchema,
  listCompletedSchema
} = require('../validators/evaluationValidator');
const { approvalIdParamSchema, createApprovalSchema } = require('../validators/approvalValidator');

// Jerrold: manual criterion scoring (UC-B4/B5/B6, UC-B11) and Approval Process
// (UC-B9/B10). Risk Assessment & Mitigation Matrix endpoints (api-documentation.md
// #10-12) are out of Jerrold's confirmed scope and are intentionally not implemented here.

router.get('/', authenticate, validate(listCompletedSchema), evaluationController.listCompleted);
router.get('/:id', authenticate, validate(idParamSchema), evaluationController.getDetail);
router.patch('/:id/scores', authenticate, authorise('evaluator'), validate(saveScoresSchema), evaluationController.saveDraftScores);
router.post('/:id/submit', authenticate, authorise('evaluator'), validate(submitSchema), evaluationController.submitEvaluation);
router.post('/:id/reprocess', authenticate, authorise('evaluator'), validate(reprocessSchema), evaluationController.reprocess);

router.post('/:id/approvals', authenticate, authorise('management'), validate(createApprovalSchema), approvalController.create);
router.get('/:id/approvals', authenticate, validate(approvalIdParamSchema), approvalController.list);

module.exports = router;
