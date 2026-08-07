const { Op } = require('sequelize');
const { EvaluationCriteria, EvaluationCriterionScore } = require('../models');

const round2 = (n) => Math.round(n * 100) / 100;

const sumWeights = (rows) => rows.reduce((sum, row) => sum + Number(row.weight_percentage), 0);
const normalizeName = (name) => name.trim().toLowerCase();

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

// Case-insensitive, whitespace-trimmed name match - "Quality of Work",
// "quality of work", and " Quality of Work " are all the same criterion.
// When legacy data has multiple rows sharing a name (e.g. old inactive
// duplicates alongside a current active one), the active record always wins -
// it's the one that actually matters for weight/scoring, so it must be what
// duplicate checks and reactivate offers point to, not just whichever row
// happens to be first.
async function findByNormalizedName(name) {
  const normalized = normalizeName(name);
  const all = await EvaluationCriteria.findAll();
  const matches = all.filter((c) => normalizeName(c.criteria_name) === normalized);
  return matches.find((c) => c.is_active) ?? matches[0] ?? null;
}

async function listCriteria(isActiveFilter) {
  const where = {};
  if (isActiveFilter !== undefined) {
    where.is_active = isActiveFilter;
  }
  const [rows, scoreRows] = await Promise.all([
    EvaluationCriteria.findAll({ where, order: [['id', 'ASC']] }),
    EvaluationCriterionScore.findAll({ attributes: ['evaluation_criteria_id'] })
  ]);
  const usedIds = new Set(scoreRows.map((r) => r.evaluation_criteria_id));

  const nameCounts = new Map();
  rows.forEach((row) => {
    const key = normalizeName(row.criteria_name);
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  });

  const data = rows.map((row) => {
    const json = row.toJSON();
    json.is_used = usedIds.has(row.id);
    json.is_duplicate_name = nameCounts.get(normalizeName(row.criteria_name)) > 1;
    return json;
  });

  const activeWeightTotal = await getActiveWeightTotal();
  return { data, activeWeightTotal: round2(activeWeightTotal) };
}

