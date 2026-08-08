const express = require('express');
const router = express.Router();
const contractController = require('../controllers/ContractController');
const tenderController = require('../controllers/tenderController');
const validate = require('../middlewares/validate');
const { authenticate, authorise } = require('../middlewares/auth');
const {
  createContractSchema,
  updateContractSchema,
  contractIdParamsSchema
} = require('../validators/contractValidator');


// Tenders belonging to a contract
router.get('/:contractId/tenders', authenticate, tenderController.getTendersByContract);

// All authenticated roles can view contracts (routeConfig.jsx: ALL_ROLES);
// create/update/delete is ma_staff-only, matching the frontend's route guards
// on /contracts/new and /contracts/:id/edit.
router.get('/', authenticate, contractController.getAll);
router.get('/:id', authenticate, validate(contractIdParamsSchema), contractController.getById);
router.post('/', authenticate, authorise('ma_staff'), validate(createContractSchema), contractController.create);
router.put('/:id', authenticate, authorise('ma_staff'), validate(updateContractSchema), contractController.update);
router.delete('/:id', authenticate, authorise('ma_staff'), validate(contractIdParamsSchema), contractController.delete);

module.exports = router;

