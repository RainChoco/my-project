const { QueryTypes } = require('sequelize');
const { Evaluation, EvaluationCriteria, sequelize } = require('../models');
const aiExtractionService = require('./aiExtractionService');

const round2 = (n) => Math.round(n * 100) / 100;

// tenders is Zheng Hong's table (Scope A) - no Sequelize model/migration for it
// exists in this repo yet (see models/index.js note), so this reads the columns
// we need via a parameterized raw query instead of a duplicate model.
async function getTenderById(tenderId) {
  const rows = await sequelize.query(
    'SELECT id, eligibility_status FROM tenders WHERE id = :tenderId',
    { replacements: { tenderId }, type: QueryTypes.SELECT }
  );
  return rows[0] || null;
}

// Deterministic PQM scoring (UC-B5) - runs in code, never via the LLM, and is
// never accepted directly from the client (confirm-inputs only ever sends
// ai_extracted_inputs; price_score/quality_score/pqm_score are always
// recomputed here).
//
// NOTE: none of design/jerrold's three docs specify the actual price/quality
// scoring formula - only the input field names (main_offer_price,
// alternative_offer_price, technical_proposal_score_raw) and that scores are
// weighted by the active evaluation_criteria. The formula below is a
// placeholder that satisfies the structural rules (backend-computed, clamped
// to each criterion's weight as its max, deterministic) - it should be
// reviewed/replaced with the team's real business formula.
function calculatePqmScore(aiExtractedInputs, activeCriteria) {
  const inputs = aiExtractedInputs || {};
  const priceCriteria = activeCriteria.filter((c) => c.category === 'price');
  const qualityCriteria = activeCriteria.filter((c) => c.category === 'quality');
  const priceWeightTotal = priceCriteria.reduce((sum, c) => sum + Number(c.weight_percentage), 0);
  const qualityWeightTotal = qualityCriteria.reduce((sum, c) => sum + Number(c.weight_percentage), 0);

  const missingFields = [];
  if (priceCriteria.length > 0 && (inputs.main_offer_price === null || inputs.main_offer_price === undefined)) {
    missingFields.push('main_offer_price');
  }
  if (qualityCriteria.length > 0 && (inputs.technical_proposal_score_raw === null || inputs.technical_proposal_score_raw === undefined)) {
    missingFields.push('technical_proposal_score_raw');
  }

  if (missingFields.length > 0) {
    return { missingFields };
  }

  let priceScore = 0;
  if (priceCriteria.length > 0) {
    const mainPrice = Number(inputs.main_offer_price);
    const altPrice = inputs.alternative_offer_price != null ? Number(inputs.alternative_offer_price) : null;
    if (altPrice && altPrice > 0 && mainPrice > 0) {
      const discountRatio = Math.max(0, (mainPrice - altPrice) / mainPrice);
      const competitiveness = Math.min(1, discountRatio * 5);
      priceScore = round2(competitiveness * priceWeightTotal);
    } else {
      priceScore = priceWeightTotal;
    }
  }
  // Criterion scores can never be below 0 or exceed that criterion's own
  // weight (its maximum), regardless of the formula above.
  priceScore = Math.min(priceWeightTotal, Math.max(0, priceScore));

  let qualityScore = 0;
  if (qualityCriteria.length > 0) {
    const raw = Math.min(100, Math.max(0, Number(inputs.technical_proposal_score_raw)));
    qualityScore = round2((raw / 100) * qualityWeightTotal);
  }
  qualityScore = Math.min(qualityWeightTotal, Math.max(0, qualityScore));

  const pqmScore = round2(priceScore + qualityScore);
  return { priceScore, qualityScore, pqmScore, missingFields: [] };
}

async function processTenderForEvaluation(tenderId, documentIds, evaluatorId) {
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

  let extractedInputs;
  try {
    extractedInputs = await aiExtractionService.extractTenderInputs({ tenderId, documentIds });
  } catch (aiError) {
    const err = new Error('AI extraction service failed');
    err.status = 502;
    throw err;
  }

  return Evaluation.create({
    tender_id: tenderId,
    evaluated_by: evaluatorId,
    status: 'processing',
    ai_extracted_inputs: extractedInputs
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
  const evaluation = await Evaluation.findByPk(id);
  if (!evaluation) {
    const err = new Error('Evaluation not found');
    err.status = 404;
    throw err;
  }

  const activeCriteria = await EvaluationCriteria.findAll({ where: { is_active: true } });
  const detail = evaluation.toJSON();
  detail.criteria_used = activeCriteria.map((c) => ({
    criteria_name: c.criteria_name,
    category: c.category,
    weight_percentage: c.weight_percentage
  }));

  if (evaluation.status === 'incomplete') {
    const { missingFields } = calculatePqmScore(evaluation.ai_extracted_inputs, activeCriteria);
    detail.missing_fields = missingFields;
  }

  return detail;
}

// UC-B4 step 5 -> UC-B5: evaluator confirms/corrects the extracted inputs, which
// triggers deterministic PQM computation. Only ai_extracted_inputs is ever
// accepted from the client - price_score/quality_score/pqm_score are always
// derived here, never taken from the request body.
async function confirmInputs(id, aiExtractedInputs) {
  const evaluation = await Evaluation.findByPk(id);
  // 'incomplete' must remain re-enterable here, not just 'processing' - otherwise
  // UC-B5's "evaluator supplies the missing input" path would be a dead end once
  // an evaluation first lands on 'incomplete'.
  if (!evaluation || !['processing', 'incomplete'].includes(evaluation.status)) {
    const err = new Error("Evaluation not found or not awaiting input confirmation");
    err.status = 404;
    throw err;
  }

  const mergedInputs = { ...(evaluation.ai_extracted_inputs || {}), ...aiExtractedInputs };
  const activeCriteria = await EvaluationCriteria.findAll({ where: { is_active: true } });
  const result = calculatePqmScore(mergedInputs, activeCriteria);

  if (result.missingFields.length > 0) {
    evaluation.ai_extracted_inputs = mergedInputs;
    evaluation.status = 'incomplete';
    await evaluation.save();

    const err = new Error('Required inputs are missing for the active evaluation criteria');
    err.status = 422;
    err.body = { id: evaluation.id, status: 'incomplete', missing_fields: result.missingFields };
    throw err;
  }

  evaluation.ai_extracted_inputs = mergedInputs;
  evaluation.price_score = result.priceScore;
  evaluation.quality_score = result.qualityScore;
  evaluation.pqm_score = result.pqmScore;
  evaluation.status = 'scored';
  evaluation.evaluation_date = new Date();
  await evaluation.save();
  return evaluation;
}

// UC-B11: re-evaluating a rejected tender always creates a NEW evaluations row;
// the rejected row and its approvals history are left untouched.
async function reprocessEvaluation(id, documentIds, evaluatorId) {
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

  let extractedInputs;
  try {
    extractedInputs = await aiExtractionService.extractTenderInputs({ tenderId: source.tender_id, documentIds });
  } catch (aiError) {
    const err = new Error('AI extraction service failed');
    err.status = 502;
    throw err;
  }

  return Evaluation.create({
    tender_id: source.tender_id,
    evaluated_by: evaluatorId,
    status: 'processing',
    ai_extracted_inputs: extractedInputs
  });
}

module.exports = {
  getTenderById,
  calculatePqmScore,
  processTenderForEvaluation,
  listEvaluationsForTender,
  getEvaluationDetail,
  confirmInputs,
  reprocessEvaluation
};