// api-documentation.md endpoint 2: only blocks when the add would push the active
// sum OVER 100% - it does not require hitting exactly 100% on every single add,
// since criteria are typically built up one at a time.
async function createCriterion({ criteria_name, category, description, weight_percentage, created_by }) {
  const duplicate = await findByNormalizedName(criteria_name);
  if (duplicate) {
    const message = duplicate.is_active
      ? `An active criterion named '${duplicate.criteria_name.trim()}' already exists.`
      : `A criterion named '${duplicate.criteria_name.trim()}' already exists.`;
    const err = new Error(message);
    err.status = 409;
    err.body = {
      error: 'duplicate_criterion_name',
      existing_criterion: { id: duplicate.id, criteria_name: duplicate.criteria_name, is_active: duplicate.is_active }
    };
    throw err;
  }

  const currentActiveTotal = await getActiveWeightTotal();
  const resultingTotal = currentActiveTotal + Number(weight_percentage);

  if (resultingTotal > 100) {
    const err = new Error('Adding this weight would push active criteria weights over 100%');
    err.status = 409;
    err.body = { current_active_total: round2(currentActiveTotal) };
    throw err;
  }

  return EvaluationCriteria.create({ criteria_name, category, description, weight_percentage, created_by });
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
  if (updates.description !== undefined) {
    criterion.description = updates.description;
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

// Undoes a deactivate. Subject to the same "not over 100%" rule as create,
// since reactivating adds this criterion's weight back to the active total.
async function reactivateCriterion(id) {
  const criterion = await EvaluationCriteria.findByPk(id);
  if (!criterion) {
    const err = new Error('Evaluation criterion not found');
    err.status = 404;
    throw err;
  }
  if (criterion.is_active) {
    return criterion;
  }

  const currentActiveTotal = await getActiveWeightTotal();
  const resultingTotal = currentActiveTotal + Number(criterion.weight_percentage);
  if (resultingTotal > 100) {
    const err = new Error('Reactivating this criterion would push active criteria weights over 100%');
    err.status = 409;
    err.body = { current_active_total: round2(currentActiveTotal) };
    throw err;
  }

  criterion.is_active = true;
  await criterion.save();
  return criterion;
}

// Hard delete - only allowed when the criterion was never referenced by any
// evaluation_criterion_scores row (i.e. never used to score a tender). Used
// criteria must go through deactivateCriterion instead, so historical
// evaluation snapshots are never broken.
async function deleteCriterionPermanently(id) {
  const criterion = await EvaluationCriteria.findByPk(id);
  if (!criterion) {
    const err = new Error('Evaluation criterion not found');
    err.status = 404;
    throw err;
  }

  const usageCount = await EvaluationCriterionScore.count({ where: { evaluation_criteria_id: id } });
  if (usageCount > 0) {
    const err = new Error(
      'This criterion has been used in an evaluation and cannot be permanently deleted. Deactivate it instead to preserve evaluation history.'
    );
    err.status = 409;
    err.body = { error: 'criterion_in_use' };
    throw err;
  }

  const { id: deletedId, criteria_name } = criterion;
  await criterion.destroy();
  return { id: deletedId, criteria_name };
}

// Groups every criterion by normalized name and works out, for each group of
// 2+ rows, which single row should be treated as the "current" one and which
// rows are safe to hard-delete. Read-only - computes a plan, changes nothing.
// One logical criterion name should map to one current record wherever safely
// possible, without ever touching a row referenced by evaluation history:
//   - an ACTIVE row in the group is always kept as-is (never auto-reactivated
//     out from under it, never deleted).
//   - with no active row, the newest inactive row becomes the reuse candidate
//     (reactivating it is a separate, explicit action - never automatic here).
//   - every other row in the group is deleted if unused, or preserved if it's
//     referenced by evaluation_criterion_scores (protects audit history).
async function planDuplicateCleanup() {
  const [rows, scoreRows] = await Promise.all([
    EvaluationCriteria.findAll({ order: [['id', 'ASC']] }),
    EvaluationCriterionScore.findAll({ attributes: ['evaluation_criteria_id'] })
  ]);
  const usedIds = new Set(scoreRows.map((r) => r.evaluation_criteria_id));

  const groups = new Map();
  rows.forEach((row) => {
    const key = normalizeName(row.criteria_name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  const plan = [];
  groups.forEach((group, normalizedName) => {
    if (group.length < 2) return;

    const activeRecord = group.find((c) => c.is_active) ?? null;
    const newestInactive = group
      .filter((c) => !c.is_active)
      .sort((a, b) => b.id - a.id)[0] ?? null;
    const keep = activeRecord ?? newestInactive ?? group[0];

    const toDelete = [];
    const preserved = [];
    group.forEach((c) => {
      if (c.id === keep.id) return;
      const summary = { id: c.id, criteria_name: c.criteria_name, is_active: c.is_active, weight_percentage: Number(c.weight_percentage) };
      if (usedIds.has(c.id)) {
        preserved.push(summary);
      } else {
        toDelete.push(summary);
      }
    });

    plan.push({
      normalized_name: normalizedName,
      keep: { id: keep.id, criteria_name: keep.criteria_name, is_active: keep.is_active, weight_percentage: Number(keep.weight_percentage) },
      // Only set when nothing in the group is active - reusing this record
      // means reactivating it, which the caller must still do explicitly.
      reactivate_candidate_id: activeRecord ? null : keep.id,
      delete: toDelete,
      preserved
    });
  });

  return plan;
}

// Executes exactly the plan above: hard-deletes only the rows it marked safe
// to delete (unused duplicates). Never reactivates, never deletes a row used
// by an evaluation, never touches groups of size 1. Must be explicitly
// triggered - never runs automatically.
async function cleanupDuplicates() {
  const plan = await planDuplicateCleanup();
  const deleted = [];
  for (const group of plan) {
    for (const row of group.delete) {
      // eslint-disable-next-line no-await-in-loop
      await EvaluationCriteria.destroy({ where: { id: row.id } });
      deleted.push(row);
    }
  }
  return { deleted, groups_cleaned: plan.filter((g) => g.delete.length > 0).length };
}

module.exports = {
  getActiveWeightTotal,
  listCriteria,
  createCriterion,
  updateCriterion,
  deactivateCriterion,
  reactivateCriterion,
  deleteCriterionPermanently,
  planDuplicateCleanup,
  cleanupDuplicates
};
