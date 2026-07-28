const express = require('express');
const router  = express.Router();

// ── Route files ───────────────────────────────────────────────────────────────
const authRoutes              = require('./authRoutes');
const tenderRoutes            = require('./tenderRoutes');
const tenderEvaluationRoutes  = require('./tenderEvaluationRoutes');
const evaluationRoutes        = require('./evaluationRoutes');
const evaluationCriteriaRoutes = require('./evaluationCriteriaRoutes');
const boardPaperRoutes        = require('./boardPaperRoutes');
const clarificationRoutes     = require('./clarificationRoutes');
const proposalRoutes          = require('./proposalRoutes');
const dashboardRoutes         = require('./dashboardRoutes');
// Kai Xuan: Contract Opportunity CRUD
const contractRoutes          = require('./contractRoutes');

// ── Public routes ─────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Teammate routes (preserved exactly as pushed to remote) ───────────────────
// tenderRoutes defines its own full paths (/tenders, /eligibility-checks, /config/...)
router.use('/', tenderRoutes);
router.use('/tenders/:tenderId/evaluations', tenderEvaluationRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/evaluation-criteria', evaluationCriteriaRoutes);
router.use('/boardpapers', boardPaperRoutes);
router.use('/clarifications', clarificationRoutes);
router.use('/proposals', proposalRoutes);

// ── Kai Xuan's modules under /v1 ─────────────────────────────────────────────
// Contract CRUD and Dashboard are namespaced under /v1 to avoid collisions
// with teammate flat routes above.
const v1Router = express.Router();
v1Router.use('/contracts', contractRoutes);
v1Router.use('/dashboard', dashboardRoutes);

router.use('/v1', v1Router);

module.exports = router;
