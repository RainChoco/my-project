const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const approvalController = require('../controllers/approvalController');
const validate = require('../middlewares/validate');
const { authenticate, authorise } = require('../middlewares/auth');
const { idParamSchema, confirmInputsSchema, reprocessSchema } = require('../validators/evaluationValidator');
const { approvalIdParamSchema, createApprovalSchema } = require('../validators/approvalValidator');

// Jerrold: PQM scoring (UC-B5/B6, UC-B11) and Approval Process (UC-B9/B10).
// Risk Assessment & Mitigation Matrix endpoints (api-documentation.md #10-12)
// are out of Jerrold's confirmed scope and are intentionally not implemented here.

router.get('/:id', authenticate, validate(idParamSchema), evaluationController.getDetail);
router.patch('/:id/confirm-inputs', authenticate, authorise('evaluator'), validate(confirmInputsSchema), evaluationController.confirmInputs);
router.post('/:id/reprocess', authenticate, authorise('evaluator'), validate(reprocessSchema), evaluationController.reprocess);

router.post('/:id/approvals', authenticate, authorise('management'), validate(createApprovalSchema), approvalController.create);
router.get('/:id/approvals', authenticate, validate(approvalIdParamSchema), approvalController.list);

module.exports = router;
