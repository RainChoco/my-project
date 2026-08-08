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
const historyRoutes           = require('./historyRoutes');
const dashboardRoutes         = require('./dashboardRoutes');
const notificationRoutes      = require('./notificationRoutes');
// Kai Xuan: Contract Opportunity CRUD
const contractRoutes          = require('./contractRoutes');

// ── Public routes ─────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

// ── Teammate routes (preserved exactly as pushed to remote) ───────────────────
// tenderRoutes defines its own full paths (/tenders, /eligibility-checks, /config/...)
// since those aren't all nested under one shared prefix - see tenderRoutes.js.
router.use('/', tenderRoutes);
// Mounted separately from tenderRoutes so that file stays untouched - this only
// adds the /tenders/:tenderId/evaluations sub-resource.
router.use('/tenders/:tenderId/evaluations', tenderEvaluationRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/evaluation-criteria', evaluationCriteriaRoutes);
router.use('/boardpapers', boardPaperRoutes);
router.use('/clarifications', clarificationRoutes);
router.use('/proposals', proposalRoutes);
router.use('/history', historyRoutes);

// ── Kai Xuan's modules under /v1 ─────────────────────────────────────────────
// Contract CRUD and Dashboard are namespaced under /v1 to avoid collisions
// with teammate flat routes above. dashboardRoutes is also mounted at the flat
// /dashboard path above for backwards compatibility with existing callers.
const v1Router = express.Router();
v1Router.use('/contracts', contractRoutes);
v1Router.use('/dashboard', dashboardRoutes);

router.use('/v1', v1Router);

module.exports = router;
