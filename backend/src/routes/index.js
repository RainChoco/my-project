const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const tenderRoutes = require('./tenderRoutes');
const evaluationRoutes = require('./evaluationRoutes');
const boardPaperRoutes = require('./boardPaperRoutes');
const clarificationRoutes = require('./clarificationRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
// tenderRoutes defines its own full paths (/tenders, /eligibility-checks, /config/...)
// since those aren't all nested under one shared prefix - see tenderRoutes.js.
router.use('/', tenderRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/boardpapers', boardPaperRoutes);
router.use('/clarifications', clarificationRoutes);

module.exports = router;
