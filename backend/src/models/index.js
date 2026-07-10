const sequelize = require('../config/database');
const ScoringArchive = require('./scoringArchive');
const User = require('./user');

// Export models and connection
module.exports = {
  sequelize,
  ScoringArchive,
  User
};
