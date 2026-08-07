const evaluationService = require('../services/evaluationService');

const handleError = (res, error, label) => {
  if (error.status) {
    return res.status(error.status).json({ status: 'error', message: error.message, ...(error.body || {}) });
  }
  console.error(`Error in ${label}:`, error);
  return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
};

const createEvaluation = async (req, res) => {
  try {
    const tenderId = parseInt(req.params.tenderId, 10);
    const evaluation = await evaluationService.createEvaluationFromTender(tenderId, req.user.id);
    res.status(201).json({
      id: evaluation.id,
      tender_id: evaluation.tender_id,
      status: evaluation.status,
      evaluated_by: evaluation.evaluated_by,
      created_at: evaluation.created_at
    });
  } catch (error) {
    handleError(res, error, 'evaluation.createEvaluation');
  }
};

const listForTender = async (req, res) => {
  try {
    const tenderId = parseInt(req.params.tenderId, 10);
    const evaluations = await evaluationService.listEvaluationsForTender(tenderId);
    res.status(200).json({
      data: evaluations.map((e) => ({
        id: e.id,
        status: e.status,
        pqm_score: e.pqm_score,
        evaluation_date: e.evaluation_date,
        created_at: e.created_at
      }))
    });
  } catch (error) {
    handleError(res, error, 'evaluation.listForTender');
  }
};

const getDetail = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const detail = await evaluationService.getEvaluationDetail(id);
    res.status(200).json(detail);
  } catch (error) {
    handleError(res, error, 'evaluation.getDetail');
  }
};

const saveDraftScores = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const detail = await evaluationService.saveDraftScores(id, req.body.scores, req.user.id);
    res.status(200).json(detail);
  } catch (error) {
    handleError(res, error, 'evaluation.saveDraftScores');
  }
};

const submitEvaluation = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const evaluation = await evaluationService.submitEvaluation(id);
    res.status(200).json({
      id: evaluation.id,
      status: evaluation.status,
      price_score: evaluation.price_score,
      quality_score: evaluation.quality_score,
      pqm_score: evaluation.pqm_score,
      evaluation_date: evaluation.evaluation_date
    });
  } catch (error) {
    handleError(res, error, 'evaluation.submitEvaluation');
  }
};

const reprocess = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const evaluation = await evaluationService.reprocessEvaluation(id, req.user.id);
    res.status(201).json({
      id: evaluation.id,
      tender_id: evaluation.tender_id,
      status: evaluation.status,
      evaluated_by: evaluation.evaluated_by,
      created_at: evaluation.created_at
    });
  } catch (error) {
    handleError(res, error, 'evaluation.reprocess');
  }
};

const listCompleted = async (req, res) => {
  try {
    const tenderId = req.query.tender_id ? parseInt(req.query.tender_id, 10) : undefined;
    const evaluations = await evaluationService.listCompletedEvaluations({ tenderId });
    res.status(200).json({ data: evaluations });
  } catch (error) {
    handleError(res, error, 'evaluation.listCompleted');
  }
};

module.exports = {
  createEvaluation,
  listForTender,
  getDetail,
  saveDraftScores,
  submitEvaluation,
  reprocess,
  listCompleted
};
