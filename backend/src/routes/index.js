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
router.use('/tenders', tenderRoutes);
// Mounted separately from tenderRoutes (Zheng Hong's stub) so his file stays
// untouched - this only adds the /tenders/:tenderId/evaluations sub-resource.
router.use('/tenders/:tenderId/evaluations', tenderEvaluationRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/evaluation-criteria', evaluationCriteriaRoutes);
router.use('/boardpapers', boardPaperRoutes);
router.use('/clarifications', clarificationRoutes);
router.use('/proposals', proposalRoutes);

module.exports = router;
