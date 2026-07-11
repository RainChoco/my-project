const { Approval, Evaluation, sequelize } = require('../models');

// 'revision_requested' intentionally has no entry here: it doesn't finalize the
// evaluation. evaluations.status has no matching value for it (only 'approved'/
// 'rejected' per database-schema.md), so the evaluation stays 'scored' and the
// evaluator can revise the same evaluation and it can be resubmitted for approval.
const DECISION_TO_EVALUATION_STATUS = {
  approved: 'approved',
  rejected: 'rejected'
};

// Locks the evaluation row for the duration of the check+write so two
// concurrent approval submissions can't both read status: 'scored' before
// either commits - without this, both could pass the check and each create
// their own Approval row, leaving two conflicting decisions logged instead
// of one (see dashboardService.js#archiveScoringList for the same pattern).
async function createApproval(evaluationId, { decision, remarks }, approverId) {
  return sequelize.transaction(async (t) => {
    const evaluation = await Evaluation.findByPk(evaluationId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!evaluation) {
      const err = new Error('Evaluation not found');
      err.status = 404;
      throw err;
    }

    // "a tender cannot be approved before evaluation is completed" - applies to
    // every decision here, not just 'approved': you can't make any go/no-go call
    // on an evaluation that hasn't finished scoring (UC-B9's trigger condition).
    if (evaluation.status !== 'scored') {
      const err = new Error('Evaluation must be fully scored before an approval decision can be logged');
      err.status = 409;
      throw err;
    }

    const approval = await Approval.create({
      evaluation_id: evaluationId,
      approver_id: approverId,
      decision,
      remarks: remarks || null
    }, { transaction: t });

    const newStatus = DECISION_TO_EVALUATION_STATUS[decision];
    if (newStatus) {
      evaluation.status = newStatus;
      await evaluation.save({ transaction: t });
    }

    return approval;
  });
}

async function listApprovals(evaluationId) {
  const evaluation = await Evaluation.findByPk(evaluationId);
  if (!evaluation) {
    const err = new Error('Evaluation not found');
    err.status = 404;
    throw err;
  }
  return Approval.findAll({ where: { evaluation_id: evaluationId }, order: [['decided_at', 'ASC']] });
}

module.exports = { createApproval, listApprovals };
