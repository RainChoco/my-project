const express = require('express');
const router = express.Router();
const contractController = require('../controllers/ContractController');
const tenderController = require('../controllers/tenderController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, contractController.getAll);
router.get('/:id', authenticate, contractController.getById);
router.post('/', authenticate, contractController.create);
router.put('/:id', authenticate, contractController.update);
router.delete('/:id', authenticate, contractController.delete);

// Tenders belonging to a contract
router.get('/:contractId/tenders', authenticate, tenderController.getTendersByContract);

module.exports = router;
