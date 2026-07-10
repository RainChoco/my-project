const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const validate = require('../middlewares/validate');
const { getRankingsSchema, archiveSchema } = require('../validators/dashboardValidator');

router.get('/kpis', dashboardController.getKPIs);
router.get('/rankings', validate(getRankingsSchema), dashboardController.getRankings);
router.post('/archive', validate(archiveSchema), dashboardController.archiveRankings);

module.exports = router;
