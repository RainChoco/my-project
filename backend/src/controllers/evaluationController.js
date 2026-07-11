const evaluationService = require('../services/evaluationService');

const handleError = (res, error, label) => {
  if (error.status) {
    return res.status(error.status).json(error.body || { status: 'error', message: error.message });
  }
  console.error(`Error in ${label}:`, error);
  return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
};

const processForEvaluation = async (req, res) => {
  try {
    const tenderId = parseInt(req.params.tenderId, 10);
    const { document_ids } = req.body;
    const evaluation = await evaluationService.processTenderForEvaluation(tenderId, document_ids, req.user.id);
    res.status(202).json({
      id: evaluation.id,
      tender_id: evaluation.tender_id,
      status: evaluation.status,
      evaluated_by: evaluation.evaluated_by,
      created_at: evaluation.created_at
    });
  } catch (error) {
    handleError(res, error, 'evaluation.processForEvaluation');
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

const confirmInputs = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const evaluation = await evaluationService.confirmInputs(id, req.body.ai_extracted_inputs);
    res.status(200).json({
      id: evaluation.id,
      status: evaluation.status,
      price_score: evaluation.price_score,
      quality_score: evaluation.quality_score,
      pqm_score: evaluation.pqm_score,
      evaluation_date: evaluation.evaluation_date
    });
  } catch (error) {
    handleError(res, error, 'evaluation.confirmInputs');
  }
};

const reprocess = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { document_ids } = req.body;
    const evaluation = await evaluationService.reprocessEvaluation(id, document_ids, req.user.id);
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

module.exports = { processForEvaluation, listForTender, getDetail, confirmInputs, reprocess };
