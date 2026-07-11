const { Op } = require('sequelize');
const { EvaluationCriteria } = require('../models');

const round2 = (n) => Math.round(n * 100) / 100;

const sumWeights = (rows) => rows.reduce((sum, row) => sum + Number(row.weight_percentage), 0);

// Sum of all is_active:true criteria weights, optionally excluding one row
// (used when re-checking the total after editing that row).
async function getActiveWeightTotal(excludeId) {
  const where = { is_active: true };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const rows = await EvaluationCriteria.findAll({ where });
  return sumWeights(rows);
}

async function listCriteria(isActiveFilter) {
  const where = {};
  if (isActiveFilter !== undefined) {
    where.is_active = isActiveFilter;
  }
  const data = await EvaluationCriteria.findAll({ where, order: [['id', 'ASC']] });
  const activeWeightTotal = await getActiveWeightTotal();
  return { data, activeWeightTotal: round2(activeWeightTotal) };
}

// api-documentation.md endpoint 2: only blocks when the add would push the active
// sum OVER 100% - it does not require hitting exactly 100% on every single add,
// since criteria are typically built up one at a time.
async function createCriterion({ criteria_name, category, weight_percentage, created_by }) {
  const currentActiveTotal = await getActiveWeightTotal();
  const resultingTotal = currentActiveTotal + Number(weight_percentage);

  if (resultingTotal > 100) {
    const err = new Error('Adding this weight would push active criteria weights over 100%');
    err.status = 409;
    err.body = { current_active_total: round2(currentActiveTotal) };
    throw err;
  }

  return EvaluationCriteria.create({ criteria_name, category, weight_percentage, created_by });
}

// api-documentation.md endpoint 3: after an edit, the resulting active sum must
// equal exactly 100% (stricter than the create-time "not over 100%" rule).
async function updateCriterion(id, updates) {
  const criterion = await EvaluationCriteria.findByPk(id);
  if (!criterion) {
    const err = new Error('Evaluation criterion not found');
    err.status = 404;
    throw err;
  }

  if (updates.weight_percentage !== undefined && criterion.is_active) {
    const otherActiveTotal = await getActiveWeightTotal(id);
    const resultingTotal = otherActiveTotal + Number(updates.weight_percentage);
    if (Math.abs(resultingTotal - 100) > 0.01) {
      const err = new Error('Resulting active weight sum must equal 100%');
      err.status = 409;
      throw err;
    }
  }

  if (updates.criteria_name !== undefined) {
    criterion.criteria_name = updates.criteria_name;
  }
  if (updates.weight_percentage !== undefined) {
    criterion.weight_percentage = updates.weight_percentage;
  }

  await criterion.save();
  return criterion;
}

// Soft delete: past evaluations reference the weight that was in effect, so the
// row is deactivated, never removed.
async function deactivateCriterion(id) {
  const criterion = await EvaluationCriteria.findByPk(id);
  if (!criterion) {
    const err = new Error('Evaluation criterion not found');
    err.status = 404;
    throw err;
  }
  criterion.is_active = false;
  await criterion.save();
  return criterion;
}

module.exports = {
  getActiveWeightTotal,
  listCriteria,
  createCriterion,
  updateCriterion,
  deactivateCriterion
};
