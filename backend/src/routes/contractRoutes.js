const express = require('express');
const router = express.Router();
const contractController = require('../controllers/ContractController');
const tenderController = require('../controllers/tenderController');
const validate = require('../middlewares/validate');
const {
  createContractSchema,
  updateContractSchema,
  contractIdParamsSchema
} = require('../validators/contractValidator');


// Tenders belonging to a contract
router.get('/:contractId/tenders', tenderController.getTendersByContract);

router.get('/', contractController.getAll);
router.get('/:id', validate(contractIdParamsSchema), contractController.getById);
router.post('/', validate(createContractSchema), contractController.create);
router.put('/:id', validate(updateContractSchema), contractController.update);
router.delete('/:id', validate(contractIdParamsSchema), contractController.delete);

module.exports = router;

