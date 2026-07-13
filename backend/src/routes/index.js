const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const tenderRoutes = require('./tenderRoutes');
const evaluationRoutes = require('./evaluationRoutes');
const evaluationCriteriaRoutes = require('./evaluationCriteriaRoutes');
const tenderEvaluationRoutes = require('./tenderEvaluationRoutes');
const boardPaperRoutes = require('./boardPaperRoutes');
const clarificationRoutes = require('./clarificationRoutes');
const proposalRoutes = require('./proposalRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
// tenderRoutes defines its own full paths (/tenders, /eligibility-checks, /config/...)
// since those aren't all nested under one shared prefix - see tenderRoutes.js.
router.use('/', tenderRoutes);
// Mounted separately from tenderRoutes so that file stays untouched - this only
// adds the /tenders/:tenderId/evaluations sub-resource.
router.use('/tenders/:tenderId/evaluations', tenderEvaluationRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/evaluation-criteria', evaluationCriteriaRoutes);
router.use('/boardpapers', boardPaperRoutes);
// clarificationRoutes defines its own full paths (/clarification-logs, /clarification-messages,
// /job-adjustment-requests, and /tenders/:tenderId/clarification-logs/...) since those
// aren't all nested under one shared prefix - see tenderRoutes.js for the same pattern.
router.use('/', clarificationRoutes);
router.use('/proposals', proposalRoutes);

module.exports = router;
