const sequelize = require('../config/database');
const ScoringArchive = require('./scoringArchive');
const User = require('./user');
const Tender = require('./tender');
const TenderDocument = require('./tenderDocument');
const EligibilityCheck = require('./eligibilityCheck');
const BcaGradeLimit = require('./bcaGradeLimit');
const EligibilityThreshold = require('./eligibilityThreshold');

// Associations - defined here (not in the model files) so every model is already
// required before any association referencing another model is set up.
Tender.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Tender.hasMany(TenderDocument, { foreignKey: 'tender_id', as: 'documents', onDelete: 'CASCADE' });
Tender.hasMany(EligibilityCheck, { foreignKey: 'tender_id', as: 'eligibilityChecks', onDelete: 'CASCADE' });

TenderDocument.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
TenderDocument.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

EligibilityCheck.belongsTo(Tender, { foreignKey: 'tender_id', as: 'tender' });
EligibilityCheck.belongsTo(User, { foreignKey: 'checked_by', as: 'reviewer' });

EligibilityThreshold.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });

// Export models and connection
module.exports = {
  sequelize,
  ScoringArchive,
  User,
  Tender,
  TenderDocument,
  EligibilityCheck,
  BcaGradeLimit,
  EligibilityThreshold
};
