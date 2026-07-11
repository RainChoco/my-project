const express = require('express');
// mergeParams so req.params.tenderId (from the /tenders/:tenderId/evaluations
// mount in routes/index.js) is visible here.
const router = express.Router({ mergeParams: true });
const evaluationController = require('../controllers/evaluationController');
const validate = require('../middlewares/validate');
const { authenticate, authorise } = require('../middlewares/auth');
const { createEvaluationSchema, tenderIdParamSchema } = require('../validators/evaluationValidator');

// Jerrold: Processing Tender Form (UC-B4), mounted under Zheng Hong's tender
// resource without touching his tenderRoutes.js stub.

router.post('/', authenticate, authorise('evaluator'), validate(createEvaluationSchema), evaluationController.processForEvaluation);
router.get('/', authenticate, validate(tenderIdParamSchema), evaluationController.listForTender);

module.exports = router;
