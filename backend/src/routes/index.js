const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const tenderRoutes = require('./tenderRoutes');
const evaluationRoutes = require('./evaluationRoutes');
const boardPaperRoutes = require('./boardPaperRoutes');
const clarificationRoutes = require('./clarificationRoutes');
const proposalRoutes = require('./proposalRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tenders', tenderRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/boardpapers', boardPaperRoutes);
router.use('/clarifications', clarificationRoutes);
router.use('/proposals', proposalRoutes);

module.exports = router;
