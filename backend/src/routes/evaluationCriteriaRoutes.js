const express = require('express');
const router = express.Router();
const evaluationCriteriaController = require('../controllers/evaluationCriteriaController');
const validate = require('../middlewares/validate');
const { authenticate, authorise } = require('../middlewares/auth');
const {
  listCriteriaSchema,
  createCriteriaSchema,
  updateCriteriaSchema,
  idOnlySchema
} = require('../validators/evaluationCriteriaValidator');

// Jerrold: Evaluation Criteria (UC-B1/B2/B3).

router.get('/', authenticate, validate(listCriteriaSchema), evaluationCriteriaController.list);
router.post('/', authenticate, authorise('ma_staff'), validate(createCriteriaSchema), evaluationCriteriaController.create);
router.put('/:id', authenticate, authorise('ma_staff'), validate(updateCriteriaSchema), evaluationCriteriaController.update);
router.delete('/:id', authenticate, authorise('ma_staff'), validate(idOnlySchema), evaluationCriteriaController.deactivate);

module.exports = router;
