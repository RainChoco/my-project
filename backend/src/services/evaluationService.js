const { Evaluation, EvaluationCriteria, EvaluationCriterionScore, Tender, sequelize } = require('../models');

const round2 = (n) => Math.round(n * 100) / 100;

async function getTenderById(tenderId) {
  return Tender.findByPk(tenderId);
}

async function getActiveCriteriaOrThrow() {
  const activeCriteria = await EvaluationCriteria.findAll({ where: { is_active: true } });
  const activeWeightTotal = round2(activeCriteria.reduce((sum, c) => sum + Number(c.weight_percentage), 0));

  if (activeCriteria.length === 0 || Math.abs(activeWeightTotal - 100) > 0.01) {
    const err = new Error('Active evaluation criteria must total exactly 100% before an evaluation can be scored');
    err.status = 409;
    err.body = { active_weight_total: activeWeightTotal };
    throw err;
  }

  return activeCriteria;
}

function toDetailJson(evaluation) {
  const detail = evaluation.toJSON();
  detail.tender_ref_no = evaluation.tender?.tender_ref_no ?? null;
  detail.vendor_name = evaluation.tender?.vendor_name ?? null;
  detail.criterion_scores = (detail.criterionScores || []).map((s) => ({
    id: s.id,
    evaluation_criteria_id: s.evaluation_criteria_id,
    criteria_name: s.criteria_name_snapshot,
    category: s.category_snapshot,
    weight_percentage: s.weight_percentage_snapshot,
    staff_score: s.staff_score,
    weighted_score: s.weighted_score,
    remarks: s.remarks
  }));
  delete detail.criterionScores;
  delete detail.tender;
  return detail;
}

// Tender selected -> create evaluation -> load active criteria as a fresh set
// of unscored criterion-score rows, snapshotting name/category/weight so later
// edits to evaluation_criteria never alter this evaluation's historical record.
async function createEvaluationFromTender(tenderId, evaluatorId) {
  const tender = await getTenderById(tenderId);
  if (!tender) {
    const err = new Error('Tender not found');
    err.status = 404;
    throw err;
  }
  if (tender.eligibility_status === 'rejected') {
    const err = new Error('Tender is not eligible for evaluation');
    err.status = 409;
    err.body = { error: 'tender_ineligible', eligibility_status: 'rejected' };
    throw err;
  }

  const inProgress = await Evaluation.findOne({ where: { tender_id: tenderId, status: 'processing' } });
  if (inProgress) {
    const err = new Error('An evaluation is already in progress for this tender');
    err.status = 409;
    err.body = { error: 'evaluation_in_progress', evaluation_id: inProgress.id };
    throw err;
  }

  const activeCriteria = await getActiveCriteriaOrThrow();

  return sequelize.transaction(async (t) => {
    const evaluation = await Evaluation.create({
      tender_id: tenderId,
      evaluated_by: evaluatorId,
      status: 'processing'
    }, { transaction: t });

    await EvaluationCriterionScore.bulkCreate(
      activeCriteria.map((c) => ({
        evaluation_id: evaluation.id,
        evaluation_criteria_id: c.id,
        criteria_name_snapshot: c.criteria_name,
        category_snapshot: c.category,
        weight_percentage_snapshot: c.weight_percentage,
        staff_score: null,
        weighted_score: null,
        remarks: null
      })),
      { transaction: t }
    );

    return evaluation;
  });
}

async function listEvaluationsForTender(tenderId) {
  const tender = await getTenderById(tenderId);
  if (!tender) {
    const err = new Error('Tender not found');
    err.status = 404;
    throw err;
  }
  return Evaluation.findAll({ where: { tender_id: tenderId }, order: [['created_at', 'ASC']] });
}

async function getEvaluationDetail(id) {
  const evaluation = await Evaluation.findByPk(id, {
    include: [
      { model: EvaluationCriterionScore, as: 'criterionScores' },
      { model: Tender, as: 'tender' }
    ]
  });
  if (!evaluation) {
    const err = new Error('Evaluation not found');
    err.status = 404;
    throw err;
  }
  return toDetailJson(evaluation);
}

// Staff enters a score + optional remarks for each criterion. Draft saves can be
// partial - weighted_score is recomputed here (never trusted from the client) so
// the UI can show a live, backend-verified contribution even before final submit.
async function saveDraftScores(evaluationId, scores, evaluatorId) {
  const evaluation = await Evaluation.findByPk(evaluationId, {
    include: [{ model: EvaluationCriterionScore, as: 'criterionScores' }]
  });
  if (!evaluation) {
    const err = new Error('Evaluation not found');
    err.status = 404;
    throw err;
  }
  if (evaluation.status !== 'processing') {
    const err = new Error('Only a draft evaluation (status: processing) can have its scores edited');
    err.status = 409;
    throw err;
  }

  const scoreRowsById = new Map(evaluation.criterionScores.map((row) => [row.evaluation_criteria_id, row]));

  return sequelize.transaction(async (t) => {
    for (const entry of scores) {
      const row = scoreRowsById.get(entry.evaluation_criteria_id);
      if (!row) {
        const err = new Error(`Evaluation criteria id ${entry.evaluation_criteria_id} is not part of this evaluation`);
        err.status = 400;
        throw err;
      }

      const staffScore = entry.staff_score === undefined ? row.staff_score : entry.staff_score;
      row.staff_score = staffScore;
      row.weighted_score = staffScore === null || staffScore === undefined
        ? null
        : round2((Number(staffScore) / 100) * Number(row.weight_percentage_snapshot));
      if (entry.remarks !== undefined) {
        row.remarks = entry.remarks;
      }
      await row.save({ transaction: t });
    }

    return Evaluation.findByPk(evaluationId, {
      include: [
        { model: EvaluationCriterionScore, as: 'criterionScores' },
        { model: Tender, as: 'tender' }
      ],
      transaction: t
    });
  }).then(toDetailJson);
}

