const express = require('express');
// mergeParams so req.params.tenderId (from the /tenders/:tenderId/evaluations
// mount in routes/index.js) is visible here.
const router = express.Router({ mergeParams: true });
const evaluationController = require('../controllers/evaluationController');
const validate = require('../middlewares/validate');
const { authenticate, authorise } = require('../middlewares/auth');
const { createEvaluationSchema, tenderIdParamSchema } = require('../validators/evaluationValidator');

// Jerrold: create an evaluation from an existing tender, mounted under Zheng
// Hong's tender resource without touching his tenderRoutes.js stub.

// ma_staff can also create evaluations for this project's workflow (in
// addition to evaluator, who keeps existing access) - management stays
// restricted to the approval endpoints in evaluationRoutes.js.
router.post('/', authenticate, authorise('evaluator', 'ma_staff'), validate(createEvaluationSchema), evaluationController.createEvaluation);
router.get('/', authenticate, validate(tenderIdParamSchema), evaluationController.listForTender);

module.exports = router;
