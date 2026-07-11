const sequelize = require('../config/database');
const ScoringArchive = require('./scoringArchive');
const User = require('./user');
const EvaluationCriteria = require('./evaluationCriteria');
const Evaluation = require('./evaluation');
const Approval = require('./approval');
const BoardPaper = require('./BoardPaper');
const Proposal = require('./Proposal');

// --- Associations (Jerrold: Processing Tender Form w/ Evaluation Criteria, Approval Process) ---

EvaluationCriteria.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(EvaluationCriteria, { as: 'criteriaCreated', foreignKey: 'created_by' });

Evaluation.belongsTo(User, { as: 'evaluator', foreignKey: 'evaluated_by' });
User.hasMany(Evaluation, { as: 'evaluationsDone', foreignKey: 'evaluated_by' });

Evaluation.hasMany(Approval, { foreignKey: 'evaluation_id', onDelete: 'CASCADE' });
Approval.belongsTo(Evaluation, { foreignKey: 'evaluation_id' });

Approval.belongsTo(User, { as: 'approver', foreignKey: 'approver_id' });
User.hasMany(Approval, { as: 'approvalsDecided', foreignKey: 'approver_id' });

// NOTE: Evaluation.belongsTo(Tender, { foreignKey: 'tender_id' }) is intentionally
// omitted - Zheng Hong's Tender model/migration (Scope A) isn't merged into this repo
// yet (no backend/src/models/tender.js or create-tenders migration exists). The
// tender_id FK column and its DB-level constraint (see the evaluations migration)
// are in place; add the Sequelize association here once his model is merged.

// Export models and connection
module.exports = {
  sequelize,
  ScoringArchive,
  User,
  EvaluationCriteria,
  Evaluation,
  Approval,
  BoardPaper,
  Proposal
};
