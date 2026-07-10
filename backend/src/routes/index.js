const express = require('express');
const router = express.Router();
const dashboardRoutes = require('./dashboardRoutes');

router.use('/dashboard', dashboardRoutes);

module.exports = router;
