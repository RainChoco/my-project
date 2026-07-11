const approvalService = require('../services/approvalService');

const handleError = (res, error, label) => {
  if (error.status) {
    return res.status(error.status).json({ status: 'error', message: error.message });
  }
  console.error(`Error in ${label}:`, error);
  return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
};

const create = async (req, res) => {
  try {
    const evaluationId = parseInt(req.params.id, 10);
    const { decision, remarks } = req.body;
    const approval = await approvalService.createApproval(evaluationId, { decision, remarks }, req.user.id);
    res.status(201).json({
      id: approval.id,
      evaluation_id: approval.evaluation_id,
      approver_id: approval.approver_id,
      decision: approval.decision,
      remarks: approval.remarks,
      decided_at: approval.decided_at
    });
  } catch (error) {
    handleError(res, error, 'approval.create');
  }
};

const list = async (req, res) => {
  try {
    const evaluationId = parseInt(req.params.id, 10);
    const approvals = await approvalService.listApprovals(evaluationId);
    res.status(200).json({
      data: approvals.map((a) => ({
        id: a.id,
        approver_id: a.approver_id,
        decision: a.decision,
        remarks: a.remarks,
        decided_at: a.decided_at
      }))
    });
  } catch (error) {
    handleError(res, error, 'approval.list');
  }
};

module.exports = { create, list };
