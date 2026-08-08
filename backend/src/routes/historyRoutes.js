const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate, authorise } = require('../middlewares/auth');

// Restricted to report_preparer/management/ma_staff, matching routeConfig.jsx's
// /history route guard.
const historyRoles = authorise('report_preparer', 'management', 'ma_staff');

router.get(
    '/',
    authenticate, historyRoles,
    historyController.getHistoryEntries
);

router.delete(
    '/:id',
    authenticate, historyRoles,
    historyController.deleteHistoryEntry
);

module.exports = router;
