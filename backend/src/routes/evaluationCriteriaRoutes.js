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

// Duplicate-cleanup admin actions - registered before the "/:id..." routes
// below purely for readability; the literal "duplicates" segment never
// collides with a numeric :id anyway. Preview never changes data; cleanup
// only hard-deletes rows the preview already marked safe (unused duplicates).
router.get('/duplicates/preview', authenticate, authorise('ma_staff'), evaluationCriteriaController.previewDuplicateCleanup);
router.post('/duplicates/cleanup', authenticate, authorise('ma_staff'), evaluationCriteriaController.runDuplicateCleanup);

router.get('/', authenticate, validate(listCriteriaSchema), evaluationCriteriaController.list);
router.post('/', authenticate, authorise('ma_staff'), validate(createCriteriaSchema), evaluationCriteriaController.create);
router.put('/:id', authenticate, authorise('ma_staff'), validate(updateCriteriaSchema), evaluationCriteriaController.update);
router.delete('/:id', authenticate, authorise('ma_staff'), validate(idOnlySchema), evaluationCriteriaController.deactivate);
router.post('/:id/reactivate', authenticate, authorise('ma_staff'), validate(idOnlySchema), evaluationCriteriaController.reactivate);
// Hard delete, distinct from the DELETE /:id soft-deactivate above - only
// succeeds when the criterion was never used by an evaluation (UC-B1 cleanup).
router.delete('/:id/permanent', authenticate, authorise('ma_staff'), validate(idOnlySchema), evaluationCriteriaController.destroyPermanently);

module.exports = router;
