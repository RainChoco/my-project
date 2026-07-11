const evaluationCriteriaService = require('../services/evaluationCriteriaService');

const parseIsActive = (value) => {
  if (value === undefined) return undefined;
  return value === 'true' || value === true;
};

const handleError = (res, error, label) => {
  if (error.status) {
    return res.status(error.status).json({ status: 'error', message: error.message, ...(error.body || {}) });
  }
  console.error(`Error in ${label}:`, error);
  return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
};

const list = async (req, res) => {
  try {
    const isActive = parseIsActive(req.query.is_active);
    const { data, activeWeightTotal } = await evaluationCriteriaService.listCriteria(isActive);
    res.status(200).json({ data, active_weight_total: activeWeightTotal });
  } catch (error) {
    handleError(res, error, 'evaluationCriteria.list');
  }
};

const create = async (req, res) => {
  try {
    const { criteria_name, category, weight_percentage } = req.body;
    const criterion = await evaluationCriteriaService.createCriterion({
      criteria_name,
      category,
      weight_percentage,
      created_by: req.user.id
    });
    res.status(201).json(criterion);
  } catch (error) {
    handleError(res, error, 'evaluationCriteria.create');
  }
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const criterion = await evaluationCriteriaService.updateCriterion(id, req.body);
    res.status(200).json(criterion);
  } catch (error) {
    handleError(res, error, 'evaluationCriteria.update');
  }
};

const deactivate = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const criterion = await evaluationCriteriaService.deactivateCriterion(id);
    res.status(200).json({ id: criterion.id, is_active: criterion.is_active, updated_at: criterion.updated_at });
  } catch (error) {
    handleError(res, error, 'evaluationCriteria.deactivate');
  }
};

module.exports = { list, create, update, deactivate };
