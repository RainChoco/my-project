const sequelize = require('../config/database');
const ScoringArchive = require('./scoringArchive');
const Contract = require('./Contract');
const User = require('./user');
const Tender = require('./tender');
const TenderDocument = require('./tenderDocument');
const EligibilityCheck = require('./eligibilityCheck');
const BcaGradeLimit = require('./bcaGradeLimit');
const EligibilityThreshold = require('./eligibilityThreshold');
const EvaluationCriteria = require('./evaluationCriteria');
const Evaluation = require('./evaluation');
const EvaluationCriterionScore = require('./evaluationCriterionScore');
const Approval = require('./approval');
const BoardPaper = require('./BoardPaper');
const Proposal = require('./Proposal');
const ClarificationLog = require('./clarificationLog');
const ClarificationMessage = require('./clarificationMessage');
const ClarificationAttachment = require('./clarificationAttachment');
const JobAdjustmentRequest = require('./jobAdjustmentRequest');

// Associations - defined here (not in the model files) so every model is already
// required before any association referencing another model is set up.

// --- Kai Xuan: Contract → Tender (Contract Opportunity is the parent of Tenders) ---
Contract.hasMany(Tender, { foreignKey: 'contractId', as: 'tenders' });
Tender.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });

// --- Zheng Hong: Tender Submission ---
Tender.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Tender.hasMany(TenderDocument, { foreignKey: 'tender_id', as: 'documents', onDelete: 'CASCADE' });
Tender.hasMany(EligibilityCheck, { foreignKey: 'tender_id', as: 'eligibilityChecks', onDelete: 'CASCADE' });

TenderDocument.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
TenderDocument.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

EligibilityCheck.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
EligibilityCheck.belongsTo(User, { foreignKey: 'checked_by', as: 'reviewer' });

EligibilityThreshold.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });

// --- Jerrold: Processing Tender Form w/ Evaluation Criteria, Approval Process ---

EvaluationCriteria.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(EvaluationCriteria, { as: 'criteriaCreated', foreignKey: 'created_by' });

Evaluation.belongsTo(User, { as: 'evaluator', foreignKey: 'evaluated_by' });
User.hasMany(Evaluation, { as: 'evaluationsDone', foreignKey: 'evaluated_by' });

Evaluation.hasMany(Approval, { foreignKey: 'evaluation_id', onDelete: 'CASCADE' });
Approval.belongsTo(Evaluation, { foreignKey: 'evaluation_id' });

Approval.belongsTo(User, { as: 'approver', foreignKey: 'approver_id' });
User.hasMany(Approval, { as: 'approvalsDecided', foreignKey: 'approver_id' });

// FK name matches the evaluations migration (tender_id -> tenders.id) - now that
// Zheng Hong's Tender model is merged, this association is safe to wire up.
Evaluation.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
Tender.hasMany(Evaluation, { foreignKey: 'tender_id' });

Evaluation.hasMany(EvaluationCriterionScore, { as: 'criterionScores', foreignKey: 'evaluation_id', onDelete: 'CASCADE' });
EvaluationCriterionScore.belongsTo(Evaluation, { foreignKey: 'evaluation_id', as: 'evaluations' });

EvaluationCriterionScore.belongsTo(EvaluationCriteria, { as: 'criterion', foreignKey: 'evaluation_criteria_id' });
EvaluationCriteria.hasMany(EvaluationCriterionScore, { foreignKey: 'evaluation_criteria_id' });

// --- Sulaiman: Scope D - Alternate Proposal Communication System ---

ClarificationLog.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
ClarificationLog.belongsTo(User, { foreignKey: 'escalated_by', as: 'escalatedByUser' });
ClarificationLog.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolvedByUser' });
ClarificationLog.hasMany(ClarificationMessage, { foreignKey: 'clarification_log_id', as: 'messages', onDelete: 'CASCADE' });
ClarificationLog.hasMany(JobAdjustmentRequest, { foreignKey: 'clarification_log_id', as: 'jobAdjustmentRequests', onDelete: 'CASCADE' });

ClarificationMessage.belongsTo(ClarificationLog, { foreignKey: 'clarification_log_id', as: 'clarificationLog' });
ClarificationMessage.belongsTo(ClarificationMessage, { foreignKey: 'source_draft_id', as: 'sourceDraft' });
ClarificationMessage.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
ClarificationMessage.belongsTo(User, { foreignKey: 'created_by', as: 'author' });
ClarificationMessage.hasMany(ClarificationAttachment, { foreignKey: 'clarification_message_id', as: 'attachments', onDelete: 'CASCADE' });

ClarificationAttachment.belongsTo(ClarificationMessage, { foreignKey: 'clarification_message_id', as: 'message' });

JobAdjustmentRequest.belongsTo(ClarificationLog, { foreignKey: 'clarification_log_id', as: 'clarificationLog' });
JobAdjustmentRequest.belongsTo(ClarificationLog, { foreignKey: 'follow_up_clarification_log_id', as: 'followUpNotification' });
JobAdjustmentRequest.belongsTo(ClarificationMessage, { foreignKey: 'source_message_id', as: 'sourceMessage' });
JobAdjustmentRequest.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
JobAdjustmentRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
JobAdjustmentRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Export models and connection
module.exports = {
  sequelize,
  ScoringArchive,
  Contract,
  User,
  Tender,
  TenderDocument,
  EligibilityCheck,
  BcaGradeLimit,
  EligibilityThreshold,
  EvaluationCriteria,
  Evaluation,
  EvaluationCriterionScore,
  Approval,
  BoardPaper,
  Proposal,
  ClarificationLog,
  ClarificationMessage,
  ClarificationAttachment,
  JobAdjustmentRequest
};