// Backend validates every criterion is scored, then calculates the weighted
// total in code. The frontend never submits a pqm_score - it is always derived
// here from staff_score / 100 * weight_percentage for each criterion.
async function submitEvaluation(evaluationId) {
  const evaluation = await Evaluation.findByPk(evaluationId, {
    include: [{ model: EvaluationCriterionScore, as: 'criterionScores' }]
  });
  if (!evaluation) {
    const err = new Error('Evaluation not found');
    err.status = 404;
    throw err;
  }
  if (evaluation.status !== 'processing') {
    const err = new Error('Only a draft evaluation (status: processing) can be submitted');
    err.status = 409;
    throw err;
  }

  const missingCriteria = evaluation.criterionScores
    .filter((row) => row.staff_score === null || row.staff_score === undefined)
    .map((row) => ({ evaluation_criteria_id: row.evaluation_criteria_id, criteria_name: row.criteria_name_snapshot }));

  if (missingCriteria.length > 0) {
    const err = new Error('Every active criterion must have a staff score before an evaluation can be submitted');
    err.status = 422;
    err.body = { id: evaluation.id, status: 'processing', missing_criteria: missingCriteria };
    throw err;
  }

  return sequelize.transaction(async (t) => {
    let priceScore = 0;
    let qualityScore = 0;

    for (const row of evaluation.criterionScores) {
      const weightedScore = round2((Number(row.staff_score) / 100) * Number(row.weight_percentage_snapshot));
      row.weighted_score = weightedScore;
      await row.save({ transaction: t });

      if (row.category_snapshot === 'price') {
        priceScore += weightedScore;
      } else {
        qualityScore += weightedScore;
      }
    }

    evaluation.price_score = round2(priceScore);
    evaluation.quality_score = round2(qualityScore);
    evaluation.pqm_score = round2(priceScore + qualityScore);
    evaluation.status = 'scored';
    evaluation.evaluation_date = new Date();
    await evaluation.save({ transaction: t });

    return evaluation;
  });
}

// UC-B11: re-evaluating a rejected tender always creates a NEW evaluations row
// with a fresh set of criterion scores (against the currently active criteria);
// the rejected row and its approvals history are left untouched.
async function reprocessEvaluation(id, evaluatorId) {
  const source = await Evaluation.findByPk(id);
  if (!source) {
    const err = new Error('Evaluation not found');
    err.status = 404;
    throw err;
  }
  if (source.status !== 'rejected') {
    const err = new Error('Only a rejected evaluation can be reprocessed');
    err.status = 409;
    throw err;
  }

  const activeCriteria = await getActiveCriteriaOrThrow();

  return sequelize.transaction(async (t) => {
    const evaluation = await Evaluation.create({
      tender_id: source.tender_id,
      evaluated_by: evaluatorId,
      status: 'processing'
    }, { transaction: t });

    await EvaluationCriterionScore.bulkCreate(
      activeCriteria.map((c) => ({
        evaluation_id: evaluation.id,
        evaluation_criteria_id: c.id,
        criteria_name_snapshot: c.criteria_name,
        category_snapshot: c.category,
        weight_percentage_snapshot: c.weight_percentage,
        staff_score: null,
        weighted_score: null,
        remarks: null
      })),
      { transaction: t }
    );

    return evaluation;
  });
}

// Backs the comparison table - every evaluation that has gone through backend
// PQM calculation at least once, regardless of its later approval decision.
async function listCompletedEvaluations({ tenderId } = {}) {
  const where = { status: ['scored', 'approved', 'rejected'] };
  if (tenderId) {
    where.tender_id = tenderId;
  }

  const evaluations = await Evaluation.findAll({
    where,
    include: [{ model: Tender, as: 'tender' }],
    order: [['evaluation_date', 'DESC']]
  });

  return evaluations.map((e) => ({
    id: e.id,
    tender_id: e.tender_id,
    tender_ref_no: e.tender?.tender_ref_no ?? null,
    vendor_name: e.tender?.vendor_name ?? null,
    status: e.status,
    price_score: e.price_score,
    quality_score: e.quality_score,
    pqm_score: e.pqm_score,
    evaluation_date: e.evaluation_date
  }));
}

module.exports = {
  getTenderById,
  createEvaluationFromTender,
  listEvaluationsForTender,
  getEvaluationDetail,
  saveDraftScores,
  submitEvaluation,
  reprocessEvaluation,
  listCompletedEvaluations
};
