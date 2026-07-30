const express = require('express');
const router = express.Router();
const contractController = require('../controllers/ContractController');
const tenderController = require('../controllers/tenderController');


// Tenders belonging to a contract
router.get('/:contractId/tenders', tenderController.getTendersByContract);

router.get('/', contractController.getAll);
router.get('/:id', contractController.getById);
router.post('/', contractController.create);
router.put('/:id', contractController.update);
router.delete('/:id', contractController.delete);

module.exports = router;

