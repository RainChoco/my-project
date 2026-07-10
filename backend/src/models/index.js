const sequelize = require('../config/database');
const ScoringArchive = require('./scoringArchive');

// Export models and connection
module.exports = {
  sequelize,
  ScoringArchive
};
